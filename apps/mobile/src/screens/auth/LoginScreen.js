import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation, onLoginSuccess }) {
  const { theme, fonts, shadows } = useTheme();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    const trimmedIdentifier = emailOrPhone.trim();
    if (!trimmedIdentifier || !password) {
      setErrorMsg('Please enter both mobile number/email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/login', { 
        email: trimmedIdentifier,
        password 
      });
      
      if (res.success && res.accessToken) {
        await AsyncStorage.setItem('accessToken', res.accessToken);
        if (res.refreshToken) {
          await AsyncStorage.setItem('refreshToken', res.refreshToken);
        }
        await AsyncStorage.setItem('userProfile', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      } else {
        setErrorMsg('Authentication failed.');
      }
    } catch (err) {
      console.error('Login Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.brand[500] }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>Login</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Top Branding Section (Matches Welcome Screen) */}
          <View style={styles.brandContainer}>
            <Image 
              source={require('../../../assets/Marcos.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={[styles.brandTitle, { fontFamily: fonts.extraBold }]}>
              MARCOS BESPOKE
            </Text>
            <Text style={[styles.brandSubtitle, { color: theme.brand[100], fontFamily: fonts.medium }]}>
              TAILORING & STYLING
            </Text>
          </View>

          {/* Bottom Card Sheet (Matches Welcome Screen) */}
          <View style={[styles.bottomCard, shadows.premium]}>
            <Text style={[styles.cardHeaderTitle, { fontFamily: fonts.bold }]}>
              Welcome Back
            </Text>

            {errorMsg ? (
              <Text style={[styles.errorText, { fontFamily: fonts.medium }]}>{errorMsg}</Text>
            ) : null}

            {/* Email or Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
                Enter your mobile number or email
              </Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { fontFamily: fonts.regular }]}
                  placeholder="e.g. +91 9876543210 or email"
                  placeholderTextColor={theme.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
                Enter your password
              </Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { fontFamily: fonts.regular }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={theme.text.muted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity 
              style={styles.forgotBtn}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={[styles.forgotText, { fontFamily: fonts.medium }]}>
                forgot password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: theme.brand[500] }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={[styles.loginBtnText, { fontFamily: fonts.bold }]}>
                  Login
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Navigation */}
            <View style={styles.signUpRow}>
              <Text style={[styles.signUpText, { fontFamily: fonts.regular }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.signUpLink, { color: theme.brand[500], fontFamily: fonts.bold }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 32,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 8,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 24,
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  brandSubtitle: {
    fontSize: 12,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  bottomCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 32 : 44,
    width: '100%',
  },
  cardHeaderTitle: {
    fontSize: 20,
    color: '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    height: 50,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0f172a',
  },
  eyeBtn: {
    paddingLeft: 12,
    height: '100%',
    justifyContent: 'center',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
  loginBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loginBtnText: {
    fontSize: 16,
    color: '#ffffff',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#64748b',
  },
  signUpLink: {
    fontSize: 14,
  },
});
