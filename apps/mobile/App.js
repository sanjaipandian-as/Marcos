import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/NavigationRef';

import { ThemeProvider } from './src/styles/ThemeContext';
import { RootNavigator } from './src/navigation/AppNavigator';
import { ToastProvider } from './src/components/ToastContext';
import { AuthProvider } from './src/contexts/AuthContext';

const linking = {
  prefixes: ['marcos://', 'https://marcos.app', 'https://marcos-xxza.onrender.com'],
  config: {
    screens: {
      MainApp: {
        screens: {
          ProductDetails: 'product/:productId',
        },
      },
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NavigationContainer ref={navigationRef} linking={linking}>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
