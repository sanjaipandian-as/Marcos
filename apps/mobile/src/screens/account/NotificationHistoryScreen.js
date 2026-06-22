import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import {
  Bell,
  BellOff,
  CheckCheck,
  Circle,
  CreditCard,
  Plus,
  Trash2,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  Clock,
  Settings
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationHistoryScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      if (notifications.length === 0) {
        setLoading(true);
      }
      const res = await api.get('/notifications/history');
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadNotifications();
    });
    return unsubscribe;
  }, [navigation, notifications]);

  const handleMarkAsRead = async (recipientId) => {
    try {
      const res = await api.put(`/notifications/recipients/${recipientId}/read`);
      if (res.success) {
        setNotifications(prev =>
          prev.map(item => item.id === recipientId ? { ...item, isRead: true } : item)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (notifications.every(n => n.isRead)) return;
    try {
      const res = await api.put('/notifications/recipients/read-all');
      if (res.success) {
        setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
        Alert.alert('Inbox Updated', 'All notifications marked as read.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderNotification = ({ item }) => {
    const notifyDate = new Date(item.notification?.createdAt || item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <TouchableOpacity
        style={[
          styles.notifCard,
          shadows.premium,
          !item.isRead && styles.unreadCard
        ]}
        onPress={() => !item.isRead && handleMarkAsRead(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.notifIconWrapper}>
          <LinearGradient
            colors={!item.isRead ? [theme.brand[500], theme.brand[800]] : ['#f1f5f9', '#e2e8f0']}
            style={styles.notifIconCircle}
          >
            <Bell size={16} color={!item.isRead ? '#ffffff' : '#94a3b8'} />
          </LinearGradient>
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeaderRow}>
            <Text style={[styles.notifTitle, { fontFamily: fonts.bold }]} numberOfLines={1}>
              {item.notification?.title || item.title || 'Notification'}
            </Text>
            <Text style={[styles.notifDate, { fontFamily: fonts.medium }]}>
              {notifyDate}
            </Text>
          </View>
          <Text style={[styles.notifBody, { fontFamily: fonts.medium }]} numberOfLines={2}>
            {item.notification?.body || item.body || ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaymentMethod = (item) => (
    <View key={item.id} style={[styles.paymentCard, shadows.premium]}>
      <View style={styles.paymentCardTop}>
        <View style={styles.paymentBrand}>
          <CreditCard size={24} color="#006241" />
          <View style={styles.brandMeta}>
            <Text style={[styles.cardBrandName, { fontFamily: fonts.bold }]}>{item.brand}</Text>
            <Text style={[styles.cardNumber, { fontFamily: fonts.bold }]}>•••• •••• •••• {item.last4}</Text>
          </View>
        </View>
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <ShieldCheck size={10} color="#006241" />
            <Text style={[styles.defaultBadgeText, { fontFamily: fonts.bold }]}>DEFAULT</Text>
          </View>
        )}
      </View>
      <View style={styles.paymentCardBottom}>
        <Text style={[styles.expiryText, { fontFamily: fonts.medium }]}>Expires: {item.expiry}</Text>
        <View style={styles.paymentActions}>
          <TouchableOpacity onPress={() => Alert.alert('Edit Card', 'Secure card editing is coming soon.')}>
            <Settings size={18} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Delete Card', 'Are you sure you want to remove this card?')}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      <StatusBar barStyle="dark-content" translucent={false} />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Notifications
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1 }}>
        {notifications.length > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.7}>
            <CheckCheck size={14} color={theme.brand[500]} />
            <Text style={[styles.markAllText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>Mark all read</Text>
          </TouchableOpacity>
        )}

        {loading && notifications.length === 0 ? (
          <View style={styles.listPadding}>
            {[1, 2, 3, 4].map(idx => (
              <View key={idx} style={[styles.skeletonCard, shadows.premium, { backgroundColor: theme.border }]} />
            ))}
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <BellOff size={60} color={theme.text.muted} />
            <Text style={[styles.emptyTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>Your inbox is empty</Text>
            <Text style={[styles.emptyText, { fontFamily: fonts.medium, color: theme.text.secondary }]}>We'll notify you about orders and special bespoke offers here.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPadding}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfaf7' },
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
  skeletonCard: {
    height: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listPadding: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginRight: 24, marginTop: 12, gap: 6 },
  markAllText: { fontSize: 11 },
  notifCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 12 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#e85c1c' },
  notifIconWrapper: { marginRight: 16 },
  notifIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1 },
  notifHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 14, color: '#1e293b', flex: 1, marginRight: 8 },
  notifDate: { fontSize: 10, color: '#94a3b8' },
  notifBody: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 40, gap: 12 },
  emptyTitle: { fontSize: 18, color: '#1e293b' },
  emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 11, color: '#94a3b8', letterSpacing: 1.5 },
  addCardBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addCardBtnText: { fontSize: 11, color: '#006241' },
  paymentCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, marginBottom: 16 },
  paymentCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  paymentBrand: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  brandMeta: { gap: 2 },
  cardBrandName: { fontSize: 14, color: '#94a3b8', textTransform: 'uppercase' },
  cardNumber: { fontSize: 18, color: '#1e293b', letterSpacing: 1 },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  defaultBadgeText: { fontSize: 9, color: '#006241' },
  paymentCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  expiryText: { fontSize: 13, color: '#64748b' },
  paymentActions: { flexDirection: 'row', gap: 20 },
  securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  securityNoteText: { fontSize: 11, color: '#94a3b8' },
});
