import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Central configuration for API endpoints.
// Auto-detects local host IP from Expo Constants when running in local development mode
// so that testing on physical mobile devices connects successfully to the server.
const getApiUrl = () => {
  // If running in production mode (production APK/AAB or App Store bundle), use the public production URL
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    const prodUrl = 'https://api.marcosbespoke.com/api/v1'; // Replace with your production domain
    console.log('[API] Production build: using server URL:', prodUrl);
    return prodUrl;
  }

  // ── Connection Strategy (Development) ────────────────────────────────────────
  // BEST: Use 'adb reverse tcp:5000 tcp:5000' (USB physical device) → set to 'localhost'
  // ALT:  Use your machine's LAN IP (Wi-Fi/Ethernet) for physical device on same network.
  //
  // Current active LAN IP: 192.168.29.63 (Wi-Fi)
  // adb reverse IS ACTIVE → using localhost (most reliable for USB).
  const PRIMARY_IP = 'localhost'; // ← adb reverse active
  const SECONDARY_IP = '192.168.29.63'; // LAN IP fallback if adb reverse fails

  // 1. If adb reverse is active (PRIMARY_IP = 'localhost') — most reliable for USB devices.
  if (PRIMARY_IP === 'localhost') {
    const url = 'http://localhost:5000/api/v1';
    console.log('[API] Using adb reverse tunnel (localhost):', url);
    return url;
  }

  // 2. Try to get the host machine's IP from Expo Constants.
  // This auto-detects the IP for physical devices / emulators on the same Wi-Fi network.
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;

  if (hostUri) {
    const localIp = hostUri.split(':')[0];
    if (localIp && localIp !== 'localhost' && localIp !== '127.0.0.1') {
      const url = `http://${localIp}:5000/api/v1`;
      console.log('[API] Auto-detected Expo hostUri IP:', url);
      return url;
    }
  }

  // 3. Android EMULATOR loopback — 10.0.2.2 maps to host's 127.0.0.1 inside the emulator.
  // NOTE: Only use this for emulators, NOT physical devices (10.0.2.2 won't work on real devices).
  // To detect emulator: device model is typically 'sdk_gphone' or similar.
  const isEmulator = Constants.expoConfig?.hostUri?.includes('10.0.2.2') ||
    Constants.manifest?.hostUri?.includes('10.0.2.2');
  if (Platform.OS === 'android' && isEmulator) {
    const url = 'http://10.0.2.2:5000/api/v1';
    console.log('[API] Android emulator: using 10.0.2.2 loopback:', url);
    return url;
  }

  // 4. Fallback to the primary manually provided IPv4 address
  if (PRIMARY_IP) {
    const url = `http://${PRIMARY_IP}:5000/api/v1`;
    console.log('[API] Using primary manual IPv4 fallback:', url);
    return url;
  }

  // 5. Fallback to secondary
  if (SECONDARY_IP) {
    const url = `http://${SECONDARY_IP}:5000/api/v1`;
    console.log('[API] Using secondary manual IPv4 fallback:', url);
    return url;
  }

  const url = 'http://localhost:5000/api/v1';
  console.log('[API] Using default localhost:', url);
  return url;
};


export const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'x-client-type': 'mobile',
  },
});

let logoutHandler = null;
let tokenRefreshHandler = null;

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

export const setTokenRefreshHandler = (handler) => {
  tokenRefreshHandler = handler;
};

// Request interceptor: Attach Access Token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('Error reading access token from storage:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh mutex — prevents concurrent refresh storms that would trigger RTR security revocation
let isRefreshing = false;
let refreshSubscribers = [];

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

// Response interceptor: Handle expired tokens & auto-refresh
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loops and refresh loops
    const isAuthRoute = originalRequest.url && (
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/register') ||
      originalRequest.url.includes('/auth/otp/') ||
      originalRequest.url.includes('/auth/forgot-password') ||
      originalRequest.url.includes('/auth/reset-password')
    );

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call rotate endpoint
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'x-client-type': 'mobile',
          }
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = refreshResponse.data;

        // Save new credentials
        await AsyncStorage.setItem('accessToken', newAccessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        await AsyncStorage.setItem('userProfile', JSON.stringify(user));

        if (tokenRefreshHandler) {
          tokenRefreshHandler(newAccessToken);
        }

        // Notify all queued requests with the new token
        isRefreshing = false;
        onTokenRefreshed(newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];

        // If refresh fails, clear credentials and sign out
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('userProfile');

        if (logoutHandler) {
          logoutHandler();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;
