import React, { useState, useEffect, useMemo } from 'react';
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
  Dimensions
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import { 
  FileText, 
  Calendar, 
  ShoppingBag, 
  CreditCard, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  XCircle,
  Filter,
  ArrowRight,
  Headphones,
  Search,
  RotateCcw,
  Star,
  HelpCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function OrderHistoryScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, COMPLETED, CANCELLED

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders');
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    // Tab Filter
    if (activeTab === 'ACTIVE') {
      filtered = orders.filter(o => ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED'].includes(o.status));
    } else if (activeTab === 'COMPLETED') {
      filtered = orders.filter(o => o.status === 'DELIVERED');
    } else if (activeTab === 'CANCELLED') {
      filtered = orders.filter(o => o.status === 'CANCELLED');
    }

    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.invoiceNumber.toLowerCase().includes(query) || 
        o.orderItems.some(item => item.product?.name?.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [orders, activeTab, searchQuery]);

  const handleDownloadInvoice = (invoiceUrl) => {
    if (!invoiceUrl) {
      Alert.alert('Generating Invoice', 'Your tax invoice is being prepared. It will be available shortly.');
      return;
    }
    Linking.openURL(invoiceUrl).catch(() => {
      Alert.alert('Error', 'Unable to open invoice PDF link.');
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'DELIVERED': 
        return { color: '#10b981', icon: <CheckCircle2 size={12} color="#10b981" />, label: 'Delivered', step: 4 };
      case 'SHIPPED': 
        return { color: '#3b82f6', icon: <Truck size={12} color="#3b82f6" />, label: 'Out for Delivery', step: 3 };
      case 'PROCESSING': 
        return { color: '#f59e0b', icon: <Package size={12} color="#f59e0b" />, label: 'Processing', step: 2 };
      case 'PAID': 
      case 'PENDING': 
        return { color: '#eab308', icon: <Clock size={12} color="#eab308" />, label: 'Ordered', step: 1 };
      case 'CANCELLED': 
        return { color: '#ef4444', icon: <XCircle size={12} color="#ef4444" />, label: 'Cancelled', step: 0 };
      default: 
        return { color: '#64748b', icon: <Clock size={12} color="#64748b" />, label: status, step: 1 };
    }
  };

  const renderProgressTracker = (currentStep) => {
    if (currentStep === 0) return null; // Cancelled
    const steps = ['Ordered', 'Packed', 'Shipped', 'Delivered'];
    return (
      <View style={styles.trackerContainer}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepWrapper}>
            <View style={styles.nodeContainer}>
              <View style={[
                styles.node, 
                index + 1 <= currentStep ? { backgroundColor: '#006241' } : { backgroundColor: '#e2e8f0' }
              ]}>
                {index + 1 < currentStep ? (
                  <CheckCircle2 size={10} color="#ffffff" />
                ) : (
                  <View style={[styles.innerNode, index + 1 === currentStep && { backgroundColor: '#ffffff' }]} />
                )}
              </View>
              {index < steps.length - 1 && (
                <View style={[
                  styles.connector, 
                  index + 1 < currentStep ? { backgroundColor: '#006241' } : { backgroundColor: '#e2e8f0' }
                ]} />
              )}
            </View>
            <Text style={[
              styles.stepLabel, 
              { fontFamily: fonts.bold },
              index + 1 <= currentStep ? { color: '#006241' } : { color: '#94a3b8' }
            ]}>{step}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderOrderItem = ({ item }) => {
    const config = getStatusConfig(item.status);
    const orderDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const mainItem = item.orderItems?.[0];
    const moreItemsCount = (item.orderItems?.length || 0) - 1;

    return (
      <TouchableOpacity 
        style={[styles.orderCard, shadows.premium]}
        activeOpacity={0.9}
        onPress={() => Alert.alert('Order Details', 'Full order tracking and timeline view is currently being generated.')}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={[styles.orderId, { fontFamily: fonts.bold }]}>ID: #{item.invoiceNumber.split('-').pop()}</Text>
            <Text style={[styles.orderDate, { fontFamily: fonts.medium }]}>{orderDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '10' }]}>
            <Text style={[styles.statusText, { color: config.color, fontFamily: fonts.bold }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.productBrief}>
          <View style={styles.productImageWrapper}>
            {mainItem?.product?.images?.[0] ? (
              <Image source={{ uri: mainItem.product.images[0] }} style={styles.productImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Package size={24} color="#cbd5e1" />
              </View>
            )}
          </View>
          <View style={styles.productMeta}>
            <Text style={[styles.productName, { fontFamily: fonts.bold }]} numberOfLines={1}>
              {mainItem?.product?.name || 'Bespoke Item'}
            </Text>
            <Text style={[styles.productSub, { fontFamily: fonts.medium }]}>
              {moreItemsCount > 0 ? `+ ${moreItemsCount} more items` : `Size: Custom Fit`}
            </Text>
            <Text style={[styles.productPrice, { fontFamily: fonts.extraBold }]}>
              ₹{Number(item.payableAmount).toLocaleString('en-IN')}
            </Text>
          </View>
          <ChevronRight size={20} color="#cbd5e1" />
        </View>

        {renderProgressTracker(config.step)}

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.footerAction}
            onPress={() => handleDownloadInvoice(item.invoice?.pdfUrl)}
          >
            <FileText size={16} color="#006241" />
            <Text style={[styles.footerActionText, { fontFamily: fonts.bold }]}>Invoice</Text>
          </TouchableOpacity>
          <View style={styles.footerDivider} />
          <TouchableOpacity style={styles.footerAction}>
            <RotateCcw size={16} color="#006241" />
            <Text style={[styles.footerActionText, { fontFamily: fonts.bold }]}>Buy Again</Text>
          </TouchableOpacity>
          <View style={styles.footerDivider} />
          <TouchableOpacity 
            style={styles.footerAction}
            onPress={() => navigation.navigate('Support', { orderId: item.id })}
          >
            <HelpCircle size={16} color="#006241" />
            <Text style={[styles.footerActionText, { fontFamily: fonts.bold }]}>Help</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient colors={['#0a1d17', '#006241']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>My Orders</Text>
          <View style={styles.searchContainer}>
            <Search size={18} color="#94a3b8" />
            <TextInput
              style={[styles.searchInput, { fontFamily: fonts.medium }]}
              placeholder="Search by product or order ID..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <XCircle size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.filterTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map(tab => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabBtnText, 
                { fontFamily: fonts.bold },
                activeTab === tab ? { color: '#ffffff' } : { color: '#64748b' }
              ]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#006241" />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapper}>
            <ShoppingBag size={48} color="#cbd5e1" />
          </View>
          <Text style={[styles.emptyTitle, { fontFamily: fonts.bold }]}>
            {searchQuery ? 'No matching orders' : 'No orders found'}
          </Text>
          <Text style={[styles.emptyText, { fontFamily: fonts.medium }]}>
            {searchQuery 
              ? "Try adjusting your search terms or filters." 
              : "Looks like you haven't placed any bespoke orders yet."}
          </Text>
          <TouchableOpacity 
            style={styles.browseBtn}
            onPress={() => navigation.navigate('MainTabs', { screen: 'HomeTab' })}
          >
            <Text style={[styles.browseBtnText, { fontFamily: fonts.bold }]}>CONTINUE SHOPPING</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <Text style={[styles.resultsCount, { fontFamily: fonts.bold }]}>
                {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'} found
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 40) + 10, 
    paddingBottom: 20, 
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: { gap: 16 },
  headerTitle: { fontSize: 24, color: '#ffffff', letterSpacing: -0.5 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 14, color: '#1e293b' },
  filterTabs: { marginTop: 16, marginBottom: 8 },
  tabsScroll: { paddingHorizontal: 24, gap: 10 },
  tabBtn: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 20, 
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  activeTabBtn: { backgroundColor: '#006241', borderColor: '#006241' },
  tabBtnText: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listPadding: { paddingHorizontal: 24, paddingBottom: 40 },
  listHeader: { marginBottom: 16 },
  resultsCount: { fontSize: 13, color: '#64748b' },
  orderCard: { backgroundColor: '#ffffff', borderRadius: 24, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { gap: 2 },
  orderId: { fontSize: 14, color: '#1e293b' },
  orderDate: { fontSize: 12, color: '#94a3b8' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11 },
  productBrief: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  productImageWrapper: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#f8fafc', overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  placeholderImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  productMeta: { flex: 1, gap: 2 },
  productName: { fontSize: 15, color: '#1e293b' },
  productSub: { fontSize: 12, color: '#94a3b8' },
  productPrice: { fontSize: 16, color: '#006241', marginTop: 4 },
  trackerContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 20 },
  stepWrapper: { alignItems: 'center', width: (width - 100) / 4 },
  nodeContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 6 },
  node: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  innerNode: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1' },
  connector: { position: 'absolute', left: '50%', right: -width / 4 + 25, height: 2, top: 8, zIndex: 0 },
  stepLabel: { fontSize: 9, textAlign: 'center' },
  cardFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, justifyContent: 'space-between' },
  footerAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerActionText: { fontSize: 13, color: '#006241' },
  footerDivider: { width: 1, height: 20, backgroundColor: '#f1f5f9' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 60, gap: 12 },
  emptyIconWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, color: '#1e293b' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
  browseBtn: { backgroundColor: '#006241', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, marginTop: 12 },
  browseBtnText: { color: '#ffffff', fontSize: 14, letterSpacing: 1 },
});
