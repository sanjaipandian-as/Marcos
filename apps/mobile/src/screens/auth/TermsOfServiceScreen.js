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
import { APP_CONFIG } from '../../config/app.config';
import { ChevronLeft, FileText, UserCheck, ShieldCheck, Scissors, CreditCard, MessageSquare, Trash2, Mail, PhoneCall } from 'lucide-react-native';

export default function TermsOfServiceScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();

  const storeName = APP_CONFIG.STORE_NAME || 'MARCOS Bespoke Tailoring';
  const contactPhone = APP_CONFIG.CONTACT_PHONE || '+919876543210';
  const contactEmail = APP_CONFIG.CONTACT_EMAIL || 'support@marcosbespoke.com';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={[styles.headerBtn, shadows.premium]} 
          onPress={() => navigation.goBack()} 
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Terms of Usage
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Banner Card */}
        <View style={[styles.bannerCard, { backgroundColor: theme.brand[500] }, shadows.premium]}>
          <FileText size={28} color="#ffffff" style={{ marginBottom: 8 }} />
          <Text style={[styles.bannerTitle, { fontFamily: fonts.bold }]}>
            Terms of Usage
          </Text>
          <Text style={[styles.bannerSub, { fontFamily: fonts.medium }]}>
            Governing your access and usage of the {storeName} mobile application and bespoke tailoring services.
          </Text>
        </View>

        {/* Section 1: Application Overview */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <FileText size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              1. Overview & Service Disclaimers
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            {storeName} provides custom-stitched costumes and bespoke fashion services through our mobile application. All product specifications, seam strengths, colors, tints, handwork details, sizes, and measurements shown in the mobile app are approximate values as they are custom-crafted and may vary based on fabric specifications and quality.
          </Text>
        </View>

        {/* Section 2: Eligibility & User Account */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <UserCheck size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              2. User Eligibility & Account Security
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Eligibility:</Text> You must be at least 18 years of age and legally competent to enter into contracts under applicable contract laws. Access may be terminated if a user is found to be under 18 years.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Account Registration:</Text> Registration with true, accurate, and current information is required to place orders. {storeName} reserves the right to suspend or terminate accounts providing false information.
          </Text>
        </View>

        {/* Section 3: Alterations & Designer Consultations */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <Scissors size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              3. Alterations & Designer Services
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Free Size Alterations:</Text> Complimentary size adjustments apply strictly to minor measurement fits. Our tailoring team's decision regarding alteration feasibility is final.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Exclusions:</Text> Style changes (e.g., converting full sleeve to sleeveless) or altering a garment to fit a different individual are not covered.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Pickup & Delivery:</Text> Logistics or doorstep pickup/delivery charges for alterations will be borne by the customer. No monetary refunds are issued once an item is altered.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Doorstep & Designer Services:</Text> Doorstep measurement bookings and app-based Fashion Designer consultations are provided on a best-effort basis for serviceable pincodes displayed in the app.
          </Text>
        </View>

        {/* Section 4: Payments & Order Execution */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <CreditCard size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              4. Orders, Payments & Timelines
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Advance & Balance Payment:</Text> Orders are processed upon receipt of advance payment. Full balance payment is required prior to order dispatch.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Shade & Work Variance:</Text> Hand embroidery and custom dyed fabrics have an inherent 15%–20% variance in shade and design outcome.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Fitment Issue Window:</Text> Any fitting concerns must be reported via our support desk within <Text style={{ fontFamily: fonts.bold, color: theme.text.primary }}>48 hours</Text> of receiving your order.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Standard Delivery Timelines:</Text> Standard custom orders take 7–10 days; intricate designer wear takes 15–20 days.
          </Text>
        </View>

        {/* Section 5: Electronic Communications & Content Submissions */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <MessageSquare size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              5. Reviews, Feedback & Submissions
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            All reviews, feedback, reference photos, or style ideas submitted through the app become the property of {storeName}. You agree that your submissions will not violate third-party copyright, privacy, or contain unlawful material.
          </Text>
        </View>

        {/* Section 6: Data Deletion & Right to Erasure */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <Trash2 size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              6. Account & Data Deletion Rights
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            In compliance with data privacy regulations and Google Play Store policies, registered users have the <Text style={{ fontFamily: fonts.bold, color: theme.text.primary }}>Right to be Forgotten / Account Deletion</Text>.
          </Text>
          <View style={[styles.highlightBox, { backgroundColor: theme.bg.input, borderColor: theme.border }]}>
            <Text style={[styles.highlightText, { fontFamily: fonts.medium, color: theme.text.primary }]}>
              • You can request full account erasure directly via Profile Settings or by contacting support.
            </Text>
            <Text style={[styles.highlightText, { fontFamily: fonts.medium, color: theme.text.primary }]}>
              • All personal measurement profiles and credentials will be permanently erased without undue delay (within 30 days).
            </Text>
          </View>
        </View>

        {/* Section 7: Support & Contact */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary, marginBottom: 12 }]}>
            Grievance Support Officer
          </Text>
          <View style={{ gap: 10 }}>
            <View style={styles.contactRow}>
              <Mail size={16} color={theme.brand[500]} />
              <Text style={[styles.contactText, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                {contactEmail}
              </Text>
            </View>
            <View style={styles.contactRow}>
              <PhoneCall size={16} color={theme.brand[500]} />
              <Text style={[styles.contactText, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                {contactPhone}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.footerText, { fontFamily: fonts.medium, color: theme.text.muted }]}>
          Last Updated: 2026. {storeName}.
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
    paddingTop: 14,
    paddingBottom: 40,
    gap: 16,
  },
  bannerCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 20,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  bannerSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 18,
  },
  cardSection: {
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15.5,
  },
  bodyText: {
    fontSize: 13.5,
    lineHeight: 21,
  },
  highlightBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  highlightText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 14,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
  },
});
