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
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation, onLoginSuccess }) {
  const { theme, fonts, shadows } = useTheme();
  
  // Registration steps: 1 (Contact Info) -> 2 (OTP Verification) -> 3 (Password & Delivery Details)
  const [step, setStep] = useState(1);
  
  // Step 1 States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referredByCode, setReferredByCode] = useState('');

  // Step 2 States
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(0);

  // Step 3 States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Countdown timer for resending OTP in Step 2
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

  const handleStep1Continue = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phoneNumber.trim();

    if (!fullName || !trimmedEmail || !trimmedPhone) {
      setErrorMsg('Please fill out Name, Email, and Phone Number.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      // Send OTP to email/phone to verify ownership
      // We pass both to the backend; backend prioritizes phoneNumber if provided
      const res = await api.post('/auth/otp/send', {
        email: trimmedEmail,
        phoneNumber: trimmedPhone
      });

      if (res.success) {
        setTimer(60);
        setStep(2);
      } else {
        setErrorMsg(res.message || 'Failed to send verification code.');
      }
    } catch (err) {
      console.error('Registration Step 1 Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Verification dispatch failed.';
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Verify = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg('Please enter the valid 6-digit verification code.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      // Use phoneNumber as identifier if available, matching the sendOtp logic
      const payload = {
        code: otpCode,
        purpose: 'register',
        phoneNumber: phoneNumber.trim(),
        email: email.trim().toLowerCase()
      };

      const res = await api.post('/auth/otp/verify', payload);
      if (res.success) {
        setStep(3);
      } else {
        setErrorMsg(res.message || 'Invalid verification code.');
      }
    } catch (err) {
      console.error('Registration Step 2 Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'OTP verification failed.';
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Register = async () => {
    if (!password || !confirmPassword) {
      setErrorMsg('Please enter both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/register', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        password,
        address: address ? address.trim() : null,
        gender: gender,
        referredByCode: referredByCode ? referredByCode.trim() : null,
      });

      if (res.success && res.accessToken) {
        await AsyncStorage.setItem('accessToken', res.accessToken);
        await AsyncStorage.setItem('userProfile', JSON.stringify(res.user));
        if (res.user.referredById) {
          await AsyncStorage.setItem('show_referral_success_popup', 'true');
        }
        
        Alert.alert('Welcome!', 'Registration completed successfully.');
        onLoginSuccess(res.user);
      } else {
        setErrorMsg('Account registration failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Registration failed. Phone or Email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg('');
    try {
      const res = await api.post('/auth/otp/send', {
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim()
      });
      if (res.success) {
        setTimer(60);
        Alert.alert('Code Resent', 'A new 6-digit OTP has been sent.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Resend failed.';
      setErrorMsg(errorMessage);
    }
  };

  const handleBackNavigation = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else navigation.goBack();
  };

  const renderStep1 = () => (
    <View style={styles.cardContent}>
      <Text style={[styles.cardHeaderTitle, { fontFamily: fonts.bold }]}>
        Contact details (1/3)
      </Text>

      {/* Full Name */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
          Enter your Full Name *
        </Text>
        <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { fontFamily: fonts.regular }]}
            placeholder="e.g. Priya Sharma"
            placeholderTextColor={theme.text.muted}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>
      </View>

      {/* Phone Number */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
          Enter your mobile number *
        </Text>
        <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { fontFamily: fonts.regular }]}
            placeholder="e.g. +91 9999988888"
            placeholderTextColor={theme.text.muted}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>
      </View>

      {/* Email */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
          Enter your Email *
        </Text>
        <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { fontFamily: fonts.regular }]}
            placeholder="e.g. abc12@gmail.com"
            placeholderTextColor={theme.text.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
      </View>

      {/* Referral Code (Optional) */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
          Referral Code (Optional)
        </Text>
        <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { fontFamily: fonts.regular }]}
            placeholder="e.g. REF-ALEXR-1234"
            placeholderTextColor={theme.text.muted}
            autoCapitalize="characters"
            value={referredByCode}
            onChangeText={setReferredByCode}
          />
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={[styles.primaryBtn, { backgroundColor: theme.brand[500] }]}
        onPress={handleStep1Continue}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={[styles.primaryBtnText, { fontFamily: fonts.bold }]}>
            Continue
          </Text>
        )}
      </TouchableOpacity>

      {/* Back to Login Link */}
      <View style={styles.loginRow}>
        <Text style={[styles.loginText, { fontFamily: fonts.regular }]}>
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={[styles.loginLink, { color: theme.brand[500], fontFamily: fonts.bold }]}>
            Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.cardContent}>
      <Text style={[styles.cardHeaderTitle, { fontFamily: fonts.bold }]}>
        Verify Identity (2/3)
      </Text>
      <Text style={[styles.cardHeaderSub, { fontFamily: fonts.regular }]}>
        An 6-digit verification code has been dispatched to:
      </Text>
      <Text style={[styles.targetDisplay, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
        {phoneNumber || email}
      </Text>

      {/* Digit Input */}
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

      {/* Timer Resend */}
      <View style={styles.resendRow}>
        {timer > 0 ? (
          <Text style={[styles.timerText, { fontFamily: fonts.medium }]}>
            Resend OTP in {timer}s
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResendOtp}>
            <Text style={[styles.resendLink, { color: theme.brand[500], fontFamily: fonts.bold }]}>
              Resend OTP
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={[styles.primaryBtn, { backgroundColor: theme.brand[500] }]}
        onPress={handleStep2Verify}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={[styles.primaryBtnText, { fontFamily: fonts.bold }]}>
            Verify Code
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.cardContent}>
      <Text style={[styles.cardHeaderTitle, { fontFamily: fonts.bold }]}>
        Security & Delivery (3/3)
      </Text>

      {/* Password */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
          Create password *
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

      {/* Confirm Password */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
          Confirm password *
        </Text>
        <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { fontFamily: fonts.regular }]}
            placeholder="••••••••••••"
            placeholderTextColor={theme.text.muted}
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>
      </View>

      {/* Gender select */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
          Gender Profile *
        </Text>
        <View style={styles.genderRow}>
          {[
            { label: 'Male', value: 'MALE' },
            { label: 'Female', value: 'FEMALE' },
            { label: 'Prefer not to say', value: 'OTHER' },
          ].map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[
                styles.genderOption,
                { borderColor: theme.border },
                gender === g.value && { backgroundColor: theme.brand[50], borderColor: theme.brand[500] }
              ]}
              onPress={() => setGender(g.value)}
            >
              <Text style={[
                styles.genderOptionText,
                { fontFamily: fonts.medium, color: gender === g.value ? theme.brand[500] : '#64748b' }
              ]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Address */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
          Delivery / Fitting Address
        </Text>
        <View style={[styles.inputWrapper, styles.multilineWrapper, { borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { fontFamily: fonts.regular, textAlignVertical: 'top', paddingTop: 12 }]}
            placeholder="Enter physical address for home visits & tailoring deliveries..."
            placeholderTextColor={theme.text.muted}
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />
        </View>
      </View>

      {/* Register Button */}
      <TouchableOpacity 
        style={[styles.primaryBtn, { backgroundColor: theme.brand[500] }]}
        onPress={handleStep3Register}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={[styles.primaryBtnText, { fontFamily: fonts.bold }]}>
            Complete Registration
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.brand[500] }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackNavigation}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>Register</Text>
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

          {/* Bottom Card Sheet */}
          <View style={[styles.bottomCard, shadows.premium]}>
            {errorMsg ? (
              <Text style={[styles.errorText, { fontFamily: fonts.medium }]}>{errorMsg}</Text>
            ) : null}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
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
    paddingVertical: 16,
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
  cardContent: {
    width: '100%',
  },
  cardHeaderTitle: {
    fontSize: 20,
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardHeaderSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  targetDisplay: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
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
  multilineWrapper: {
    height: 90,
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
  resendRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  timerText: {
    fontSize: 14,
    color: '#64748b',
  },
  resendLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  genderOption: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  genderOptionText: {
    fontSize: 13,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryBtnText: {
    fontSize: 16,
    color: '#ffffff',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#64748b',
  },
  loginLink: {
    fontSize: 14,
  },
});
