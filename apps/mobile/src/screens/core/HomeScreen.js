import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  TextInput,
  ImageBackground,
  Alert
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import {
  Search,
  SlidersHorizontal,
  Bell,
  ShoppingBag,
  ShoppingCart,
  Heart,
  ChevronRight,
  Sparkles
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  
  // Data States
  const [userProfile, setUserProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [selectedTab, setSelectedTab] = useState('All'); // 'All', 'Men', 'Women', 'Girls'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      if (products.length === 0) {
        setLoading(true);
      }
      const [profileRes, productsRes, categoriesRes, favRes, cartRes, bannersRes] = await Promise.all([
        api.get('/auth/profile').catch(() => ({ success: false })),
        api.get('/products?page=1&limit=20').catch(() => ({ success: false, data: [] })),
        api.get('/categories').catch(() => ({ success: false, data: [] })),
        api.get('/products/favorites').catch(() => ({ success: false, data: [] })),
        api.get('/products/cart').catch(() => ({ success: false, data: [] })),
        api.get('/banners').catch(() => ({ success: false, data: [] }))
      ]);

      if (profileRes.success) setUserProfile(profileRes.data);
      if (productsRes.success) setProducts(productsRes.data || []);
      if (categoriesRes.success) setCategories(categoriesRes.data || []);
      if (favRes.success && favRes.data) {
        setFavorites(new Set(favRes.data.map(item => item.productId)));
      }
      if (cartRes.success && cartRes.data) {
        setCartItems(new Set(cartRes.data.map(item => item.productId)));
      }
      if (bannersRes.success) {
        setBanners(bannersRes.data || []);
      }
    } catch (err) {
      console.error('Error loading home data:', err);
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

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Browse', { searchQuery: searchQuery.trim() });
    }
  };

  // Get user's first name
  const getFirstName = () => {
    if (!userProfile?.fullName) return 'Guest';
    return userProfile.fullName.trim().split(/\s+/)[0];
  };

  // Filter products based on categories mapping
  const getFilteredProducts = () => {
    if (selectedTab === 'All') return products;

    return products.filter(product => {
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
  };

  if (loading && products.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
        {/* Header Skeleton */}
        <View style={styles.headerRow}>
          <View style={styles.profileContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.border }]} />
            <View style={styles.greetingContainer}>
              <View style={[styles.skeletonLine, { width: 60, height: 10, backgroundColor: theme.border, marginBottom: 6 }]} />
              <View style={[styles.skeletonLine, { width: 100, height: 14, backgroundColor: theme.border }]} />
            </View>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.actionBtn, { backgroundColor: theme.border }]} />
            <View style={[styles.actionBtn, { backgroundColor: theme.border }]} />
          </View>
        </View>

        <View style={styles.scrollContent}>
          {/* Search Bar Skeleton */}
          <View style={styles.searchRow}>
            <View style={[styles.searchBarContainer, { backgroundColor: theme.border }]} />
            <View style={[styles.filterSettingsBtn, { backgroundColor: theme.border }]} />
          </View>

          {/* Banner Skeleton */}
          <View style={[styles.bannerCard, { backgroundColor: theme.border, height: 150 }]} />

          {/* Products Header Skeleton */}
          <View style={styles.sectionHeader}>
            <View style={[styles.skeletonLine, { width: 120, height: 16, backgroundColor: theme.border }]} />
            <View style={[styles.skeletonLine, { width: 60, height: 16, backgroundColor: theme.border }]} />
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
      
      {/* Sticky Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.profileContainer}>
          <View style={[styles.avatar, shadows.premium]}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' }} 
              style={styles.avatarImage} 
            />
          </View>
          <View style={styles.greetingContainer}>
            <Text style={[styles.helloText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
              Hello {getFirstName()}
            </Text>
            <Text style={[styles.welcomeText, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              Good Morning!
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.actionBtn, shadows.premium]} activeOpacity={0.7} onPress={() => navigation.navigate('NotificationHistory')}>
            <Bell size={20} color="#1e1e1e" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, shadows.premium]} activeOpacity={0.7} onPress={() => navigation.navigate('Wishlist')}>
            <Heart size={20} color="#1e1e1e" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Search Input and Filter Row */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBarContainer, { backgroundColor: theme.bg.card }, shadows.premium]}>
            <Search size={18} color="#9e9e9e" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
              placeholder="Search.."
              placeholderTextColor="#9e9e9e"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={[styles.filterSettingsBtn, { backgroundColor: theme.bg.card }, shadows.premium]} activeOpacity={0.7} onPress={() => navigation.navigate('Browse')}>
            <SlidersHorizontal size={18} color="#1e1e1e" />
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Categories
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
            <Text style={[styles.seeAllText, { fontFamily: fonts.medium, color: theme.text.muted }]}>
              See All
            </Text>
          </TouchableOpacity>
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

        {/* Main Promotional Banners Slider */}
        {banners.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.bannerSlider}
            contentContainerStyle={styles.bannerSliderContent}
          >
            {banners.map((banner) => (
              <TouchableOpacity 
                key={banner.id}
                style={[styles.bannerCard, { backgroundColor: theme.brand[500], width: width - 40 }]}
                activeOpacity={0.9}
                onPress={() => {
                  if (banner.targetUrl && banner.targetUrl.includes('categories/')) {
                    const slug = banner.targetUrl.split('/').pop();
                    const cat = categories.find(c => c.slug === slug);
                    if (cat) {
                      navigation.navigate('Browse', { categoryId: cat.id });
                    } else {
                      navigation.navigate('Browse');
                    }
                  } else {
                    navigation.navigate('Browse');
                  }
                }}
              >
                <View style={styles.bannerLeft}>
                  <Text style={[styles.bannerTitleText, { fontFamily: fonts.bold }]} numberOfLines={3}>
                    {banner.title}
                  </Text>
                  <TouchableOpacity 
                    style={styles.bannerBtn} 
                    onPress={() => navigation.navigate('Browse')}
                  >
                    <Text style={[styles.bannerBtnText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                      Shop Now
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.bannerRight}>
                  <Image 
                    source={{ uri: banner.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80' }} 
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <TouchableOpacity 
            style={[styles.bannerCard, { backgroundColor: theme.brand[500] }]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Browse')}
          >
            <View style={styles.bannerLeft}>
              <Text style={[styles.bannerTitleText, { fontFamily: fonts.bold }]}>
                Get Your{'\n'}Special Sale{'\n'}Up to 40%
              </Text>
              <TouchableOpacity style={styles.bannerBtn} onPress={() => navigation.navigate('Browse')}>
                <Text style={[styles.bannerBtnText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                  Shop Now
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bannerRight}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80' }} 
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Popular Product Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Popular Product
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Browse')}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eaeaea',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  helloText: {
    fontSize: 12,
  },
  welcomeText: {
    fontSize: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 14,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
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
  bannerCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    height: 150,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 20,
  },
  bannerLeft: {
    flex: 1.2,
    justifyContent: 'center',
    paddingLeft: 24,
    gap: 12,
  },
  bannerTitleText: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 22,
  },
  bannerBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    fontSize: 11,
  },
  bannerRight: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 100,
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
  bannerSlider: {
    height: 150,
    marginBottom: 20,
  },
  bannerSliderContent: {
    paddingHorizontal: 0,
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
});
