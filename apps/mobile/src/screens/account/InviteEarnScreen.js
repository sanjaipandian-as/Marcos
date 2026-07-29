import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
  StatusBar,
  Alert,
  Clipboard,
  Modal
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  ChevronLeft,
  Copy,
  Share2,
  Gift,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Trophy,
  Star,
  Receipt,
  Info
} from 'lucide-react-native';

const TABS = ['INVITE', 'HISTORY', 'REDEEM'];

export default function InviteEarnScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('INVITE');
  const [voucherPlans, setVoucherPlans] = useState([]);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemedCoupon, setRedeemedCoupon] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [profileRes, plansRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/auth/loyalty/voucher-plans').catch(() => ({ success: false, data: [] }))
      ]);
      if (profileRes.success) setProfile(profileRes.data);
      if (plansRes.success && plansRes.data) setVoucherPlans(plansRes.data);
    } catch (err) {
      console.warn('Error loading loyalty data:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => loadData());
    return unsub;
  }, [navigation]);

  const referralCode = profile?.referralCode || user?.referralCode || 'MARCOS-VIP';
  const referrals = profile?.referrals || [];
  const transactions = profile?.pointTransactions || [];
  const points = profile?.pointsBalance || 0;

  const handleCopyCode = () => {
    try {
      Clipboard.setString(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      Alert.alert('Copied', 'Referral code copied!');
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `marcos://register?code=${referralCode}`;
      await Share.share({
        title: 'Join MARCOS Bespoke Couture',
        message: `✨ Join me on MARCOS Bespoke Couture! Use my referral code: *${referralCode}* to get 100 bonus tailoring points.\n\nRegister: ${shareUrl}`,
      });
    } catch (err) {
      console.warn('Share error:', err.message);
    }
  };

  const handleRedeem = (plan) => {
    if (points < plan.pointsRequired) {
      Alert.alert('Insufficient Points', `You need at least ${plan.pointsRequired} points to redeem this.`);
      return;
    }
    Alert.alert(
      'Redeem Points',
      `Redeem ${plan.pointsRequired} points for "${plan.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              setRedeeming(true);
              const res = await api.post('/auth/loyalty/redeem', { voucherPlanId: plan.id });
              if (res.success) {
                setRedeemedCoupon(res.data.couponCode);
                setModalVisible(true);
                loadData(true);
              } else {
                Alert.alert('Error', res.message || 'Redemption failed.');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Something went wrong.');
            } finally {
              setRedeeming(false);
            }
          }
        }
      ]
    );
  };

  const topPad = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 38);

  /* ─── INVITE TAB ─── */
  const renderInviteTab = () => (
    <>
      {/* Points balance chip */}
      <View style={[styles.pointsChip, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
        <Gift size={16} color={theme.brand[500]} />
        <Text style={[styles.pointsChipText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
          {loading ? '—' : `${points} Points Balance`}
        </Text>
      </View>

      {/* Hero card */}
      <View style={[styles.heroCard, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
        <View style={[styles.heroBadge, { backgroundColor: theme.brand[500] }]}>
          <Sparkles size={11} color={theme.brand[900]} />
          <Text style={[styles.heroBadgeText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
            REFERRAL REWARDS
          </Text>
        </View>
        <Text style={[styles.heroTitle, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
          Give 100 Points,{'\n'}Get 100 Points
        </Text>
        <Text style={[styles.heroSub, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
          Share your code. When a friend signs up, both of you earn 100 VIP points instantly.
        </Text>

        {/* Code box */}
        <View style={[styles.codeBox, { backgroundColor: theme.bg.hover, borderColor: theme.border }]}>
          <View>
            <Text style={[styles.codeLabel, { fontFamily: fonts.bold, color: theme.text.secondary }]}>YOUR CODE</Text>
            <Text style={[styles.codeValue, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
              {loading ? '...' : referralCode}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: copied ? '#22c55e' : theme.brand[500] }]}
            onPress={handleCopyCode}
            activeOpacity={0.8}
          >
            {copied
              ? <CheckCircle2 size={15} color="#fff" />
              : <Copy size={15} color={theme.brand[900]} />}
            <Text style={[styles.copyBtnText, { fontFamily: fonts.bold, color: copied ? '#fff' : theme.brand[900] }]}>
              {copied ? 'COPIED' : 'COPY'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: theme.brand[500] }]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Share2 size={17} color={theme.brand[900]} />
          <Text style={[styles.shareBtnText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
            SHARE INVITE LINK
          </Text>
        </TouchableOpacity>
      </View>

      {/* How it works */}
      <Text style={[styles.sectionLabel, { fontFamily: fonts.bold, color: theme.text.muted }]}>HOW IT WORKS</Text>
      <View style={[styles.stepsCard, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
        {[
          { n: '1', title: 'Share Your Code', desc: 'Send your code to friends via WhatsApp or SMS.' },
          { n: '2', title: 'Friend Registers', desc: 'They sign up on MARCOS using your referral code.' },
          { n: '3', title: 'Both Earn 100 Pts', desc: 'Reward points land in both accounts instantly.', accent: true },
        ].map((step, i) => (
          <View key={i}>
            {i > 0 && <View style={[styles.stepDivider, { backgroundColor: theme.border }]} />}
            <View style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: step.accent ? theme.brand[500] : theme.bg.hover }]}>
                {step.accent
                  ? <Gift size={16} color={theme.brand[900]} />
                  : <Text style={[styles.stepNumText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>{step.n}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { fontFamily: fonts.bold, color: theme.brand[900] }]}>{step.title}</Text>
                <Text style={[styles.stepDesc, { fontFamily: fonts.medium, color: theme.text.secondary }]}>{step.desc}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Referred friends */}
      <Text style={[styles.sectionLabel, { fontFamily: fonts.bold, color: theme.text.muted }]}>
        REFERRED FRIENDS ({referrals.length})
      </Text>
      {referrals.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
          <UserCheck size={28} color={theme.text.muted} />
          <Text style={[styles.emptyTitle, { fontFamily: fonts.bold, color: theme.brand[900] }]}>No referrals yet</Text>
          <Text style={[styles.emptySub, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
            Share your code and start earning!
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {referrals.map((ref, idx) => (
            <View key={ref.id || idx} style={[styles.refRow, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
              <View style={[styles.refAvatar, { backgroundColor: theme.brand[500] }]}>
                <Text style={[styles.refAvatarText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
                  {(ref.fullName || 'F')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.refName, { fontFamily: fonts.bold, color: theme.brand[900] }]}>{ref.fullName || 'MARCOS Member'}</Text>
                <Text style={[styles.refDate, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
                  Joined {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString('en-IN') : 'Recently'}
                </Text>
              </View>
              <View style={styles.greenBadge}>
                <Text style={[styles.greenBadgeText, { fontFamily: fonts.bold }]}>+100 pts</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );

  /* ─── HISTORY TAB ─── */
  const renderHistoryTab = () => (
    <>
      <View style={[styles.pointsChip, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
        <Star size={16} color={theme.brand[500]} />
        <Text style={[styles.pointsChipText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
          {loading ? '—' : `${points} Points Balance`}
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { fontFamily: fonts.bold, color: theme.text.muted }]}>POINTS HISTORY</Text>

      {loading ? (
        <ActivityIndicator size="small" color={theme.brand[500]} style={{ marginTop: 24 }} />
      ) : transactions.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
          <Receipt size={28} color={theme.text.muted} />
          <Text style={[styles.emptyTitle, { fontFamily: fonts.bold, color: theme.brand[900] }]}>No transactions yet</Text>
          <Text style={[styles.emptySub, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
            Earn points by shopping and referring friends.
          </Text>
        </View>
      ) : (
        <View style={[styles.historyCard, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
          {transactions.map((tx, idx) => {
            const isCredit = tx.points > 0;
            const couponCode = tx.reason?.includes('Coupon: ') ? tx.reason.split('Coupon: ')[1]?.trim() : null;
            const label = tx.reason?.includes('Coupon: ')
              ? `Redeemed ${tx.points === -500 ? '₹500' : '₹1,200'} Coupon`
              : tx.reason;
            return (
              <View key={tx.id || idx}>
                {idx > 0 && <View style={[styles.historyDivider, { backgroundColor: theme.border }]} />}
                <View style={styles.historyRow}>
                  <View style={[styles.historyIcon, {
                    backgroundColor: isCredit ? '#f0fdf4' : '#fef2f2',
                    borderColor: isCredit ? '#bbf7d0' : '#fecaca'
                  }]}>
                    <Star size={14} color={isCredit ? '#16a34a' : '#ef4444'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyLabel, { fontFamily: fonts.semiBold, color: theme.brand[900] }]} numberOfLines={1}>
                      {label}
                    </Text>
                    <Text style={[styles.historyDate, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                    {couponCode && (
                      <TouchableOpacity
                        style={[styles.couponTag, { backgroundColor: theme.bg.hover, borderColor: theme.border }]}
                        onPress={() => { Clipboard.setString(couponCode); Alert.alert('Copied', `${couponCode} copied!`); }}
                        activeOpacity={0.7}
                      >
                        <Copy size={10} color={theme.brand[500]} />
                        <Text style={[styles.couponTagText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                          {couponCode} · Tap to copy
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.historyPts, { fontFamily: fonts.bold, color: isCredit ? '#16a34a' : '#ef4444' }]}>
                    {isCredit ? `+${tx.points}` : tx.points}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </>
  );

  /* ─── REDEEM TAB ─── */
  const renderRedeemTab = () => (
    <>
      <View style={[styles.pointsChip, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
        <Trophy size={16} color={theme.brand[500]} />
        <Text style={[styles.pointsChipText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
          {loading ? '—' : `${points} Points Available`}
        </Text>
      </View>

      <View style={[styles.infoBox, { backgroundColor: theme.bg.hover, borderColor: theme.border }]}>
        <Info size={14} color={theme.text.secondary} />
        <Text style={[styles.infoText, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
          Redeem your points for exclusive discount vouchers on bespoke orders.
        </Text>
      </View>

      <Text style={[styles.sectionLabel, { fontFamily: fonts.bold, color: theme.text.muted }]}>AVAILABLE VOUCHERS</Text>

      {loading ? (
        <ActivityIndicator size="small" color={theme.brand[500]} style={{ marginTop: 24 }} />
      ) : voucherPlans.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
          <Trophy size={28} color={theme.text.muted} />
          <Text style={[styles.emptyTitle, { fontFamily: fonts.bold, color: theme.brand[900] }]}>No vouchers yet</Text>
          <Text style={[styles.emptySub, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
            Voucher reward plans will appear here when available.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {voucherPlans.map((plan) => {
            const canRedeem = points >= plan.pointsRequired;
            return (
              <View key={plan.id} style={[styles.voucherCard, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
                <View style={[styles.voucherIcon, { backgroundColor: canRedeem ? theme.brand[500] : theme.bg.hover }]}>
                  <Trophy size={20} color={canRedeem ? theme.brand[900] : theme.text.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.voucherTitle, { fontFamily: fonts.bold, color: theme.brand[900] }]}>{plan.title}</Text>
                  <Text style={[styles.voucherPts, { fontFamily: fonts.bold, color: canRedeem ? theme.brand[500] : theme.text.muted }]}>
                    {plan.pointsRequired} pts required
                  </Text>
                  {plan.description ? (
                    <Text style={[styles.voucherDesc, { fontFamily: fonts.medium, color: theme.text.secondary }]}>{plan.description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[styles.redeemBtn, { backgroundColor: canRedeem ? theme.brand[500] : theme.bg.hover }]}
                  onPress={() => handleRedeem(plan)}
                  activeOpacity={0.8}
                  disabled={!canRedeem}
                >
                  <Text style={[styles.redeemBtnText, { fontFamily: fonts.bold, color: canRedeem ? theme.brand[900] : theme.text.muted }]}>
                    REDEEM
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </>
  );

  /* ─── REDEMPTION MODAL ─── */
  const renderModal = () => (
    <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={[styles.modalIconBg, { backgroundColor: theme.brand[500] }]}>
            <Trophy size={32} color={theme.brand[900]} />
          </View>
          <Text style={[styles.modalTitle, { fontFamily: fonts.bold, color: theme.brand[900] }]}>Voucher Generated!</Text>
          <Text style={[styles.modalSub, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
            Use this code at checkout:
          </Text>
          <View style={[styles.modalCodeBox, { backgroundColor: theme.bg.hover, borderColor: theme.border }]}>
            <Text style={[styles.modalCode, { fontFamily: fonts.bold, color: theme.brand[900] }]}>{redeemedCoupon}</Text>
            <TouchableOpacity onPress={() => { Clipboard.setString(redeemedCoupon); Alert.alert('Copied', 'Code copied!'); }} style={{ padding: 4 }}>
              <Copy size={16} color={theme.brand[500]} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.modalDoneBtn, { backgroundColor: theme.brand[500] }]}
            onPress={() => setModalVisible(false)}
            activeOpacity={0.85}
          >
            <Text style={[styles.modalDoneText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>DONE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {redeeming && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.brand[500]} />
        </View>
      )}
      {renderModal()}

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderColor: theme.border }]}>
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: theme.bg.card, borderColor: theme.border }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={theme.brand[900]} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.brand[900] }]}>Loyalty & Rewards</Text>
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: theme.bg.card, borderColor: theme.border }]} onPress={handleShare} activeOpacity={0.7}>
          <Share2 size={18} color={theme.brand[900]} />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderColor: theme.border, backgroundColor: theme.bg.card }]}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
            <Text style={[styles.tabText, { fontFamily: fonts.bold, color: activeTab === tab ? theme.brand[900] : theme.text.muted }]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={[styles.tabIndicator, { backgroundColor: theme.brand[500] }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'INVITE' && renderInviteTab()}
        {activeTab === 'HISTORY' && renderHistoryTab()}
        {activeTab === 'REDEEM' && renderRedeemTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 42, height: 42, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative',
  },
  tabText: { fontSize: 12, letterSpacing: 0.6 },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 2, borderRadius: 2,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 50 },

  /* Points chip */
  pointsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, marginBottom: 20,
  },
  pointsChipText: { fontSize: 13.5 },

  /* Hero */
  heroCard: {
    borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 24,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, marginBottom: 14,
  },
  heroBadgeText: { fontSize: 10, letterSpacing: 0.8 },
  heroTitle: { fontSize: 21, lineHeight: 27, marginBottom: 8 },
  heroSub: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
  codeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16,
  },
  codeLabel: { fontSize: 9.5, letterSpacing: 0.8, marginBottom: 3 },
  codeValue: { fontSize: 18, letterSpacing: 1.5 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
  },
  copyBtnText: { fontSize: 12 },
  shareBtn: {
    height: 50, borderRadius: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  shareBtnText: { fontSize: 13.5, letterSpacing: 0.8 },

  /* Section label */
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: 12 },

  /* Steps */
  stepsCard: {
    borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 24,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepDivider: { height: 1, marginVertical: 14, marginLeft: 52 },
  stepNum: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 15 },
  stepTitle: { fontSize: 14, marginBottom: 2 },
  stepDesc: { fontSize: 12, lineHeight: 16 },

  /* Empty */
  emptyBox: {
    borderRadius: 20, borderWidth: 1, padding: 28,
    alignItems: 'center', gap: 6, marginBottom: 16,
  },
  emptyTitle: { fontSize: 14 },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 17 },

  /* List */
  list: { gap: 10, marginBottom: 8 },

  /* Referral row */
  refRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 16, borderWidth: 1,
  },
  refAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  refAvatarText: { fontSize: 16 },
  refName: { fontSize: 13.5 },
  refDate: { fontSize: 11, marginTop: 2 },
  greenBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  greenBadgeText: { color: '#16a34a', fontSize: 11 },

  /* History */
  historyCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  historyDivider: { height: 1, marginHorizontal: 14 },
  historyIcon: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  historyLabel: { fontSize: 13.5, marginBottom: 2 },
  historyDate: { fontSize: 11 },
  historyPts: { fontSize: 15 },
  couponTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 5, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start',
  },
  couponTagText: { fontSize: 10 },

  /* Info box */
  infoBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 17 },

  /* Voucher card */
  voucherCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 18, borderWidth: 1,
  },
  voucherIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  voucherTitle: { fontSize: 14, marginBottom: 2 },
  voucherPts: { fontSize: 12 },
  voucherDesc: { fontSize: 11, marginTop: 2 },
  redeemBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  redeemBtnText: { fontSize: 11 },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    borderRadius: 24, padding: 28, alignItems: 'center', width: '100%',
  },
  modalIconBg: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, marginBottom: 6 },
  modalSub: { fontSize: 13, marginBottom: 20, textAlign: 'center' },
  modalCodeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 20,
  },
  modalCode: { fontSize: 22, letterSpacing: 2 },
  modalDoneBtn: {
    width: '100%', height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  modalDoneText: { fontSize: 14, letterSpacing: 0.8 },
});
