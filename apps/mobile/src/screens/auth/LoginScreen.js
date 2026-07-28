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

export default function LoginScreen({ route, navigation, onLoginSuccess }) {
  const { theme, fonts, shadows } = useTheme();
  
  // Get identifier passed from LoginIdentifierScreen
  const identifier = route?.params?.identifier || 'User';
  const fullName = route?.params?.fullName || '';

  const getAvatarChar = () => {
    if (fullName) {
      return fullName.charAt(0).toUpperCase();
    }
    const cleaned = identifier.replace(/^[^a-zA-Z0-9]+/, '');
    return cleaned ? cleaned.charAt(0).toUpperCase() : 'U';
  };
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/login', { 
        email: identifier,
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
      let errorMessage = 'Login failed. Please check credentials.';
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        errorMessage = err.response.data.errors.map(e => e.message).join('\\n');
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={[styles.keyboardContainer, { backgroundColor: '#ffffff' }]}
      >
        <ScrollView style={{ backgroundColor: theme.brand[500] }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Top Branding Section (Matches Welcome Screen) */}
          <View style={[styles.brandContainer, { backgroundColor: theme.brand[500] }]}>
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

            {/* Profile Avatar Card */}
            <View style={[styles.profileCard, { borderColor: theme.border }]}>
              <View style={styles.profileAvatar}>
                <Text style={[styles.avatarText, { fontFamily: fonts.bold }]}>
                  {getAvatarChar()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileLabel, { fontFamily: fonts.medium, color: theme.text.muted }]}>
                  Logging in as
                </Text>
                <Text style={[styles.profileValue, { fontFamily: fonts.bold, color: theme.text.primary }]} numberOfLines={1}>
                  {identifier}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.changeBtn}>
                <Text style={[styles.changeBtnText, { color: theme.brand[500], fontFamily: fonts.bold }]}>Change</Text>
              </TouchableOpacity>
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
                <ActivityIndicator color="#3D2E3D" />
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

            {/* Premium Brand Footer */}
            <View style={styles.brandFooter}>
              <View style={styles.hallmarkRow}>
                <Text style={[styles.hallmarkItem, { fontFamily: fonts.medium, color: theme.text.muted }]}>
                  ✦ Handcrafted Tailoring
                </Text>
                <Text style={styles.hallmarkDivider}>•</Text>
                <Text style={[styles.hallmarkItem, { fontFamily: fonts.medium, color: theme.text.muted }]}>
                  ✦ Precision Fitting
                </Text>
                <Text style={styles.hallmarkDivider}>•</Text>
                <Text style={[styles.hallmarkItem, { fontFamily: fonts.medium, color: theme.text.muted }]}>
                  ✦ Secure Encryption
                </Text>
              </View>
              <Text style={[styles.versionText, { fontFamily: fonts.medium, color: theme.text.muted }]}>
                {APP_CONFIG.STORE_NAME} • Version {APP_CONFIG.VERSION || '1.0.0'}
              </Text>
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
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 32 : 44,
    width: '100%',
  },
  brandFooter: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1EBF1',
    gap: 8,
  },
  hallmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  hallmarkItem: {
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  hallmarkDivider: {
    color: '#cbd5e1',
    fontSize: 9,
  },
  versionText: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
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
    fontSize: 14,
    color: '#334155',
    marginBottom: 6,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6F8',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE0ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    color: '#3D2E3D',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  profileValue: {
    fontSize: 14,
  },
  changeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#EDE0ED',
  },
  changeBtnText: {
    fontSize: 12,
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
    color: '#3D2E3D',
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
