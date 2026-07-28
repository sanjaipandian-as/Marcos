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
  StatusBar
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import { ChevronLeft } from 'lucide-react-native';

export default function LoginIdentifierScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleContinue = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setErrorMsg('Please enter your mobile number or email.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/auth/login/check', { 
        identifier: trimmedIdentifier 
      });
      
      if (res.success) {
        if (res.status === 'NOT_FOUND') {
          // Go to register
          navigation.navigate('Register', { identifier: trimmedIdentifier });
        } else if (res.status === 'PASSWORD_REQUIRED') {
          // Go to login password
          navigation.navigate('Login', { identifier: trimmedIdentifier, fullName: res.fullName });
        } else if (res.status === 'SETUP_REQUIRED') {
          // Go to setup password
          navigation.navigate('SetupPassword', { identifier: trimmedIdentifier, fullName: res.fullName });
        }
      } else {
        setErrorMsg('Verification failed.');
      }
    } catch (err) {
      console.error('Check Identifier Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Verification failed. Please try again.';
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
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>Login</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView 
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
              Welcome
            </Text>
            <Text style={[styles.cardHeaderSubtitle, { fontFamily: fonts.regular, color: theme.text.muted }]}>
              Enter your mobile number or email to continue
            </Text>

            {errorMsg ? (
              <Text style={[styles.errorText, { fontFamily: fonts.medium }]}>{errorMsg}</Text>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontFamily: fonts.semiBold }]}>
                Mobile number or email
              </Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { fontFamily: fonts.regular }]}
                  placeholder="e.g. +91 9876543210 or email"
                  placeholderTextColor={theme.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={identifier}
                  onChangeText={setIdentifier}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: theme.brand[500] }]}
              onPress={handleContinue}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#3D2E3D" />
              ) : (
                <Text style={[styles.loginBtnText, { fontFamily: fonts.bold }]}>
                  Continue
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.signUpRow}>
              <Text style={[styles.signUpText, { fontFamily: fonts.regular }]}>
                By continuing, you agree to our{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
                <Text style={[styles.signUpLink, { color: theme.brand[500], fontFamily: fonts.bold }]}>
                  Terms of Service
                </Text>
              </TouchableOpacity>
              <Text style={[styles.signUpText, { fontFamily: fonts.regular }]}> and </Text>
              <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                <Text style={[styles.signUpLink, { color: theme.brand[500], fontFamily: fonts.bold }]}>
                  Privacy Policy
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
  cardHeaderSubtitle: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
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
  signUpRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  signUpText: { fontSize: 13, color: '#64748b' },
  signUpLink: { fontSize: 13 },
});
