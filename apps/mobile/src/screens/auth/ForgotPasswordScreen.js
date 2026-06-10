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
  Modal,
  Dimensions,
  Alert
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import { ChevronLeft, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  
  // Steps: 'EMAIL' (Reset Password Step 1) -> 'VERIFY' (OTP Code) -> 'RESET' (New Password)
  const [step, setStep] = useState('EMAIL'); 
  const [email, setEmail] = useState('');
  
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const handleEmailStepContinue = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/forgot-password', { email: trimmedEmail });
      if (res.success) {
        setStep('VERIFY');
      } else {
        setErrorMsg('Failed to send reset code.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Error processing request.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!code || code.length !== 6) {
      setErrorMsg('Please enter the valid 6-digit verification code.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/forgot-password/verify', {
        email: email.trim().toLowerCase(),
        code,
      });
      if (res.success) {
        setStep('RESET');
      } else {
        setErrorMsg(res.message || 'Invalid verification code.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please enter both password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        code,
        newPassword,
      });

      if (res.success) {
        setSuccessModalVisible(true);
        setTimeout(() => {
          setSuccessModalVisible(false);
          navigation.navigate('Login');
        }, 3000);
      } else {
        setErrorMsg('Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Verification or password update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setErrorMsg('');
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      if (res.success) {
        Alert.alert('Code Resent', 'A new verification code has been dispatched.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Resend failed.');
    }
  };

  const renderEmailStep = () => (
    <View style={styles.cardContent}>
      <Text style={[styles.cardHeaderTitle, { fontFamily: fonts.bold }]}>
        Reset Password (1/3)
      </Text>
      <Text style={[styles.cardHeaderSub, { fontFamily: fonts.regular }]}>
        Enter your registered email address to receive a verification code.
      </Text>

      {/* Email Input */}
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

      {/* Action Button */}
      <TouchableOpacity 
        style={[styles.primaryBtn, { backgroundColor: theme.brand[500] }]}
        onPress={handleEmailStepContinue}
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
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.cardContent}>
      <Text style={[styles.cardHeaderTitle, { fontFamily: fonts.bold }]}>
        Verify Identity (2/3)
      </Text>
      <Text style={[styles.cardHeaderSub, { fontFamily: fonts.regular }]}>
        A 6-digit verification code has been dispatched to:
      </Text>
      <Text style={[styles.targetDisplay, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
        {email}
      </Text>

      {/* Digit Input */}
      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.digitInput, { borderColor: theme.border, fontFamily: fonts.bold }]}
          placeholder="000000"
          placeholderTextColor="#cbd5e1"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />
      </View>

      {/* Resend Link */}
      <View style={styles.resendRow}>
        <TouchableOpacity onPress={handleResendCode}>
          <Text style={[styles.resendLink, { color: theme.brand[500], fontFamily: fonts.bold }]}>
            Resend Code
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Button */}
      <TouchableOpacity 
        style={[styles.primaryBtn, { backgroundColor: theme.brand[500] }]}
        onPress={handleVerifyOtp}
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

  const renderResetStep = () => (
    <View style={styles.cardContent}>
      <Text style={[styles.cardHeaderTitle, { fontFamily: fonts.bold }]}>
        New Password (3/3)
      </Text>
      <Text style={[styles.cardHeaderSub, { fontFamily: fonts.regular }]}>
        Create and confirm your new secure password below.
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

      {/* Action Button */}
      <TouchableOpacity 
        style={[styles.primaryBtn, { backgroundColor: theme.brand[500] }]}
        onPress={handleResetPassword}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={[styles.primaryBtnText, { fontFamily: fonts.bold }]}>
            Complete Reset
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
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => {
            if (step === 'VERIFY') setStep('EMAIL');
            else if (step === 'RESET') setStep('VERIFY');
            else navigation.goBack();
          }}
        >
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>Reset Password</Text>
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

            {step === 'EMAIL' && renderEmailStep()}
            {step === 'VERIFY' && renderVerifyStep()}
            {step === 'RESET' && renderResetStep()}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Congratulations Dialog Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => {}}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, shadows.premium]}>
            <View style={[styles.checkCircle, { backgroundColor: theme.brand[50] }]}>
              <ShieldCheck size={44} color={theme.brand[500]} />
            </View>
            <Text style={[styles.modalTitle, { fontFamily: fonts.bold, color: '#0f172a' }]}>
              Congratulations !
            </Text>
            <Text style={[styles.modalText, { fontFamily: fonts.medium }]}>
              Password Reset successful.
            </Text>
            <Text style={[styles.modalSubtext, { fontFamily: fonts.regular }]}>
              You'll be redirected to the login screen now.
            </Text>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: width * 0.85,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
});
