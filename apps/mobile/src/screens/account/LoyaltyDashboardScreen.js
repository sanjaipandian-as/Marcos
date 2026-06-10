import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Share,
  Linking,
  Alert,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import { 
  Gift, 
  Share2, 
  Users, 
  Receipt, 
  MessageSquareCode, 
  Crown, 
  Sparkles, 
  ChevronRight, 
  ArrowRight, 
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

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/profile');
      if (res.success) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error('Error fetching loyalty profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const points = profile?.pointsBalance || 0;
  const nextTierPoints = 1000;
  const progress = Math.min(1, points / nextTierPoints) * 100;

  const getInviteMsg = () => {
    return `Hey! Join me at ${APP_CONFIG.STORE_NAME} Bespoke Tailoring. Use my referral code: ${profile?.referralCode} to get 100 bonus points on your first tailoring order!`;
  };

  const handleShareSystem = async () => {
    try {
      await Share.share({
        message: getInviteMsg(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = () => {
    // In a real app, use Clipboard.setString
    Alert.alert('Copied', 'Referral code copied to clipboard!');
  };

  if (loading && !profile) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#006241" />
      </View>
    );
  }

  const transactions = profile?.pointTransactions || [];
  const referrals = profile?.referrals || [];

  const renderTierCard = () => (
    <View style={[styles.tierCard, shadows.premium]}>
      <LinearGradient
        colors={['#0a1d17', '#006241']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tierGradient}
      >
        <View style={styles.tierHeader}>
          <View>
            <Text style={[styles.tierLabel, { fontFamily: fonts.bold }]}>CURRENT STATUS</Text>
            <Text style={[styles.tierName, { fontFamily: fonts.extraBold }]}>
              {points >= 1000 ? 'PLATINUM VIP' : 'GOLD MEMBER'}
            </Text>
          </View>
          <View style={styles.tierIconWrapper}>
            <Crown size={28} color="#c5a880" />
          </View>
        </View>

        <View style={styles.pointsDisplay}>
          <Text style={[styles.pointsVal, { fontFamily: fonts.extraBold }]}>{points}</Text>
          <Text style={[styles.pointsUnit, { fontFamily: fonts.bold }]}>POINTS</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { fontFamily: fonts.medium }]}>
              {points >= 1000 ? 'Highest Tier Reached' : `${1000 - points} points to Platinum`}
            </Text>
            <Text style={[styles.progressPercent, { fontFamily: fonts.bold }]}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderReferralSection = () => (
    <View style={[styles.referralSection, shadows.premium]}>
      <View style={styles.sectionHeader}>
        <Users size={20} color="#006241" />
        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold }]}>Referral Program</Text>
      </View>
      
      <Text style={[styles.referralDesc, { fontFamily: fonts.medium }]}>
        Invite friends to experience MARCOS. Both of you earn <Text style={{ color: '#006241' }}>100 bonus points</Text> on their first order.
      </Text>

      <View style={styles.codeContainer}>
        <View style={styles.codeWrapper}>
          <Text style={[styles.codeLabel, { fontFamily: fonts.bold }]}>YOUR UNIQUE CODE</Text>
          <Text style={[styles.codeValue, { fontFamily: fonts.extraBold }]}>{profile?.referralCode}</Text>
        </View>
        <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
          <Copy size={20} color="#006241" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.shareBtnPremium} onPress={handleShareSystem}>
        <Share2 size={18} color="#ffffff" />
        <Text style={[styles.shareBtnText, { fontFamily: fonts.bold }]}>INVITE FRIENDS NOW</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={['#0a1d17', '#006241']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>VIP Rewards</Text>
          <Text style={[styles.headerSub, { fontFamily: fonts.medium }]}>Your bespoke loyalty journey</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderTierCard()}

        <View style={styles.tabsWrapper}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'LOGS' && styles.activeTab]} 
            onPress={() => setActiveTab('LOGS')}
          >
            <Text style={[styles.tabText, activeTab === 'LOGS' && styles.activeTabText, { fontFamily: fonts.bold }]}>HISTORY</Text>
            {activeTab === 'LOGS' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'REDEEM' && styles.activeTab]} 
            onPress={() => setActiveTab('REDEEM')}
          >
            <Text style={[styles.tabText, activeTab === 'REDEEM' && styles.activeTabText, { fontFamily: fonts.bold }]}>REDEEM</Text>
            {activeTab === 'REDEEM' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'REFERRALS' && styles.activeTab]} 
            onPress={() => setActiveTab('REFERRALS')}
          >
            <Text style={[styles.tabText, activeTab === 'REFERRALS' && styles.activeTabText, { fontFamily: fonts.bold }]}>REFERRALS</Text>
            {activeTab === 'REFERRALS' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        </View>

        {activeTab === 'LOGS' && (
          <View style={styles.logsContainer}>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Receipt size={40} color="#cbd5e1" />
                <Text style={[styles.emptyStateText, { fontFamily: fonts.medium }]}>No point transactions yet</Text>
              </View>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.logItem}>
                  <View style={styles.logIcon}>
                    <Star size={16} color={tx.points > 0 ? '#10b981' : '#ef4444'} />
                  </View>
                  <View style={styles.logInfo}>
                    <Text style={[styles.logReason, { fontFamily: fonts.semiBold }]}>{tx.reason}</Text>
                    <Text style={[styles.logDate, { fontFamily: fonts.medium }]}>
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
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
            <View style={styles.infoBox}>
              <Info size={16} color="#006241" />
              <Text style={[styles.infoBoxText, { fontFamily: fonts.medium }]}>
                Redeem points for exclusive discounts on your next bespoke order.
              </Text>
            </View>
            
            <TouchableOpacity style={[styles.redeemItem, shadows.premium]}>
              <View style={styles.redeemIconWrapper}>
                <Trophy size={20} color="#c5a880" />
              </View>
              <View style={styles.redeemInfo}>
                <Text style={[styles.redeemTitle, { fontFamily: fonts.bold }]}>₹500 Discount Voucher</Text>
                <Text style={[styles.redeemPoints, { fontFamily: fonts.bold }]}>500 POINTS</Text>
              </View>
              <View style={[styles.redeemAction, { opacity: points >= 500 ? 1 : 0.4 }]}>
                <Text style={[styles.redeemActionText, { fontFamily: fonts.bold }]}>REDEEM</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.redeemItem, shadows.premium]}>
              <View style={styles.redeemIconWrapper}>
                <Trophy size={20} color="#c5a880" />
              </View>
              <View style={styles.redeemInfo}>
                <Text style={[styles.redeemTitle, { fontFamily: fonts.bold }]}>₹1,200 Discount Voucher</Text>
                <Text style={[styles.redeemPoints, { fontFamily: fonts.bold }]}>1000 POINTS</Text>
              </View>
              <View style={[styles.redeemAction, { opacity: points >= 1000 ? 1 : 0.4 }]}>
                <Text style={[styles.redeemActionText, { fontFamily: fonts.bold }]}>REDEEM</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'REFERRALS' && (
          <View style={styles.referralsWrapper}>
            {renderReferralSection()}
            
            <View style={styles.referredList}>
              <Text style={[styles.referredListTitle, { fontFamily: fonts.bold }]}>REFERRED FRIENDS ({referrals.length})</Text>
              {referrals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={32} color="#cbd5e1" />
                  <Text style={[styles.emptyStateText, { fontFamily: fonts.medium }]}>No referrals yet</Text>
                </View>
              ) : (
                referrals.map((ref, idx) => (
                  <View key={idx} style={styles.referredItem}>
                    <View style={styles.referredAvatar}>
                      <Text style={[styles.referredAvatarText, { fontFamily: fonts.bold }]}>{ref.fullName[0]}</Text>
                    </View>
                    <View style={styles.referredInfo}>
                      <Text style={[styles.referredName, { fontFamily: fonts.semiBold }]}>{ref.fullName}</Text>
                      <Text style={[styles.referredDate, { fontFamily: fonts.medium }]}>
                        Joined {new Date(ref.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    <View style={styles.rewardBadge}>
                      <Text style={[styles.rewardBadgeText, { fontFamily: fonts.bold }]}>+100</Text>
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
    backgroundColor: '#f8fafc',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tierCard: {
    marginHorizontal: 24,
    marginTop: -20,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  tierGradient: {
    padding: 24,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tierLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  tierName: {
    fontSize: 22,
    color: '#ffffff',
    marginTop: 4,
  },
  tierIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 24,
  },
  pointsVal: {
    fontSize: 42,
    color: '#ffffff',
  },
  pointsUnit: {
    fontSize: 14,
    color: '#c5a880',
    letterSpacing: 1,
  },
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  progressPercent: {
    fontSize: 12,
    color: '#ffffff',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#c5a880',
    borderRadius: 3,
  },
  tabsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  activeTabText: {
    color: '#006241',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#006241',
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
    borderBottomColor: '#f1f5f9',
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  logInfo: {
    flex: 1,
  },
  logReason: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 2,
  },
  logDate: {
    fontSize: 11,
    color: '#94a3b8',
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
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },
  redeemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  redeemIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fefce8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  redeemInfo: {
    flex: 1,
  },
  redeemTitle: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 2,
  },
  redeemPoints: {
    fontSize: 12,
    color: '#006241',
  },
  redeemAction: {
    backgroundColor: '#006241',
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
    backgroundColor: '#ffffff',
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
    color: '#1e293b',
  },
  referralDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
  },
  codeWrapper: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 9,
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 20,
    color: '#006241',
    letterSpacing: 2,
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  shareBtnPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006241',
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
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  referredItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  referredAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  referredAvatarText: {
    fontSize: 16,
    color: '#006241',
  },
  referredInfo: {
    flex: 1,
  },
  referredName: {
    fontSize: 14,
    color: '#1e293b',
  },
  referredDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  rewardBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardBadgeText: {
    fontSize: 11,
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#94a3b8',
  },
});
