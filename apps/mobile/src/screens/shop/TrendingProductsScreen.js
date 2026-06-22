import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import { Alert } from 'react-native';
import { ArrowLeft, Sparkles, ShoppingBag, ShoppingCart, Heart, SlidersHorizontal } from 'lucide-react-native';
import { CustomCartAddIcon, CustomCartAddedIcon } from '../../components/CartIcons';

const { width } = Dimensions.get('window');

export default function TrendingProductsScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('All'); // 'All', 'Men', 'Women', 'Kids', 'Unisex'
  const [showCategories, setShowCategories] = useState(false);

  const loadTrendingData = async () => {
    try {
      setLoading(true);
      const [prodRes, favRes, cartRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/favorites').catch(() => ({ success: false, data: [] })),
        api.get('/products/cart').catch(() => ({ success: false, data: [] }))
      ]);

      if (prodRes.success) {
        const trendingItems = prodRes.data.filter(p => p.isTrending);
        setProducts(trendingItems);
      }
      if (favRes.success && favRes.data) {
        setFavorites(new Set(favRes.data.map(item => item.productId)));
      }
      if (cartRes.success && cartRes.data) {
        setCartItems(new Set(cartRes.data.map(item => item.productId)));
      }
    } catch (err) {
      console.error('Error loading trending products data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTrendingData();
    });
    return unsubscribe;
  }, [navigation]);

  const toggleFavorite = async (productId) => {
    try {
      const isFav = favorites.has(productId);
      if (isFav) {
        await api.delete(`/products/favorites/${productId}`);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await api.post('/products/favorites', { productId });
        setFavorites(prev => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const inCart = cartItems.has(productId);
      if (!inCart) {
        const res = await api.post('/products/cart', { productId, quantity: 1 });
        if (res.success) {
          setCartItems(prev => {
            const next = new Set(prev);
            next.add(productId);
            return next;
          });
          Alert.alert('Success', 'Added to cart successfully!');
        }
      } else {
        navigation.navigate('Cart');
      }
    } catch (err) {
      const errorMsg = err?.message || 'Unable to add item to cart. Please try again.';
      Alert.alert('Error', errorMsg);
    }
  };

  const renderProductItem = ({ item }) => {
    const isFav = favorites.has(item.id);
    const inCart = cartItems.has(item.id);
    const originalPrice = Number(item.price) * 1.5;

    return (
      <TouchableOpacity 
        style={[styles.prodCard, shadows.premium, { backgroundColor: theme.bg.card }]}
        onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
        activeOpacity={0.9}
      >
        <View style={styles.prodImageWrapper}>
          <Image 
            source={{ uri: (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=300&auto=format&fit=crop' }} 
            style={styles.prodImage}
          />
          
          <TouchableOpacity 
            style={styles.favBtn}
            onPress={() => toggleFavorite(item.id)}
            activeOpacity={0.7}
          >
            <Heart 
              size={14} 
              color={isFav ? '#ef4444' : '#767676'} 
              fill={isFav ? '#ef4444' : 'transparent'} 
            />
          </TouchableOpacity>

          <View style={[styles.newBadge, { backgroundColor: '#ef4444' }]}>
            <Text style={[styles.newBadgeText, { fontFamily: fonts.bold }]}>HOT</Text>
          </View>
        </View>

        <View style={styles.prodInfo}>
          <Text style={[styles.prodName, { fontFamily: fonts.semiBold, color: theme.text.primary }]} numberOfLines={1}>
            {item.name}
          </Text>
          
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={[styles.prodPrice, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                ₹{Number(item.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.originalPriceText}>
                ₹{originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.cartIconBtn,
                inCart
                  ? { backgroundColor: theme.brand[500], borderWidth: 1, borderColor: theme.brand[500] }
                  : { backgroundColor: '#ffffff', borderWidth: 1, borderColor: theme.brand[500] }
              ]} 
              onPress={() => handleAddToCart(item.id)}
              activeOpacity={0.7}
            >
              {inCart ? (
                <CustomCartAddedIcon color="#ffffff" size={18} />
              ) : (
                <CustomCartAddIcon color={theme.brand[500]} size={18} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredProducts = products.filter(product => {
    if (selectedTab === 'All') return true;
    if (selectedTab === 'Men') return product.targetGender === 'MEN';
    if (selectedTab === 'Women') return product.targetGender === 'WOMEN';
    if (selectedTab === 'Kids') return product.targetGender === 'KIDS';
    if (selectedTab === 'Unisex') return product.targetGender === 'UNISEX';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {/* Header */}
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: theme.bg.card, borderColor: theme.border }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Trending Collections
          </Text>
          <Text style={[styles.headerSubtitle, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
            Bespoke customer favorites & best sellers
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.filterSettingsBtn, { backgroundColor: showCategories ? theme.brand[500] : theme.bg.card }, shadows.premium]} 
          activeOpacity={0.7} 
          onPress={() => setShowCategories(v => !v)}
        >
          <SlidersHorizontal size={18} color={showCategories ? '#ffffff' : theme.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Categories Tabs Row */}
      {showCategories && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesTabsRow}>
          {['All', 'Men', 'Women', 'Kids', 'Unisex'].map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.categoryTab,
                  isActive ? { backgroundColor: theme.brand[500] } : { backgroundColor: theme.bg.card },
                  shadows.premium
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedTab(tab)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    { fontFamily: fonts.medium },
                    isActive ? { color: '#ffffff' } : { color: theme.text.primary }
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Product list */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.brand[500]} />
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
            No products found for this category.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridPadding}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  filterSettingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  categoriesTabsRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    maxHeight: 64,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
  },
  categoryTabText: {
    fontSize: 13,
  },
  gridPadding: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  prodCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  prodImageWrapper: {
    position: 'relative',
    height: 160,
    width: '100%',
  },
  prodImage: {
    width: '100%',
    height: '100%',
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    zIndex: 5,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  prodInfo: {
    padding: 10,
    gap: 4,
  },
  prodName: {
    fontSize: 13,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  prodPrice: {
    fontSize: 13,
  },
  originalPriceText: {
    fontSize: 10,
    color: '#9e9e9e',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  cartIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
