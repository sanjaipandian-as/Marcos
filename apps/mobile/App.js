import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemeProvider } from './src/styles/ThemeContext';
import { AuthNavigator, AppNavigator } from './src/navigation/AppNavigator';
import { setLogoutHandler } from './src/utils/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Auto-login session restore on start
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const profileStr = await AsyncStorage.getItem('userProfile');
        if (token && profileStr) {
          setUser(JSON.parse(profileStr));
        }
      } catch (err) {
        console.error('Session restoration error:', err);
      } finally {
        setCheckingSession(false);
      }
    }

    checkExistingSession();
    
    // Wire up global API logout callback
    setLogoutHandler(() => {
      setUser(null);
    });
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userProfile');
    } catch (err) {
      console.error(err);
    }
    setUser(null);
  };

  if (checkingSession) {
    return null; // Keep splash screen or return blank layout while loading
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          {user ? (
            <AppNavigator onLogout={handleLogout} />
          ) : (
            <AuthNavigator onLoginSuccess={handleLoginSuccess} />
          )}
          <StatusBar style="auto" />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
