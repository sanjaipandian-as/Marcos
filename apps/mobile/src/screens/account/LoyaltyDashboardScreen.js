import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Share,
  Alert,
  Platform,
  StatusBar,
  Dimensions,
  Modal,
  Clipboard
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import { 
  Gift, 
  Share2, 
  Users, 
  Receipt, 
  ChevronRight, 
  ChevronLeft,
  Info,
  Copy,
  Trophy,
  Star
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function LoyaltyDashboardScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('LOGS'); // LOGS, REDEEM, REFERRALS
  const [redeemedCoupon, setRedeemedCoupon] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const loadProfile = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get('/auth/profile');
      if (res.success) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error('Error fetching loyalty profile:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const points = profile?.pointsBalance || 0;

  const getInviteMsg = () => {
    const inviteLink = `https://marcos-bespoke.com/invite?code=${profile?.referralCode}`;
    return `Hey! Join me at ${APP_CONFIG.STORE_NAME} Bespoke Tailoring. Use my referral code: ${profile?.referralCode} to get 100 bonus points on your first tailoring order!\n\nTap here to download & register: ${inviteLink}`;
  };

  const handleShareSystem = async () => {
    try {
      const inviteLink = `https://marcos-bespoke.com/invite?code=${profile?.referralCode}`;
      await Share.share({
        message: getInviteMsg(),
        url: inviteLink,
        title: 'Join MARCOS Tailoring',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = () => {
    if (profile?.referralCode) {
      Clipboard.setString(profile.referralCode);
      Alert.alert('Copied', 'Referral code copied to clipboard!');
    }
  };

  const handleRedeem = (pointsToRedeem, label) => {
    if (points < pointsToRedeem) {
      Alert.alert('Insufficient Points', `You need at least ${pointsToRedeem} points to redeem this voucher.`);
      return;
    }

    Alert.alert(
      'Redeem Points',
      `Are you sure you want to redeem ${pointsToRedeem} points for a ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Redeem', 
          onPress: async () => {
            try {
              setRedeeming(true);
              const res = await api.post('/auth/loyalty/redeem', { pointsToRedeem });
              if (res.success) {
                setRedeemedCoupon(res.data.couponCode);
                setModalVisible(true);
                // Refresh profile/points in background
                loadProfile(true);
              } else {
                Alert.alert('Error', res.message || 'Points redemption failed.');
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

  const renderSkeleton = () => (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={[styles.skelBtn, { backgroundColor: theme.border }]} />
        <View style={[styles.skelTitle, { backgroundColor: theme.border, width: 120, height: 18 }]} />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tier Card Skeleton */}
        <View style={[styles.skelCard, { backgroundColor: theme.border }]} />

        {/* Tabs Skeleton */}
        <View style={styles.skelTabs}>
          <View style={[styles.skelTab, { backgroundColor: theme.border }]} />
          <View style={[styles.skelTab, { backgroundColor: theme.border }]} />
          <View style={[styles.skelTab, { backgroundColor: theme.border }]} />
        </View>

        {/* Rows Skeleton */}
        <View style={{ paddingHorizontal: 24, gap: 14 }}>
          {[1, 2, 3].map(k => (
            <View key={k} style={[styles.skelRow, { backgroundColor: theme.bg.card, borderColor: theme.border }]} />
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (loading && !profile) {
    return renderSkeleton();
  }

  const transactions = profile?.pointTransactions || [];
  const referrals = profile?.referrals || [];

  const renderPointsCard = () => (
    <View style={[styles.pointsCard, shadows.premium]}>
      <LinearGradient
        colors={[theme.brand[700], theme.brand[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pointsGradient}
      >
        <Text style={[styles.pointsLabel, { fontFamily: fonts.bold }]}>YOUR POINTS BALANCE</Text>
        <View style={styles.pointsRow}>
          <Gift size={30} color="#ffffff" style={{ opacity: 0.95 }} />
          <Text style={[styles.pointsVal, { fontFamily: fonts.extraBold }]}>{points}</Text>
          <Text style={[styles.pointsUnitText, { fontFamily: fonts.semiBold }]}>points</Text>
        </View>
        <Text style={[styles.pointsHint, { fontFamily: fonts.medium }]}>
          Earn more points by sharing your referral code with friends!
        </Text>
      </LinearGradient>
    </View>
  );

  const renderReferralSection = () => (
    <View style={[styles.referralSection, shadows.premium, { backgroundColor: theme.bg.card }]}>
      <View style={styles.sectionHeader}>
        <Users size={20} color={theme.brand[500]} />
        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>Referral Program</Text>
      </View>
      
      <Text style={[styles.referralDesc, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
        Invite friends to experience {APP_CONFIG.STORE_NAME} Bespoke Tailoring and earn loyalty rewards.
      </Text>

      {/* Visual Referral Guide Steps */}
      <View style={styles.referralStepsRow}>
        <View style={styles.stepItem}>
          <View style={[styles.stepNumBg, { backgroundColor: theme.brand[50] }]}>
            <Text style={[styles.stepNum, { fontFamily: fonts.bold, color: theme.brand[500] }]}>1</Text>
          </View>
          <Text style={[styles.stepText, { fontFamily: fonts.bold, color: theme.text.primary }]}>Share Code</Text>
        </View>
        <ChevronRight size={14} color={theme.text.muted} />
        <View style={styles.stepItem}>
          <View style={[styles.stepNumBg, { backgroundColor: theme.brand[50] }]}>
            <Text style={[styles.stepNum, { fontFamily: fonts.bold, color: theme.brand[500] }]}>2</Text>
          </View>
          <Text style={[styles.stepText, { fontFamily: fonts.bold, color: theme.text.primary }]}>Friend Joins</Text>
        </View>
        <ChevronRight size={14} color={theme.text.muted} />
        <View style={styles.stepItem}>
          <View style={[styles.stepNumBg, { backgroundColor: theme.brand[50] }]}>
            <Text style={[styles.stepNum, { fontFamily: fonts.bold, color: theme.brand[500] }]}>3</Text>
          </View>
          <Text style={[styles.stepText, { fontFamily: fonts.bold, color: theme.text.primary }]}>Both Earn 100 pts</Text>
        </View>
      </View>

      <View style={[styles.codeContainer, { borderColor: theme.border, backgroundColor: theme.bg.input }]}>
        <View style={styles.codeWrapper}>
          <Text style={[styles.codeLabel, { fontFamily: fonts.bold, color: theme.text.muted }]}>YOUR UNIQUE CODE</Text>
          <Text style={[styles.codeValue, { fontFamily: fonts.extraBold, color: theme.brand[500] }]}>{profile?.referralCode}</Text>
        </View>
        <TouchableOpacity style={[styles.copyBtn, { backgroundColor: theme.bg.card, borderColor: theme.border }]} onPress={copyToClipboard}>
          <Copy size={18} color={theme.brand[500]} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.shareBtnPremium, { backgroundColor: theme.brand[500] }]} onPress={handleShareSystem} activeOpacity={0.85}>
        <Share2 size={18} color="#ffffff" />
        <Text style={[styles.shareBtnText, { fontFamily: fonts.bold }]}>INVITE FRIENDS NOW</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRedeemModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={[styles.modalIconBg, { backgroundColor: theme.brand[50] }]}>
            <Trophy size={36} color={theme.brand[500]} />
          </View>
          <Text style={[styles.modalTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Voucher Generated!
          </Text>
          <Text style={[styles.modalSub, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
            Copy your unique single-use code to use during checkout:
          </Text>

          <View style={[styles.modalCodeBox, { backgroundColor: theme.bg.input, borderColor: theme.border }]}>
            <Text style={[styles.modalCodeText, { fontFamily: fonts.extraBold, color: theme.brand[500] }]}>
              {redeemedCoupon}
            </Text>
            <TouchableOpacity 
              style={[styles.modalCopyBtn, { backgroundColor: theme.bg.card }]} 
              onPress={() => {
                Clipboard.setString(redeemedCoupon);
                Alert.alert('Copied', 'Coupon code copied!');
              }}
            >
              <Copy size={16} color={theme.brand[500]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.modalCloseBtn, { backgroundColor: theme.brand[500] }]} 
            onPress={() => setModalVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.modalCloseBtnText, { fontFamily: fonts.bold }]}>
              DONE
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      <StatusBar barStyle="dark-content" />
      {redeeming && (
        <View style={styles.absoluteLoader}>
          <ActivityIndicator size="large" color={theme.brand[500]} />
        </View>
      )}
      {renderRedeemModal()}
      
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.bg.main }]}>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium, { backgroundColor: theme.bg.card }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>Invite & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderPointsCard()}

        <View style={[styles.tabsWrapper, { borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('LOGS')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText, 
              { fontFamily: fonts.bold, color: activeTab === 'LOGS' ? theme.brand[500] : theme.text.muted }
            ]}>HISTORY</Text>
            {activeTab === 'LOGS' && <View style={[styles.activeTabIndicator, { backgroundColor: theme.brand[500] }]} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('REDEEM')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText, 
              { fontFamily: fonts.bold, color: activeTab === 'REDEEM' ? theme.brand[500] : theme.text.muted }
            ]}>REDEEM</Text>
            {activeTab === 'REDEEM' && <View style={[styles.activeTabIndicator, { backgroundColor: theme.brand[500] }]} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tab} 
            onPress={() => setActiveTab('REFERRALS')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText, 
              { fontFamily: fonts.bold, color: activeTab === 'REFERRALS' ? theme.brand[500] : theme.text.muted }
            ]}>REFERRALS</Text>
            {activeTab === 'REFERRALS' && <View style={[styles.activeTabIndicator, { backgroundColor: theme.brand[500] }]} />}
          </TouchableOpacity>
        </View>

        {activeTab === 'LOGS' && (
          <View style={styles.logsContainer}>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Receipt size={40} color={theme.text.muted} />
                <Text style={[styles.emptyStateText, { fontFamily: fonts.medium, color: theme.text.secondary }]}>No point transactions yet</Text>
              </View>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={[styles.logItem, { borderBottomColor: theme.border }]}>
                  <View style={[styles.logIcon, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
                    <Star size={16} color={tx.points > 0 ? '#10b981' : '#ef4444'} />
                  </View>
                  <View style={styles.logInfo}>
                    <Text style={[styles.logReason, { fontFamily: fonts.semiBold, color: theme.text.primary }]}>
                      {tx.reason.includes('Coupon: ')
                        ? `Redeemed ${tx.points === -500 ? '₹500' : '₹1,200'} Coupon`
                        : tx.reason}
                    </Text>
                    <Text style={[styles.logDate, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                    {tx.reason.includes('Coupon: ') && (() => {
                      const code = tx.reason.split('Coupon: ')[1]?.trim();
                      return code ? (
                        <TouchableOpacity 
                          style={[styles.copyCouponBadge, { backgroundColor: theme.bg.input, borderColor: theme.border }]} 
                          onPress={() => {
                            Clipboard.setString(code);
                            Alert.alert('Copied', `Coupon code ${code} copied to clipboard!`);
                          }}
                          activeOpacity={0.7}
                        >
                          <Copy size={11} color={theme.brand[500]} />
                          <Text style={[styles.copyCouponBadgeText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                            {code} (Tap to Copy)
                          </Text>
                        </TouchableOpacity>
                      ) : null;
                    })()}
                  </View>
                  <Text style={[styles.logPoints, { fontFamily: fonts.bold, color: tx.points > 0 ? '#10b981' : '#ef4444' }]}>
                    {tx.points > 0 ? `+${tx.points}` : tx.points}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'REDEEM' && (
          <View style={styles.redeemContainer}>
            <View style={[styles.infoBox, { backgroundColor: theme.brand[50] }]}>
              <Info size={16} color={theme.brand[500]} />
              <Text style={[styles.infoBoxText, { fontFamily: fonts.medium, color: theme.brand[800] }]}>
                Redeem points for exclusive discounts on your next bespoke order.
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.redeemItem, shadows.premium, { backgroundColor: theme.bg.card }]} 
              activeOpacity={0.8}
              onPress={() => handleRedeem(500, '₹500 Discount Voucher')}
            >
              <View style={[styles.redeemIconWrapper, { backgroundColor: theme.brand[50] }]}>
                <Trophy size={20} color={theme.brand[500]} />
              </View>
              <View style={styles.redeemInfo}>
                <Text style={[styles.redeemTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>₹500 Discount Voucher</Text>
                <Text style={[styles.redeemPoints, { fontFamily: fonts.bold, color: theme.brand[500] }]}>500 POINTS</Text>
              </View>
              <View style={[styles.redeemAction, { backgroundColor: theme.brand[500], opacity: points >= 500 ? 1 : 0.4 }]}>
                <Text style={[styles.redeemActionText, { fontFamily: fonts.bold }]}>REDEEM</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.redeemItem, shadows.premium, { backgroundColor: theme.bg.card }]} 
              activeOpacity={0.8}
              onPress={() => handleRedeem(1000, '₹1,200 Discount Voucher')}
            >
              <View style={[styles.redeemIconWrapper, { backgroundColor: theme.brand[50] }]}>
                <Trophy size={20} color={theme.brand[500]} />
              </View>
              <View style={styles.redeemInfo}>
                <Text style={[styles.redeemTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>₹1,200 Discount Voucher</Text>
                <Text style={[styles.redeemPoints, { fontFamily: fonts.bold, color: theme.brand[500] }]}>1000 POINTS</Text>
              </View>
              <View style={[styles.redeemAction, { backgroundColor: theme.brand[500], opacity: points >= 1000 ? 1 : 0.4 }]}>
                <Text style={[styles.redeemActionText, { fontFamily: fonts.bold }]}>REDEEM</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'REFERRALS' && (
          <View style={styles.referralsWrapper}>
            {renderReferralSection()}
            
            <View style={styles.referredList}>
              <Text style={[styles.referredListTitle, { fontFamily: fonts.bold, color: theme.text.muted }]}>REFERRED FRIENDS ({referrals.length})</Text>
              {referrals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={32} color={theme.text.muted} />
                  <Text style={[styles.emptyStateText, { fontFamily: fonts.medium, color: theme.text.secondary }]}>No referrals yet</Text>
                </View>
              ) : (
                referrals.map((ref, idx) => (
                  <View key={idx} style={[styles.referredItem, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
                    <View style={[styles.referredAvatar, { backgroundColor: theme.brand[50] }]}>
                      <Text style={[styles.referredAvatarText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>{ref.fullName[0]}</Text>
                    </View>
                    <View style={styles.referredInfo}>
                      <Text style={[styles.referredName, { fontFamily: fonts.semiBold, color: theme.text.primary }]}>{ref.fullName}</Text>
                      <Text style={[styles.referredDate, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
                        Joined {new Date(ref.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    <View style={[styles.rewardBadge, { backgroundColor: theme.brand[50] }]}>
                      <Text style={[styles.rewardBadgeText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>+100</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  absoluteLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  pointsCard: {
    marginHorizontal: 24,
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  pointsGradient: {
    padding: 24,
  },
  pointsLabel: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  pointsVal: {
    fontSize: 42,
    color: '#ffffff',
    lineHeight: 46,
  },
  pointsUnitText: {
    fontSize: 15,
    color: '#ffffff',
    opacity: 0.9,
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  pointsHint: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.85,
    lineHeight: 18,
  },
  tabsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '25%',
    right: '25%',
    height: 3,
    borderRadius: 2,
  },
  logsContainer: {
    paddingHorizontal: 24,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  logInfo: {
    flex: 1,
  },
  logReason: {
    fontSize: 14,
    marginBottom: 2,
  },
  logDate: {
    fontSize: 11,
  },
  logPoints: {
    fontSize: 16,
  },
  redeemContainer: {
    paddingHorizontal: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  infoBoxText: {
    fontSize: 12,
    flex: 1,
  },
  redeemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  redeemIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  redeemInfo: {
    flex: 1,
  },
  redeemTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  redeemPoints: {
    fontSize: 12,
  },
  redeemAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  redeemActionText: {
    fontSize: 10,
    color: '#ffffff',
  },
  referralsWrapper: {
    paddingHorizontal: 24,
  },
  referralSection: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
  },
  referralDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  referralStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  stepItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  stepNumBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 12,
  },
  stepText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  codeWrapper: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 20,
    letterSpacing: 2,
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  shareBtnPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    gap: 10,
  },
  shareBtnText: {
    fontSize: 15,
    color: '#ffffff',
  },
  referredList: {
    gap: 12,
  },
  referredListTitle: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
  },
  referredItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  referredAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  referredAvatarText: {
    fontSize: 16,
  },
  referredInfo: {
    flex: 1,
  },
  referredName: {
    fontSize: 14,
  },
  referredDate: {
    fontSize: 11,
  },
  rewardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardBadgeText: {
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 13,
  },
  copyCouponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
  },
  copyCouponBadgeText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },

  /* Skeleton styling */
  skelBtn: {
    width: 40, height: 40, borderRadius: 12,
  },
  skelTitle: {
    borderRadius: 8,
  },
  skelCard: {
    marginHorizontal: 24,
    height: 140,
    borderRadius: 24,
    marginTop: 10,
    marginBottom: 24,
    opacity: 0.6,
  },
  skelTabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 20,
  },
  skelTab: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    opacity: 0.6,
  },
  skelRow: {
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    opacity: 0.8,
  },

  /* Modal styling */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  modalIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    width: '100%',
    justifyContent: 'space-between',
  },
  modalCodeText: {
    fontSize: 18,
    letterSpacing: 1,
  },
  modalCopyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 1,
  },
});
