import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket, disconnectSocket, reconnectSocket } from '../utils/socket';
import { setLogoutHandler, setTokenRefreshHandler } from '../utils/api';
import { navigationRef } from '../navigation/NavigationRef';
import { CommonActions } from '@react-navigation/native';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initSession() {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const profileStr = await AsyncStorage.getItem('userProfile');
        if (token && profileStr) {
          setUser(JSON.parse(profileStr));
          connectSocket(token);
        }
      } catch (err) {
        console.error('Session restoration error:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();

    // Wire up global API logout callback
    setLogoutHandler(() => {
      logout();
    });

    setTokenRefreshHandler((newToken) => {
      reconnectSocket(newToken);
    });
  }, []);

  const login = useCallback(async (userData) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) connectSocket(token);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    disconnectSocket();
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userProfile');
    } catch (err) {
      console.error(err);
    }
    setUser(null);
  }, []);

  const requireAuth = useCallback((callback) => {
    if (user) {
      if (callback) callback();
    } else {
      if (navigationRef.isReady()) {
        navigationRef.navigate('AuthStack');
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, requireAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
