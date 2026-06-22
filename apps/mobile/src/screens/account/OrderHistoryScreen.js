import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
  StatusBar,
  Image,
  ScrollView,
  TextInput,
  Dimensions,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import { getSocket } from '../../utils/socket';
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  Headphones,
  Search,
  RotateCcw,
  ChevronRight,
  ShoppingBag,
  FileText,
  X,
  Filter,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'ALL',       label: 'All Orders' },
  { key: 'ACTIVE',    label: 'Active' },
  { key: 'COMPLETED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function OrderHistoryScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      if (res.success) setOrders(res.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effect 1: re-fetch order list on every screen focus (source of truth)
  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  // Effect 2: socket listener — mount once, unmount once (live badge updates)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = ({ orderId, newStatus }) => {
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    };
    socket.on('order:status_changed', handler);
    return () => socket.off('order:status_changed', handler);
  }, []);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (activeTab === 'ACTIVE')    list = orders.filter(o => ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED'].includes(o.status));
    if (activeTab === 'COMPLETED') list = orders.filter(o => o.status === 'DELIVERED');
    if (activeTab === 'CANCELLED') list = orders.filter(o => o.status === 'CANCELLED');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o =>
        o.invoiceNumber?.toLowerCase().includes(q) ||
        o.orderItems?.some(i => i.product?.name?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [orders, activeTab, searchQuery]);

  const handleInvoice = url => {
    if (!url) {
      Alert.alert('Invoice Pending', 'Your invoice is being prepared and will be available shortly.');
      return;
    }
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open invoice.'));
  };

  const getStatusConfig = status => {
    switch (status) {
      case 'DELIVERED':        return { color: '#16a34a', bg: '#f0fdf4', label: 'Delivered',                Icon: CheckCircle2 };
      case 'OUT_FOR_DELIVERY': return { color: '#059669', bg: '#ecfdf5', label: 'Product Out for Delivery', Icon: Truck };
      case 'SHIPPED':          return { color: '#0891b2', bg: '#ecfeff', label: 'Product Completed',        Icon: Package };
      case 'PROCESSING':       return { color: '#3b82f6', bg: '#eff6ff', label: 'Order Stitching',          Icon: Package };
      case 'PAID':             return { color: '#8b5cf6', bg: '#f5f3ff', label: 'Measurement Session',     Icon: Clock };
      case 'PENDING':          return { color: '#f59e0b', bg: '#fffbeb', label: 'Order Placed',             Icon: Clock };
      case 'CANCELLED':        return { color: '#ef4444', bg: '#fef2f2', label: 'Cancelled',                Icon: XCircle };
      default:                 return { color: '#64748b', bg: '#f1f5f9', label: status,                     Icon: Clock };
    }
  };

  const getStatusDescription = (item) => {
    const orderDate = new Date(item.createdAt);
    const addDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };
    switch (item.status) {
      case 'DELIVERED':        return `Delivered on ${addDays(orderDate, 8)}`;
      case 'OUT_FOR_DELIVERY': return `Delivery executive is delivering your items today.`;
      case 'SHIPPED':          return `Stitching completed. Preparing for delivery.`;
      case 'PROCESSING':       return `Our tailors are stitching your custom measurements. Est. completion: ${addDays(orderDate, 3)}`;
      case 'PAID':             return `Measurements taken/scheduled. Stitching preparation started.`;
      case 'PENDING':          return `Order placed. Awaiting confirmation.`;
      case 'CANCELLED':        return `Order cancelled.`;
      default:                 return `Updated on ${orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
    }
  };


  /* ─── Skeleton loader ──────────────────────────────────── */
  const renderSkeleton = () => (
    <View style={styles.listContent}>
      {[1, 2, 3].map(k => (
        <View key={k} style={[styles.card, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <View style={[styles.skel, { width: 110, height: 13, marginBottom: 6 }]} />
              <View style={[styles.skel, { width: 70, height: 10 }]} />
            </View>
            <View style={[styles.skel, { width: 80, height: 26, borderRadius: 20 }]} />
          </View>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View style={[styles.skel, { width: 68, height: 68, borderRadius: 14 }]} />
            <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
              <View style={[styles.skel, { width: '75%', height: 13 }]} />
              <View style={[styles.skel, { width: '50%', height: 10 }]} />
              <View style={[styles.skel, { width: '35%', height: 15 }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const formatBookingDateUTC = (dateString) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;
    const day = dateObj.getUTCDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[dateObj.getUTCMonth()];
    const year = dateObj.getUTCFullYear();
    return `${day} ${month} ${year}`;
  };

  /* ─── Order card ───────────────────────────────────────── */
  const renderOrderItem = ({ item }) => {
    const cfg = getStatusConfig(item.status);
    const { Icon } = cfg;
    const mainItem = item.orderItems?.[0];
    const extra = (item.orderItems?.length || 0) - 1;
    const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    const shortId = item.invoiceNumber?.split('-').pop() || item.id?.slice(-6);

    return (
      <TouchableOpacity
        style={[styles.card, shadows.premium, { backgroundColor: theme.bg.card }]}
        activeOpacity={0.92}
        onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
      >
        {/* Header row: ID + Status */}
        <View style={styles.cardTopRow}>
          <View>
            <Text style={[styles.orderId, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              Order #{shortId}
            </Text>
            <Text style={[styles.orderDate, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
              {date}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Icon size={12} color={cfg.color} />
            <Text style={[styles.badgeText, { fontFamily: fonts.bold, color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Product row */}
        <View style={styles.productRow}>
          <View style={[styles.imgBox, { backgroundColor: theme.bg.input }]}>
            {mainItem?.product?.images?.[0]
              ? <Image source={{ uri: mainItem.product.images[0] }} style={styles.productImg} />
              : <View style={styles.imgPlaceholder}><Package size={26} color={theme.text.muted} /></View>
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.productName, { fontFamily: fonts.bold, color: theme.text.primary }]} numberOfLines={1}>
              {mainItem?.product?.name || 'Bespoke Item'}
            </Text>
            <Text style={[styles.productSub, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
              {extra > 0 ? `+${extra} more · Custom Fit` : 'Custom Fit Tailoring'}
            </Text>
            <Text style={[styles.productPrice, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
              ₹{Number(item.payableAmount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View style={[styles.arrowBtn, { backgroundColor: theme.bg.input }]}>
            <ChevronRight size={16} color={theme.text.secondary} />
          </View>
        </View>

        {/* Delivery Status Row */}
        <View style={[styles.deliveryStatusRow, { backgroundColor: cfg.bg }]}>
          <View style={[styles.statusIndicator, { backgroundColor: cfg.color }]} />
          <Text style={[styles.deliveryStatusText, { fontFamily: fonts.medium, color: theme.text.primary }]}>
            <Text style={{ fontFamily: fonts.bold, color: cfg.color }}>{cfg.label}</Text> · {getStatusDescription(item)}
          </Text>
        </View>

        {/* Booking Details Row */}
        {item.booking && (
          <View style={[styles.bookingHistoryRow, { borderColor: theme.border }]}>
            <View style={styles.bookingRowHeader}>
              <Clock size={12} color={theme.brand[500]} />
              <Text style={[styles.bookingHistoryTitle, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                FITTING SESSION SCHEDULED
              </Text>
            </View>
            <Text style={[styles.bookingHistoryText, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
              Type: {item.booking.type === 'STUDIO' ? 'Bespoke Studio Visit' : 'Tailor Home Visit'}
            </Text>
            <Text style={[styles.bookingHistoryTime, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              {formatBookingDateUTC(item.booking.date)} | {item.booking.timeSlot}
            </Text>
            <View style={styles.bookingStatusRow}>
              <Text style={[styles.bookingStatusLabel, { fontFamily: fonts.regular, color: theme.text.muted }]}>Booking Status:</Text>
              <Text style={[styles.bookingStatusValue, { fontFamily: fonts.bold, color: item.booking.status === 'CONFIRMED' || item.booking.status === 'COMPLETED' ? '#16a34a' : '#f59e0b' }]}>
                {item.booking.status}
              </Text>
            </View>
          </View>
        )}

        {/* Footer action buttons */}
        <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
          <TouchableOpacity style={styles.footerBtn} onPress={() => handleInvoice(item.invoice?.pdfUrl)} activeOpacity={0.7}>
            <FileText size={15} color={theme.text.primary} />
            <Text style={[styles.footerBtnText, { fontFamily: fonts.semiBold, color: theme.text.primary }]}>Invoice</Text>
          </TouchableOpacity>
          <View style={[styles.footerSep, { backgroundColor: theme.border }]} />
          <TouchableOpacity style={styles.footerBtn} activeOpacity={0.7}>
            <RotateCcw size={15} color={theme.text.primary} />
            <Text style={[styles.footerBtnText, { fontFamily: fonts.semiBold, color: theme.text.primary }]}>Reorder</Text>
          </TouchableOpacity>
          <View style={[styles.footerSep, { backgroundColor: theme.border }]} />
          <TouchableOpacity
            style={styles.footerBtn}
            onPress={() => navigation.navigate('Support', { orderId: item.id })}
            activeOpacity={0.7}
          >
            <Headphones size={15} color={theme.text.primary} />
            <Text style={[styles.footerBtnText, { fontFamily: fonts.semiBold, color: theme.text.primary }]}>Help</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  /* ─── Empty state ──────────────────────────────────────── */
  const EmptyState = () => (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIconCircle, { backgroundColor: theme.brand[50] }]}>
        <ShoppingBag size={42} color={theme.brand[500]} />
      </View>
      <Text style={[styles.emptyTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
        {searchQuery ? 'No Results Found' : 'No Orders Yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
        {searchQuery
          ? 'Try a different keyword or clear the search.'
          : 'Your bespoke orders will appear here once you place them.'}
      </Text>
      <TouchableOpacity
        style={[styles.emptyBtn, { backgroundColor: theme.brand[500] }]}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Browse' })}
        activeOpacity={0.85}
      >
        <Text style={[styles.emptyBtnText, { fontFamily: fonts.bold }]}>EXPLORE COLLECTION</Text>
      </TouchableOpacity>
    </View>
  );

  /* ─── Root ─────────────────────────────────────────────── */
  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.bg.main }]}>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium, { backgroundColor: theme.bg.card }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search bar & Filter */}
      <View style={[styles.searchRow, { paddingHorizontal: 20 }]}>
        <View style={[styles.searchBox, { flex: 1, backgroundColor: theme.bg.input, borderColor: theme.border }]}>
          <Search size={17} color={theme.text.muted} />
          <TextInput
            style={[styles.searchInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
            placeholder="Search orders or products…"
            placeholderTextColor={theme.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={15} color={theme.text.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterIconBtn, { backgroundColor: theme.bg.card, borderColor: theme.border }]}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <Filter size={20} color={theme.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text.primary, fontFamily: fonts.bold }]}>Filter Orders</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}><X size={24} color={theme.text.muted} /></TouchableOpacity>
            </View>
            {TABS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.filterOption, activeTab === t.key && { backgroundColor: theme.brand[50] }]}
                onPress={() => { setActiveTab(t.key); setShowFilterModal(false); }}
              >
                <Text style={[styles.filterOptionText, { fontFamily: activeTab === t.key ? fonts.bold : fonts.medium, color: activeTab === t.key ? theme.brand[500] : theme.text.primary }]}>
                  {t.label}
                </Text>
                {activeTab === t.key && <CheckCircle2 size={18} color={theme.brand[500]} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Body */}
      {loading && orders.length === 0 ? (
        renderSkeleton()
      ) : filteredOrders.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <Text style={[styles.countLabel, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </Text>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header — matches all other pages */
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, letterSpacing: 0.3 },

  /* Search & Filter */
  searchRow: { marginBottom: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, height: 48, gap: 10,
  },
  searchInput: { flex: 1, height: '100%', fontSize: 14 },
  filterIconBtn: {
    width: 48, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Filter Modal */
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18 },
  filterOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, marginBottom: 8 },
  filterOptionText: { fontSize: 15 },

  /* List */
  listContent: { paddingHorizontal: 20, paddingBottom: 50, paddingTop: 2 },
  countLabel: { fontSize: 12, marginBottom: 14 },

  /* Card */
  card: {
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    padding: 18,
  },
  cardTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  orderId: { fontSize: 15, letterSpacing: 0.1 },
  orderDate: { fontSize: 11.5, marginTop: 3 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
  },
  badgeText: { fontSize: 11.5 },

  divider: { height: 1, marginBottom: 14 },

  /* Product */
  productRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, marginBottom: 16,
  },
  deliveryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deliveryStatusText: {
    fontSize: 12,
    flex: 1,
  },
  imgBox: { width: 68, height: 68, borderRadius: 14, overflow: 'hidden' },
  productImg: { width: '100%', height: '100%' },
  imgPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 14.5, marginBottom: 3 },
  productSub: { fontSize: 12, lineHeight: 17 },
  productPrice: { fontSize: 16, marginTop: 5 },
  arrowBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Footer */
  footerRow: {
    flexDirection: 'row',
    borderTopWidth: 1, paddingTop: 14,
    justifyContent: 'space-around',
  },
  footerBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  footerBtnText: { fontSize: 12.5 },
  footerSep: { width: 1, height: 18, alignSelf: 'center' },

  /* Empty */
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 14, paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, textAlign: 'center' },
  emptySubtitle: {
    fontSize: 13.5, textAlign: 'center', lineHeight: 21, marginTop: -4,
  },
  emptyBtn: {
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 16, marginTop: 6,
  },
  emptyBtnText: { color: '#ffffff', fontSize: 13, letterSpacing: 0.8 },

  /* Skeleton */
  skel: { backgroundColor: '#ebebeb', borderRadius: 8 },

  /* Booking Info in History */
  bookingHistoryRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 6,
    gap: 3,
  },
  bookingRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  bookingHistoryTitle: {
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  bookingHistoryText: {
    fontSize: 12.5,
  },
  bookingHistoryTime: {
    fontSize: 13,
  },
  bookingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  bookingStatusLabel: {
    fontSize: 11,
  },
  bookingStatusValue: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
});
