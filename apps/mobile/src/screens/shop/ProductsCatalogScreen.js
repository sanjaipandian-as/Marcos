import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  ShoppingCart,
  Heart,
  ChevronRight,
  X
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProductsCatalogScreen({ navigation, route }) {
  const { theme, fonts, shadows } = useTheme();
  
  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState(new Set());
  const [selectedTab, setSelectedTab] = useState('All'); // 'All', 'Men', 'Women', 'Girls'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Sync search query parameter from HomeScreen if passed
  useEffect(() => {
    if (route?.params?.searchQuery) {
      setSearchQuery(route.params.searchQuery);
    }
  }, [route?.params]);

  const loadData = async () => {
    try {
      if (products.length === 0) {
        setLoading(true);
      }
      const [productsRes, categoriesRes, favRes, cartRes] = await Promise.all([
        api.get('/products?page=1&limit=50').catch(() => ({ success: false, data: [] })),
        api.get('/categories').catch(() => ({ success: false, data: [] })),
        api.get('/products/favorites').catch(() => ({ success: false, data: [] })),
        api.get('/products/cart').catch(() => ({ success: false, data: [] }))
      ]);

      if (productsRes.success) setProducts(productsRes.data || []);
      if (categoriesRes.success) setCategories(categoriesRes.data || []);
      if (favRes.success && favRes.data) {
        setFavorites(new Set(favRes.data.map(item => item.productId)));
      }
      if (cartRes.success && cartRes.data) {
        setCartItems(new Set(cartRes.data.map(item => item.productId)));
      }
    } catch (err) {
      console.error('Error loading catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, products]);

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
      console.error('Error adding to cart:', err);
    }
  };

  // Filter products locally for instant category and search filtering
  const getFilteredProducts = () => {
    let result = products;

    // Filter by Category Tab
    if (selectedTab !== 'All') {
      result = result.filter(product => {
        const category = categories.find(c => c.id === product.categoryId);
        if (!category) return false;

        const slug = category.slug;
        if (selectedTab === 'Men') {
          return slug === 'sherwanis' || slug === 'blazers-suits';
        }
        if (selectedTab === 'Women') {
          return slug === 'bridal-lehengas' || slug === 'anarkali-sets';
        }
        if (selectedTab === 'Girls') {
          return slug === 'anarkali-sets';
        }
        return true;
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }

    return result;
  };

  if (loading && products.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
        {/* Header Search Bar Skeleton */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBarContainer, { backgroundColor: theme.border }]} />
          <View style={[styles.filterSettingsBtn, { backgroundColor: theme.border }]} />
          <View style={[styles.wishlistHeaderBtn, { backgroundColor: theme.border }]} />
        </View>
        
        <View style={styles.scrollContent}>
          {/* Categories Title Skeleton */}
          <View style={[styles.sectionHeader, { marginTop: 20 }]}>
            <View style={[styles.skeletonLine, { width: 120, height: 16, backgroundColor: theme.border }]} />
          </View>
          
          {/* Categories Horizontal Tabs Skeletons */}
          <View style={{ flexDirection: 'row', gap: 10, paddingLeft: 20, marginBottom: 20 }}>
            {[1, 2, 3].map((idx) => (
              <View key={idx} style={[styles.categoryTab, { backgroundColor: theme.border, width: 80, height: 38 }]} />
            ))}
          </View>

          {/* Grid Skeletons */}
          <View style={styles.gridContainer}>
            {[1, 2, 3, 4].map((idx) => (
              <View key={idx} style={[styles.productCard, { backgroundColor: theme.bg.card, height: 220, opacity: 0.6 }]}>
                <View style={[styles.productImageWrapper, { backgroundColor: theme.border }]} />
                <View style={{ padding: 10, gap: 8 }}>
                  <View style={[styles.skeletonLine, { width: '80%', height: 12, backgroundColor: theme.border }]} />
                  <View style={[styles.skeletonLine, { width: '50%', height: 12, backgroundColor: theme.border }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      
      {/* Header Search Bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBarContainer, { backgroundColor: theme.bg.card }, shadows.premium]}>
          <Search size={18} color="#9e9e9e" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
            placeholder="Search.."
            placeholderTextColor="#9e9e9e"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#9e9e9e" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.filterSettingsBtn, { backgroundColor: theme.bg.card }, shadows.premium]} activeOpacity={0.7}>
          <SlidersHorizontal size={18} color="#1e1e1e" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.wishlistHeaderBtn, { backgroundColor: theme.bg.card }, shadows.premium]} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Wishlist')}
        >
          <Heart size={18} color="#1e1e1e" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Categories
          </Text>
          <Text style={[styles.seeAllText, { fontFamily: fonts.medium, color: theme.text.muted }]}>
            See All
          </Text>
        </View>

        {/* Categories Tabs Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesTabsRow}>
          {['All', 'Men', 'Women', 'Girls'].map((tab) => {
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

        {/* Popular Product Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Popular Product
          </Text>
          <TouchableOpacity 
            onPress={() => setSelectedTab('All')}
            style={[styles.seeAllBtn, { backgroundColor: theme.brand[50] }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeAllBtnText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
              See All
            </Text>
            <ChevronRight size={12} color={theme.brand[500]} />
          </TouchableOpacity>
        </View>

        {/* Two-Column Products Grid */}
        <View style={styles.gridContainer}>
          {filteredProducts.map((item) => {
            const isFav = favorites.has(item.id);
            const inCart = cartItems.has(item.id);
            const originalPrice = Number(item.price) * 1.5;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.productCard, shadows.premium, { backgroundColor: theme.bg.card }]}
                onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
                activeOpacity={0.9}
              >
                <View style={styles.productImageWrapper}>
                  <Image
                    source={{ uri: (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&q=80' }}
                    style={styles.productImage}
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
                </View>
                
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { fontFamily: fonts.semiBold, color: theme.text.primary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.productPrice, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                        ₹{Number(item.price).toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.originalPriceText}>
                        ₹{originalPrice.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.cartBtn, { backgroundColor: theme.brand[500] }]}
                      onPress={() => handleAddToCart(item.id)}
                      activeOpacity={0.7}
                    >
                      {inCart ? (
                        <ShoppingCart size={14} color="#ffffff" />
                      ) : (
                        <ShoppingBag size={14} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredProducts.length === 0 && (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={48} color="#9e9e9e" />
            <Text style={[styles.emptyText, { fontFamily: fonts.semiBold, color: theme.text.secondary }]}>
              No products found in this category.
            </Text>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonLine: {
    borderRadius: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
    gap: 12,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  filterSettingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  seeAllText: {
    fontSize: 12,
  },
  categoriesTabsRow: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 10,
    marginBottom: 20,
  },
  categoryTab: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  categoryTabText: {
    fontSize: 13,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  productCard: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '48%',
    marginBottom: 16,
  },
  productImageWrapper: {
    position: 'relative',
    height: 160,
    width: '100%',
    backgroundColor: '#eaeaea',
  },
  productImage: {
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
  productInfo: {
    padding: 10,
    gap: 4,
  },
  productName: {
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
  productPrice: {
    fontSize: 13,
  },
  originalPriceText: {
    fontSize: 10,
    color: '#9e9e9e',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  cartBtn: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  midBanner: {
    width: width - 40,
    height: 75,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 12,
    alignSelf: 'center',
  },
  midBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  midBannerPercent: {
    fontSize: 28,
    color: '#ffffff',
  },
  midBannerText: {
    fontSize: 12,
    color: '#ffffff',
    lineHeight: 15,
  },
  midBannerArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  seeAllBtnText: {
    fontSize: 11,
  },
  wishlistHeaderBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
