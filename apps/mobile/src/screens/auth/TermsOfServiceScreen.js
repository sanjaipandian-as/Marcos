import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { ChevronLeft } from 'lucide-react-native';

export default function TermsOfServiceScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Terms of Service
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={[styles.mainTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Terms of Service
        </Text>

        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          Welcome to MARCOS Bespoke Studio. These Terms of Service ("Terms") govern your access to and use of the MARCOS mobile application and our bespoke tailoring and styling services. By using our application, you agree to comply with and be bound by these Terms.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          1. Bespoke Custom Orders & Fittings
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          MARCOS specializes in custom bespoke clothing designed specifically to your measurement profile. Because each garment is custom-tailored to your unique body dimensions and fabric preferences, custom orders cannot be canceled or refunded once production has commenced. We offer complimentary adjustment fittings to ensure a perfect fit as detailed in our styling guide.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          2. Measurement Profiles
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          You are responsible for providing accurate physical measurement data when customizing garments in the app. MARCOS is not responsible for fit issues resulting from inaccurate measurement entries supplied by the user. For guaranteed fit precision, we recommend booking a professional Home Tailor visit or visiting a MARCOS Studio.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          3. Appointments & Home Visits
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          When scheduling a Home Tailor booking or Studio consultation, you agree to provide coordinates and valid contact details. Cancellations must be requested at least 24 hours prior to the scheduled appointment slot. Repeat scheduling failures or cancellations may lead to limitation of service privileges.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          4. Payments, Pricing & Billing
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          Prices for fabric selection and customization services are detailed in the catalog. All payments are processed securely through PCI-DSS compliant third-party payment gateways. You agree to pay all charges incurred at the prices in effect at the time of your order, including applicable taxes.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          5. User Accounts & Data Policy
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          To access tailoring, appointments, and wishlists, you must register an account. You agree to keep your credentials confidential. In compliance with Google Play Store policies, you may request permanent deletion of your account and personal data at any time via the Account Profile menu.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          6. Limitation of Liability
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          MARCOS Bespoke Studio and its developers shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our application or bespoke styling services.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          7. Governing Law
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          These Terms shall be governed by and construed in accordance with the local consumer protection laws and regulations of India, without regard to conflict of law principles.
        </Text>

        <Text style={[styles.footerText, { fontFamily: fonts.medium, color: theme.text.muted }]}>
          Last Updated: June 2026. MARCOS Bespoke Studio.
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  mainTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
  },
});
