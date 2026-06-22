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

export default function PrivacyPolicyScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Privacy Policy
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={[styles.mainTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Privacy Policy
        </Text>

        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          At MARCOS, your privacy is our highest priority. We design and deliver customized clothing masterpieces with full respect for your personal measurement data, coordinates, and secure transaction credentials.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          1. Location Services
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          We use Location Services permissions solely to assist you in finding nearby MARCOS Bespoke Studios and to facilitate our Home Tailor Booking appointments. Coordinates are processed locally and are never stored or shared with external third parties without your explicit authorization.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          2. Sizing Profile Data
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          Bespoke tailoring requires precision. Sizing details (chest, hip, arm length, waist, etc.) are encrypted on our servers. Master Tailors only access this profile when creating and fitting your orders. You maintain full control to modify or delete this profiling data at any time.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          3. Secure Standards
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          We employ industry-standard secure socket layers (SSL) and token rotation to authenticate all data operations. Payments are routed directly to PCI-DSS certified gateway providers, ensuring no card number information ever touches our database.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          4. Data Collection & Retention
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          We collect personal information such as your name, email, phone number, and physical measurements to provide our core bespoke tailoring services. This data is retained only for as long as your account remains active or as needed to fulfill your orders and comply with legal obligations.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          5. Account & Data Deletion
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          In compliance with Google Play Store policies, you have the right to request the deletion of your account and all associated personal data. You can initiate account deletion directly within the App via the Profile settings, or by contacting our support email. Upon request, all sizing profiles, order history, and personal identifiers will be permanently erased.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          6. Third-Party Services
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          We may use third-party service providers to facilitate our Service (e.g., payment gateways, crash analytics). These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          7. Children's Privacy
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          Our Services do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If we discover that a child under 13 has provided us with personal information, we immediately delete this from our servers.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          8. Device Permissions (Camera, Media, Notifications)
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          Our App may request access to your device's Camera and Photo Library strictly for the purpose of uploading reference photos or style inspirations for your bespoke orders. We may also request Push Notification permissions to update you on your order status. You can revoke these permissions at any time via your device settings.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          9. Changes to This Privacy Policy
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          We may update our Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </Text>

        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          10. Developer Contact Information
        </Text>
        <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
          If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact the developer directly:
          {"\n"}• Email: privacy@marcosbespoke.com
          {"\n"}• Address: MARCOS Bespoke Studio, Couture Avenue, 10001
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
