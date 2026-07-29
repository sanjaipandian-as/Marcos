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
import { ChevronLeft, Truck, Clock, MapPin, Globe, ShieldCheck, Mail, PhoneCall, Package } from 'lucide-react-native';

export default function ShippingPolicyScreen({ navigation }) {
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
          Shipping Policy
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Banner Card */}
        <View style={[styles.bannerCard, { backgroundColor: theme.brand[500] }, shadows.premium]}>
          <Truck size={28} color="#ffffff" style={{ marginBottom: 8 }} />
          <Text style={[styles.bannerTitle, { fontFamily: fonts.bold }]}>
            Shipping & Delivery Policy
          </Text>
          <Text style={[styles.bannerSub, { fontFamily: fonts.medium }]}>
            Guidelines governing fabric pickup, custom garment dispatch, and delivery services at {storeName}.
          </Text>
        </View>

        {/* Section 1: Overview */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <Package size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              1. Overview
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            {storeName} operates a hybrid bespoke tailoring service model. Product specifications (weight, seam strength, color tints, handwork details) listed on the app are approximate values as each garment is custom-tailored to individual measurements and fabric properties.
          </Text>
        </View>

        {/* Section 2: Shipping Options & Charges */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <Truck size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              2. Shipping Options & Delivery Costs
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Logistics Partners:</Text> We ship domestically and internationally using authorized courier partners (DTDC, Delhivery, Xpressbees, etc.) or our own trained hyperlocal delivery agents.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Shipping Charges:</Text> Pickup and delivery charges start from <Text style={{ fontFamily: fonts.bold, color: theme.text.primary }}>Rs. 99/-</Text> and vary based on weight, distance, parcel volume, and delivery urgency. Applicable charges are calculated transparently at checkout.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Cash on Delivery (COD):</Text> As a rule, COD is not supported for custom bespoke orders. COD options may only be extended under special authorized discretion.
          </Text>
        </View>

        {/* Section 3: Processing Time & Operating Hours */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <Clock size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              3. Processing Timelines & Operating Hours
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Estimated Timelines:</Text> Due to the personalized nature of bespoke tailoring, estimated delivery dates are agreed upon when your order is placed.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Delivery Hours:</Text> Pickup and delivery operations run from <Text style={{ fontFamily: fonts.bold }}>10:00 AM to 7:00 PM</Text> (Monday through Saturday). Operations are closed on Sundays and public holidays.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>OTP Verification:</Text> Deliveries are secured via a One-Time Password (OTP) sent to your mobile app and registered phone number.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • <Text style={{ fontFamily: fonts.bold }}>Re-attempts:</Text> If consignee premises are closed or unreachable, our logistics partner will re-attempt delivery on the next business day.
          </Text>
        </View>

        {/* Section 4: Address Verification & Access */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <MapPin size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              4. Delivery Address & Restricted Access
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • Delivery addresses cannot be modified after an order is placed and confirmed.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • For addresses with restricted access (gated communities, corporate office complexes, military zones), customers are requested to ensure access permission for logistics personnel.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • Repeat shipment attempts due to restricted address access may incur additional re-dispatch charges.
          </Text>
        </View>

        {/* Section 5: International Shipments */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <Globe size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              5. International Orders
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • International shipments may be subject to local import duties, customs taxes, and clearance fees levied by the destination country. Customers are responsible for paying these fees.
          </Text>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            • Tracking information and courier portal links will be shared via app notifications and email once overseas dispatch is completed.
          </Text>
        </View>

        {/* Section 6: Quality Shortfall & Protection */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.cardHeaderRow}>
            <ShieldCheck size={18} color={theme.brand[500]} />
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              6. Service Quality & Shortfall Coverage
            </Text>
          </View>
          <Text style={[styles.bodyText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            All orders with a confirmed service or stitching quality shortfall attributable to {storeName} will be rectified to the extent possible at our expense.
          </Text>
          <View style={[styles.highlightBox, { backgroundColor: theme.bg.input, borderColor: theme.border }]}>
            <Text style={[styles.highlightText, { fontFamily: fonts.medium, color: theme.text.primary }]}>
              • Company liability for verified quality shortfalls is capped to the fabric replacement cost OR a maximum of <Text style={{ fontFamily: fonts.bold }}>Rs. 8,000 per order</Text> (whichever is lower).
            </Text>
          </View>
        </View>

        {/* Section 7: Grievance & Support Officer */}
        <View style={[styles.cardSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary, marginBottom: 12 }]}>
            Shipping Support & Grievances
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
