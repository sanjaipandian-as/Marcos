import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../styles/ThemeContext';
import { Platform, View, Text } from 'react-native';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Core Screens
import HomeScreen from '../screens/core/HomeScreen';
import MoreScreen from '../screens/core/MoreScreen';

// Shop Screens
import ProductsCatalogScreen from '../screens/shop/ProductsCatalogScreen';
import ProductDetailsScreen from '../screens/shop/ProductDetailsScreen';
import CartScreen from '../screens/shop/CartScreen';
import TrendingProductsScreen from '../screens/shop/TrendingProductsScreen';
import NewArrivalsScreen from '../screens/shop/NewArrivalsScreen';
import BestSellersScreen from '../screens/shop/BestSellersScreen';
import RecommendedProductsScreen from '../screens/shop/RecommendedProductsScreen';
import SeasonalCollectionsScreen from '../screens/shop/SeasonalCollectionsScreen';
import FestivalOffersScreen from '../screens/shop/FestivalOffersScreen';
import DiscountsScreen from '../screens/shop/DiscountsScreen';
import WishlistScreen from '../screens/shop/WishlistScreen';

// Services Screens
import MeasurementScreen from '../screens/services/MeasurementScreen';
import AppointmentBookingScreen from '../screens/services/AppointmentBookingScreen';
import StoreVisitRequestScreen from '../screens/services/StoreVisitRequestScreen';

// Account Screens
import ProfileScreen from '../screens/account/ProfileScreen';
import LoyaltyDashboardScreen from '../screens/account/LoyaltyDashboardScreen';
import NotificationHistoryScreen from '../screens/account/NotificationHistoryScreen';
import SupportTicketScreen from '../screens/account/SupportTicketScreen';
import OrderHistoryScreen from '../screens/account/OrderHistoryScreen';
import AccountDetailsScreen from '../screens/account/AccountDetailsScreen';
import PaymentsScreen from '../screens/account/PaymentsScreen';
import PrivacyPolicyScreen from '../screens/account/PrivacyPolicyScreen';

// Icon library
import { 
  Home, 
  ShoppingCart, 
  User as UserIcon, 
  Calendar,
  ShoppingBag,
  Scissors,
  LayoutGrid,
  Ruler,
  Heart
} from 'lucide-react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigation
export function AuthNavigator({ onLoginSuccess }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login">
        {props => <LoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {props => <RegisterScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="OtpVerify">
        {props => <OtpVerifyScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Bottom Tab Navigation (Redesigned for the requested mockup design)
function TabNavigator({ onLogout }) {
  const { theme, fonts, shadows } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#e85c1c', // Premium Orange color
        tabBarInactiveTintColor: '#767676',
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f2',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 9,
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          let IconComponent;
          
          if (route.name === 'HomeTab') {
            IconComponent = Home;
          } else if (route.name === 'Browse') {
            IconComponent = ShoppingBag;
          } else if (route.name === 'Cart') {
            IconComponent = ShoppingCart;
          } else if (route.name === 'Measurements') {
            IconComponent = Ruler;
          } else if (route.name === 'BookingsTab') {
            IconComponent = Calendar;
          } else if (route.name === 'Profile') {
            IconComponent = UserIcon;
          }

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <IconComponent 
                size={21} 
                color={color} 
                strokeWidth={focused ? 2.2 : 1.8}
                fill={focused && route.name === 'Wishlist' ? '#e85c1c' : 'transparent'}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        options={{ tabBarLabel: 'Home' }}
      >
        {props => <HomeScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
      
      <Tab.Screen 
        name="Browse" 
        component={ProductsCatalogScreen} 
        options={{ tabBarLabel: 'Shopping' }}
      />
      
      <Tab.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{ tabBarLabel: 'Cart' }}
      />

      <Tab.Screen 
        name="Measurements" 
        component={MeasurementScreen} 
        options={{ tabBarLabel: 'Sizing' }}
      />

      <Tab.Screen 
        name="BookingsTab" 
        component={AppointmentBookingScreen} 
        options={{ tabBarLabel: 'Book' }}
      />

      <Tab.Screen 
        name="Profile" 
        options={{ tabBarLabel: 'Account' }}
      >
        {props => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Main Logged-In App Navigator
export function AppNavigator({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tab bar is the home core screen */}
      <Stack.Screen name="MainTabs">
        {props => <TabNavigator {...props} onLogout={onLogout} />}
      </Stack.Screen>
      
      {/* Nested secondary pages */}
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="More" component={MoreScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Loyalty" component={LoyaltyDashboardScreen} />
      <Stack.Screen name="NotificationHistory" component={NotificationHistoryScreen} />
      <Stack.Screen name="Support" component={SupportTicketScreen} />
      <Stack.Screen name="Orders" component={OrderHistoryScreen} />
      <Stack.Screen name="Measurements" component={MeasurementScreen} />
      <Stack.Screen name="Appointments" component={AppointmentBookingScreen} />
      <Stack.Screen name="StoreVisits" component={StoreVisitRequestScreen} />
      <Stack.Screen name="TrendingProducts" component={TrendingProductsScreen} />
      <Stack.Screen name="NewArrivals" component={NewArrivalsScreen} />
      <Stack.Screen name="BestSellers" component={BestSellersScreen} />
      <Stack.Screen name="RecommendedProducts" component={RecommendedProductsScreen} />
      <Stack.Screen name="SeasonalCollections" component={SeasonalCollectionsScreen} />
      <Stack.Screen name="FestivalOffers" component={FestivalOffersScreen} />
      <Stack.Screen name="Discounts" component={DiscountsScreen} />
      <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
      <Stack.Screen name="Payments" component={PaymentsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}
