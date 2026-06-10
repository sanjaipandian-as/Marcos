import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Central configuration for API endpoints.
// Auto-detects local host IP from Expo Constants when running in local development mode
// so that testing on physical mobile devices connects successfully to the server.
const getApiUrl = () => {
  // Manual overrides based on user's ipconfig:
  // 10.147.177.142 -> Ethernet adapter Ethernet 3 (Most likely for physical device on network)
  // 172.22.192.1   -> vEthernet (WSL/Hyper-V)
  const PRIMARY_IP = '192.168.29.63';
  const SECONDARY_IP = '172.22.192.1';

  // 1. For Android (Emulator/USB-Device), using localhost with 'adb reverse tcp:5000 tcp:5000' is the most reliable.
  // This bypasses Windows Defender Firewall blocking incoming connections on the host machine.
  if (Platform.OS === 'android') {
    const url = 'http://localhost:5000/api/v1';
    console.log('[API] Android detected. Using localhost (Run: adb reverse tcp:5000 tcp:5000):', url);
    return url;
  }

  // 2. Try to get the host machine's IP from Expo Constants.
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;

  if (hostUri) {
    const localIp = hostUri.split(':')[0];
    if (localIp && localIp !== 'localhost' && localIp !== '127.0.0.1') {
      const url = `http://${localIp}:5000/api/v1`;
      console.log('[API] Using Expo hostUri IP:', url);
      return url;
    }
  }

  // 3. Fallback to the primary manually provided IPv4 address (Ethernet 3)
  if (PRIMARY_IP) {
    const url = `http://${PRIMARY_IP}:5000/api/v1`;
    console.log('[API] Using primary manual IPv4 fallback:', url);
    return url;
  }

  // 4. Fallback to secondary (WSL)
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

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
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

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
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
