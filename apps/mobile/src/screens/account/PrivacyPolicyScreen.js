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
import { ChevronLeft, ShieldCheck, MapPin, Key, Lock } from 'lucide-react-native';

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
        
        {/* Intro */}
        <View style={[styles.sectionCard, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.sectionHeader}>
            <ShieldCheck size={20} color={theme.brand[500]} />
            <Text style={[styles.cardTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              Our Commitment
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            At MARCOS, your privacy is our highest priority. We design and deliver customized clothing masterpieces with full respect for your personal measurement data, coordinates, and secure transaction credentials.
          </Text>
        </View>

        {/* Location Services Policy */}
        <View style={[styles.sectionCard, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={theme.brand[500]} />
            <Text style={[styles.cardTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              Location Services
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            We use Location Services permissions solely to assist you in finding nearby MARCOS Bespoke Studios and to facilitate our **Home Tailor Booking** appointments. Coordinates are processed locally and are never stored or shared with external third parties without your explicit authorization.
          </Text>
        </View>

        {/* Measurements & Data Safety */}
        <View style={[styles.sectionCard, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color={theme.brand[500]} />
            <Text style={[styles.cardTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              Sizing Profile Data
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            Bespoke tailoring requires precision. Sizing details (chest, hip, arm length, waist, etc.) are encrypted on our servers. Master Tailors only access this profile when creating and fitting your orders. You maintain full control to modify or delete this profiling data at any time.
          </Text>
        </View>

        {/* Security & Audits */}
        <View style={[styles.sectionCard, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.sectionHeader}>
            <Key size={20} color={theme.brand[500]} />
            <Text style={[styles.cardTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              Secure Standards
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            We employ industry-standard secure socket layers (SSL) and token rotation to authenticate all data operations. Payments are routed directly to PCI-DSS certified gateway providers, ensuring no card number information ever touches our database.
          </Text>
        </View>

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
  sectionCard: {
    borderRadius: 24,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
  },
});
