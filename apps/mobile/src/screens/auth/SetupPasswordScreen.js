import React, { useState, useEffect } from 'react';
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
  StatusBar,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';

export default function SetupPasswordScreen({ route, navigation, onLoginSuccess }) {
  const { theme, fonts, shadows } = useTheme();
  
  const identifier = route?.params?.identifier || '';
  const isEmail = identifier.includes('@');

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [timer, setTimer] = useState(60);

  // Send OTP automatically when screen mounts
  useEffect(() => {
    sendOtp();
  }, []);

  // Countdown timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const sendOtp = async () => {
    try {
      const payload = isEmail ? { email: identifier } : { phoneNumber: identifier };
      await api.post('/auth/otp/send', payload);
      setTimer(60);
      setErrorMsg('');
    } catch (err) {
      console.error('Send OTP Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send OTP.';
      setErrorMsg(errorMessage);
    }
  };

  const handleSetupPassword = async () => {
    if (!otp || otp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      // Step 1: Verify OTP to get verifyToken
      const verifyPayload = isEmail ? { email: identifier, code: otp, purpose: 'setup-password' } : { phoneNumber: identifier, code: otp, purpose: 'setup-password' };
      const verifyRes = await api.post('/auth/otp/verify', verifyPayload);

      if (!verifyRes.success || !verifyRes.verifyToken) {
        setErrorMsg('Invalid OTP or verification failed.');
        setLoading(false);
        return;
      }

      // Step 2: Setup new password using the verifyToken
      const res = await api.post('/auth/setup-password', {
        verifyToken: verifyRes.verifyToken,
        newPassword
      });

      if (res.success && res.accessToken) {
        await AsyncStorage.setItem('accessToken', res.accessToken);
        if (res.refreshToken) {
          await AsyncStorage.setItem('refreshToken', res.refreshToken);
        }
        await AsyncStorage.setItem('userProfile', JSON.stringify(res.user));
        
        Alert.alert('Success', 'Password configured successfully!');
        onLoginSuccess(res.user);
      } else {
        setErrorMsg('Password setup failed.');
      }
    } catch (err) {
      console.error('Setup Password Error:', err);
      let errorMessage = 'Setup failed. Invalid OTP or server error.';
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
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>Setup Password</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={[styles.keyboardContainer, { backgroundColor: '#ffffff' }]}
      >
        <ScrollView style={{ backgroundColor: theme.brand[500] }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
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

          <View style={[styles.bottomCard, shadows.premium]}>
            <Text style={[styles.cardHeaderTitle, { fontFamily: fonts.bold }]}>
              Verify Identity
            </Text>
            <Text style={[styles.cardHeaderSubtitle, { fontFamily: fonts.regular, color: theme.text.muted }]}>
              Your account has been pre-configured. Please enter the OTP sent to <Text style={{ fontFamily: fonts.bold, color: theme.brand[500] }}>{identifier}</Text> and set your new password.
            </Text>

            {errorMsg ? (
              <Text style={[styles.errorText, { fontFamily: fonts.medium }]}>{errorMsg}</Text>
            ) : null}

            {/* OTP Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
                OTP Verification Code
              </Text>
              <TextInput
                style={[styles.digitInput, { borderColor: theme.border, fontFamily: fonts.bold }]}
                placeholder="000000"
                placeholderTextColor="#cbd5e1"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            {/* Timer Resend */}
            <View style={styles.resendRow}>
              {timer > 0 ? (
                <Text style={[styles.timerText, { fontFamily: fonts.medium }]}>
                  Resend OTP in {timer}s
                </Text>
              ) : (
                <TouchableOpacity onPress={sendOtp}>
                  <Text style={[styles.resendLink, { color: theme.brand[500], fontFamily: fonts.bold }]}>
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* New Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
                Set New Password
              </Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { fontFamily: fonts.regular }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={theme.text.muted}
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} color="#64748b" /> : <Eye size={20} color="#64748b" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: theme.brand[500] }]}
              onPress={handleSetupPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#3D2E3D" />
              ) : (
                <Text style={[styles.loginBtnText, { fontFamily: fonts.bold }]}>
                  Confirm & Login
                </Text>
              )}
            </TouchableOpacity>

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
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 32,
    paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 18, color: '#ffffff', textAlign: 'center' },
  headerPlaceholder: { width: 40 },
  keyboardContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'space-between' },
  brandContainer: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  logo: { width: 180, height: 180, marginBottom: 8 },
  brandTitle: { color: '#ffffff', fontSize: 24, letterSpacing: 3, textAlign: 'center', textTransform: 'uppercase' },
  brandSubtitle: { fontSize: 12, letterSpacing: 4, textAlign: 'center', marginTop: 4, textTransform: 'uppercase' },
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
  cardHeaderTitle: { fontSize: 24, color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  cardHeaderSubtitle: { fontSize: 14, marginBottom: 24, textAlign: 'center', lineHeight: 20 },
  errorText: { color: '#ef4444', fontSize: 13, marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, color: '#334155', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    height: 50,
  },
  input: { flex: 1, height: '100%', fontSize: 15, color: '#0f172a' },
  eyeBtn: { paddingLeft: 12, height: '100%', justifyContent: 'center' },
  digitInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    height: 52,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    color: '#0f172a',
  },
  resendRow: { alignItems: 'center', marginBottom: 24, marginTop: -8 },
  timerText: { fontSize: 14, color: '#64748b' },
  resendLink: { fontSize: 14, textDecorationLine: 'underline' },
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
  loginBtnText: { fontSize: 16, color: '#3D2E3D' },
});
