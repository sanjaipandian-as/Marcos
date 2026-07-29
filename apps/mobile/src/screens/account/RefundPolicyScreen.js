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
import { ChevronLeft, RefreshCw, AlertCircle, ShieldAlert, FileText, CheckCircle2, PhoneCall, Mail } from 'lucide-react-native';

export default function RefundPolicyScreen({ navigation }) {
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
          Refund & Cancellation
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Banner Card */}
        <View style={[styles.bannerCard, { backgroundColor: theme.brand[500] }, shadows.premium]}>
          <RefreshCw size={28} color="#ffffff" style={{ marginBottom: 8 }} />
          <Text style={[styles.bannerTitle, { fontFamily: fonts.bold }]}>
            Refund & Cancellation Policy
          </Text>
          <Text style={[styles.bannerSub, { fontFamily: fonts.medium }]}>
            Applicable across all digital interfaces, mobile applications, and offline fulfillment centers of {storeName}.
          </Text>
        </View>

        {/* Section 1: Overview & Disclaimer */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <FileText size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              1. Overview & Disclaimer
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            The details of customer-opted and custom-made products, services, or product specifications (weight, stitching seam strength, colors, handwork details, sizes, and measurements) mentioned across all digital mediums and offline stitching fulfillment centers of {storeName} are approximate values. As these are custom-fit garments, variations may occur based on fabric quality and technical specifications.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            The usage of any of our interfaces warrants your acceptance of the latest terms in this disclaimer, which may be updated periodically to meet operational or regulatory requirements.
          </Text>
        </View>

        {/* Section 2: Crafting & Color Variation */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <AlertCircle size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              2. Color & Customization Variations
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            All products and services are designer-styled, hand-crafted, and custom tailored. Due to digital display variations (lighting, photography settings, monitor calibrations) and fabric dye batches, minor variations in fabric colors, prints, or embroidery between display images and the actual product may occur.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            By placing an order, the customer acknowledges and accepts these inherent natural variations in fabric texture, dye, stretch, and handwork detailing.
          </Text>
        </View>

        {/* Section 3: Refunds on Products & Services */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <ShieldAlert size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              3. Refunds Policy
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            Since each garment ordered with {storeName} is completely customized to individual measurements and styling preferences, <Text style={{ fontFamily: fonts.bold, color: theme.text.primary }}>refunds will not be permitted once an order is placed</Text>.
          </Text>
          <View style={[styles.highlightBox, { backgroundColor: theme.bg.input, borderColor: theme.border }]}>
            <Text style={[styles.highlightText, { fontFamily: fonts.medium, color: theme.text.primary }]}>
              • Refunds (if approved after internal process audit for issues directly attributable to our team) will be issued exclusively in the form of <Text style={{ fontFamily: fonts.bold }}>Gift Vouchers</Text>.
            </Text>
            <Text style={[styles.highlightText, { fontFamily: fonts.medium, color: theme.text.primary }]}>
              • Gift Voucher issuance takes 7–10 working days from approval date.
            </Text>
            <Text style={[styles.highlightText, { fontFamily: fonts.medium, color: theme.text.primary }]}>
              • Maximum Gift Voucher value is limited to <Text style={{ fontFamily: fonts.bold }}>Rs. 2,500</Text> or actual item cost (whichever is lower).
            </Text>
            <Text style={[styles.highlightText, { fontFamily: fonts.bold, color: '#ef4444' }]}>
              • No cash or bank transfer refunds will be issued under any circumstance.
            </Text>
          </View>
        </View>

        {/* Section 4: Cancellation Terms */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <RefreshCw size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              4. Order Cancellation Terms
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            Orders can be cancelled before processing starts, <Text style={{ fontFamily: fonts.bold, color: theme.text.primary }}>EXCEPT</Text> in the following scenarios:
          </Text>
          <View style={{ gap: 6, marginVertical: 4 }}>
            <Text style={[styles.bulletItem, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
              ❌ Order has been assigned to the Fulfillment Center for processing.
            </Text>
            <Text style={[styles.bulletItem, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
              ❌ Fabric for the order has been washed, ironed, cut, or stitched.
            </Text>
            <Text style={[styles.bulletItem, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
              ❌ Fashion designing, pattern drafting, or cutting work has commenced.
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary, marginTop: 6 }]}>
            In permitted cancellation cases, advance amounts collected will be reimbursed except for costs expended on fabrics, logistics, transport, and incidental processing charges.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            <Text style={{ fontFamily: fonts.bold }}>Third-Party Fabrics:</Text> If third-party fabric suppliers on our platform accept returns per their policies, refunds will follow their timeline. If the fabric supplier does not accept return/replacement, {storeName} cannot issue a fabric refund.
          </Text>
        </View>

        {/* Section 5: Replacements & Alterations */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <CheckCircle2 size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              5. Replacements & Alterations
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Fabric Misplacement:</Text> Liability is limited to replacement value of the fabric or providing similar fabric (upon proof of purchase value).
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Fit Dissatisfaction:</Text> Liability is capped up to <Text style={{ fontFamily: fonts.bold }}>INR Rs. 3,000/-</Text> or refund of stitching charges component (whichever is higher). In such cases, the garment will be retained as company property for quality audits.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Free Size Alterations:</Text> Complimentary size adjustments are provided at any of our studio centers if sufficient seam allowance is available.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Style Change Limitation:</Text> Alterations apply strictly to size adjustments, NOT style changes (e.g. converting full sleeves to sleeveless is not an alteration).
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Outstation & Shipping:</Text> Beyond 7 days from delivery date, outstation customers bear shipping costs for alteration requests. Paid pickup/delivery is available in select serviceable pincodes.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.bold, color: '#ef4444' }]}>
            • Coupon & Discounted Orders: Items stitched using promotional discount codes are non-refundable under any circumstance.
          </Text>
        </View>

        {/* Section 6: Grievance Support Desk */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary, marginBottom: 12 }]}>
            Grievance Support Desk
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary, marginBottom: 12 }]}>
            For any queries or concerns regarding this policy, please reach out to our grievance team:
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
  bulletItem: {
    fontSize: 13,
    lineHeight: 20,
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
