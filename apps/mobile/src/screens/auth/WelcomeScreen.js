import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.brand[500] }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Content Container */}
      <SafeAreaView style={styles.contentContainer}>
        {/* Logo and Brand Title Section */}
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
          <TouchableOpacity 
            style={[styles.btn, { backgroundColor: theme.brand[500] }]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: '#ffffff', fontFamily: fonts.bold }]}>
              Log in
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, styles.secondaryBtn, { borderColor: theme.brand[500] }]}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: theme.brand[500], fontFamily: fonts.bold }]}>
              Sign up
            </Text>
          </TouchableOpacity>

          {/* Terms and Privacy Agreement */}
          <View style={styles.agreementBox}>
            <Text style={[styles.agreementText, { fontFamily: fonts.regular }]}>
              By continuing, you agree to {APP_CONFIG.STORE_NAME}'s
            </Text>
            <View style={styles.linksRow}>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.linkText, { fontFamily: fonts.semiBold }]}>
                  Privacy Policy
                </Text>
              </TouchableOpacity>
              <Text style={[styles.agreementText, { fontFamily: fonts.regular }]}> and </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.linkText, { fontFamily: fonts.semiBold }]}>
                  Terms of Use
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brandContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  logo: {
    width: 320,
    height: 320,
    marginBottom: 24,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 28,
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  brandSubtitle: {
    fontSize: 13,
    letterSpacing: 5,
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  bottomCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 24 : 36,
    alignItems: 'center',
    width: '100%',
  },
  btn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
  },
  btnText: {
    fontSize: 16,
  },
  agreementBox: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  agreementText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  linkText: {
    color: '#0f172a',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
