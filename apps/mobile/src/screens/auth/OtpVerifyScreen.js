import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import { ChevronLeft } from 'lucide-react-native';

export default function OtpVerifyScreen({ navigation, onLoginSuccess }) {
  const { theme, fonts, shadows } = useTheme();
  const [identifier, setIdentifier] = useState(''); // Email or Phone Number
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for resending OTP
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

  const handleSendOtp = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setErrorMsg('Please enter your email or phone number.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    const isEmail = trimmedIdentifier.includes('@');
    const payload = isEmail ? { email: trimmedIdentifier.toLowerCase() } : { phoneNumber: trimmedIdentifier };

    try {
      const res = await api.post('/auth/otp/send', payload);
      if (res.success) {
        setOtpSent(true);
        setTimer(60); // 60 seconds cooldown
        setSuccessMsg('Verification code sent successfully.');
      } else {
        setErrorMsg(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error('OTP Send Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error sending OTP.';
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit verification code.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    
    const isEmail = trimmedIdentifier.includes('@');
    const payload = isEmail 
      ? { email: trimmedIdentifier.toLowerCase(), code: otpCode }
      : { phoneNumber: trimmedIdentifier, code: otpCode };

    try {
      const res = await api.post('/auth/otp/verify', payload);
      if (res.success && res.accessToken) {
        await AsyncStorage.setItem('accessToken', res.accessToken);
        if (res.refreshToken) {
          await AsyncStorage.setItem('refreshToken', res.refreshToken);
        }
        await AsyncStorage.setItem('userProfile', JSON.stringify(res.user));
        onLoginSuccess(res.user);
      } else {
        setErrorMsg(res.message || 'Invalid verification code.');
      }
    } catch (err) {
      console.error('OTP Verify Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Verification failed.';
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const renderSendOtpLayout = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { fontFamily: fonts.bold }]}>Verify Identity</Text>
      <Text style={[styles.stepSubtitle, { fontFamily: fonts.regular }]}>
        Please enter your registered mobile number or email to receive a secure login OTP code.
      </Text>

      {/* Input Identifier */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
          Enter email or mobile number
        </Text>
        <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { fontFamily: fonts.regular }]}
            placeholder="e.g. +91 9876543210 or email"
            placeholderTextColor={theme.text.muted}
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
          />
        </View>
      </View>

      {/* Send OTP Button */}
      <TouchableOpacity 
        style={[styles.primaryBtn, { backgroundColor: theme.brand[500] }]}
        onPress={handleSendOtp}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={[styles.btnText, { fontFamily: fonts.bold }]}>Get OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderVerifyOtpLayout = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { fontFamily: fonts.bold }]}>Enter OTP</Text>
      <Text style={[styles.stepSubtitle, { fontFamily: fonts.regular }]}>
        An 6-digit OTP has been sent to
      </Text>
      <Text style={[styles.identifierDisplay, { fontFamily: fonts.bold, color: theme.brand[600] }]}>
        {identifier}
      </Text>

      {/* Code Input */}
      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.digitInput, { borderColor: theme.border, fontFamily: fonts.bold }]}
          placeholder="000000"
          placeholderTextColor="#cbd5e1"
          keyboardType="number-pad"
          maxLength={6}
          value={otpCode}
          onChangeText={setOtpCode}
        />
      </View>

      {/* Timer / Resend */}
      <View style={styles.resendRow}>
        {timer > 0 ? (
          <Text style={[styles.resendTimer, { fontFamily: fonts.medium }]}>
            Resend OTP ({formatTimer(timer)})
          </Text>
        ) : (
          <TouchableOpacity onPress={handleSendOtp}>
            <Text style={[styles.resendLink, { color: theme.brand[500], fontFamily: fonts.bold }]}>
              Resend OTP
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Verify Button */}
      <TouchableOpacity 
        style={[styles.primaryBtn, { backgroundColor: theme.brand[500] }]}
        onPress={handleVerifyOtp}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={[styles.btnText, { fontFamily: fonts.bold }]}>Verify</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#ffffff' }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => {
            if (otpSent) {
              setOtpSent(false);
              setOtpCode('');
            } else {
              navigation.goBack();
            }
          }}
        >
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>Verify</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.content}>
            {errorMsg ? (
              <Text style={[styles.errorText, { fontFamily: fonts.medium }]}>{errorMsg}</Text>
            ) : null}
            {successMsg ? (
              <Text style={[styles.successText, { fontFamily: fonts.medium }]}>{successMsg}</Text>
            ) : null}

            {otpSent ? renderVerifyOtpLayout() : renderSendOtpLayout()}
          </View>

          {/* Footer Details */}
          <View style={styles.footer}>
            <Text style={[styles.versionText, { color: theme.text.muted, fontFamily: fonts.regular }]}>
              {APP_CONFIG.STORE_NAME} v{APP_CONFIG.VERSION}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#0f172a',
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
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  successText: {
    color: '#10b981',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    color: '#0f172a',
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    height: 52,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#0f172a',
  },
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
  identifierDisplay: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  resendTimer: {
    fontSize: 14,
    color: '#64748b',
  },
  resendLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  btnText: {
    fontSize: 16,
    color: '#ffffff',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  versionText: {
    fontSize: 11,
  },
});
