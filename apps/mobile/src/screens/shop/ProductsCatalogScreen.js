import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
  Modal,
  PanResponder
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
import { CustomCartAddIcon, CustomCartAddedIcon } from '../../components/CartIcons';

const { width } = Dimensions.get('window');

export default function ProductsCatalogScreen({ navigation, route }) {
  const { theme, fonts, shadows } = useTheme();
  
  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeFilterTab, setActiveFilterTab] = useState('Product'); // 'Product' or 'Price'
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('50000');
  const [absoluteMin, setAbsoluteMin] = useState(0);
  const [absoluteMax, setAbsoluteMax] = useState(50000);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeThumb, setActiveThumb] = useState('right');
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  // Slider Dragging Logic — use refs so PanResponder closures always read fresh values
  const [sliderWidth, setSliderWidth] = useState(1);
  const minPriceRef = useRef(Number(minPrice) || 0);
  const maxPriceRef = useRef(Number(maxPrice) || 50000);
  const absoluteMinRef = useRef(absoluteMin);
  const absoluteMaxRef = useRef(absoluteMax);
  const sliderWidthRef = useRef(sliderWidth);
  const leftStartX = useRef(0);
  const rightStartX = useRef(0);
  
  useEffect(() => {
    minPriceRef.current = Number(minPrice) || 0;
    maxPriceRef.current = Number(maxPrice) || 0;
  }, [minPrice, maxPrice]);

  useEffect(() => {
    absoluteMinRef.current = absoluteMin;
    absoluteMaxRef.current = absoluteMax;
  }, [absoluteMin, absoluteMax]);

  useEffect(() => {
    sliderWidthRef.current = sliderWidth;
  }, [sliderWidth]);

  const leftThumbPanResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
         setActiveThumb('left');
         leftStartX.current = minPriceRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
         const aMin = absoluteMinRef.current;
         const aMax = absoluteMaxRef.current;
         const sWidth = sliderWidthRef.current;
         const range = aMax - aMin;
         const minGapPrice = Math.max(1, Math.round(range * 0.01)); // 1% gap for smooth sliding
         if (range <= 0 || sWidth <= 0) return;
         const deltaPrice = (gestureState.dx / sWidth) * range;
         let newMin = Math.round(leftStartX.current + deltaPrice);
         if (newMin < aMin) newMin = aMin;
         if (newMin > maxPriceRef.current - minGapPrice) newMin = maxPriceRef.current - minGapPrice;
         setMinPrice(newMin.toString());
      },
    }),
  []);

  const rightThumbPanResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
         setActiveThumb('right');
         rightStartX.current = maxPriceRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
         const aMin = absoluteMinRef.current;
         const aMax = absoluteMaxRef.current;
         const sWidth = sliderWidthRef.current;
         const range = aMax - aMin;
         const minGapPrice = Math.max(1, Math.round(range * 0.01)); // 1% gap for smooth sliding
         if (range <= 0 || sWidth <= 0) return;
         const deltaPrice = (gestureState.dx / sWidth) * range;
         let newMax = Math.round(rightStartX.current + deltaPrice);
         if (newMax > aMax) newMax = aMax;
         if (newMax < minPriceRef.current + minGapPrice) newMax = minPriceRef.current + minGapPrice;
         setMaxPrice(newMax.toString());
      },
    }),
  []);

  // Sync search query or category parameter from HomeScreen if passed
  useEffect(() => {
    if (route?.params?.searchQuery) {
      setSearchQuery(route.params.searchQuery);
    }
    if (route?.params?.categoryId) {
      setSelectedCategory(route.params.categoryId);
    } else if (!route?.params?.categoryId && !route?.params?.searchQuery) {
      setSelectedCategory('All');
    }

    if (route?.params?.subCategoryId) {
      setSelectedSubCategory(route.params.subCategoryId);
    }
  }, [route?.params]);

  const loadData = async (page = 1, append = false) => {
    try {
      if (!append) {
        if (products.length === 0) setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const requests = [
        api.get(`/products?page=${page}&limit=${PAGE_SIZE}`).catch(() => ({ success: false, data: [], pagination: {} })),
      ];

      // Only fetch meta data on first load
      if (!append) {
        requests.push(
          api.get('/categories').catch(() => ({ success: false, data: [] })),
          api.get('/products/favorites').catch(() => ({ success: false, data: [] })),
          api.get('/products/cart').catch(() => ({ success: false, data: [] }))
        );
      }

      const results = await Promise.all(requests);
      const productsRes = results[0];

      if (productsRes.success) {
        const prods = productsRes.data || [];
        const pagination = productsRes.pagination || {};

        if (append) {
          setProducts(prev => [...prev, ...prods]);
        } else {
          setProducts(prods);
        }

        // Check if there are more pages
        const totalPages = pagination.pages || 1;
        setHasMore(page < totalPages);
        setCurrentPage(page);

        // Dynamically calculate the real lowest and highest product budgets on first load
        if (!append && prods.length > 0 && minPrice === '0' && maxPrice === '50000') {
           const prices = prods.map(p => Number(p.price) || 0);
           const lowest = Math.floor(Math.min(...prices));
           const highest = Math.ceil(Math.max(...prices));
           setAbsoluteMin(lowest);
           setAbsoluteMax(highest);
           setMinPrice(lowest.toString());
           setMaxPrice(highest.toString());
        }
      }

      if (!append) {
        const categoriesRes = results[1];
        const favRes = results[2];
        const cartRes = results[3];
        if (categoriesRes?.success) setCategories(categoriesRes.data || []);
        if (favRes?.success && favRes.data) {
          setFavorites(new Set(favRes.data.map(item => item.productId)));
        }
        if (cartRes?.success && cartRes.data) {
          setCartItems(new Set(cartRes.data.map(item => item.productId)));
        }
      }
    } catch (err) {
      console.error('Error loading catalog data:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreProducts = () => {
    if (!loadingMore && hasMore && !loading) {
      loadData(currentPage + 1, true);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setCurrentPage(1);
      setHasMore(true);
      loadData(1, false);
    });
    return unsubscribe;
  }, [navigation]);

  // Recalculate price range when category changes
  useEffect(() => {
    if (products.length === 0) return;
    
    let relevantProducts = products;
    if (selectedCategory !== 'All') {
      relevantProducts = products.filter(p => p.categoryId === selectedCategory);
    }
    
    if (relevantProducts.length > 0) {
      const prices = relevantProducts.map(p => Number(p.price) || 0);
      const lowest = Math.floor(Math.min(...prices));
      const highest = Math.ceil(Math.max(...prices));
      setAbsoluteMin(lowest);
      setAbsoluteMax(highest);
      setMinPrice(lowest.toString());
      setMaxPrice(highest.toString());
    }
  }, [selectedCategory, products]);

  // Fetch Subcategories when Category changes
  useEffect(() => {
    if (selectedCategory !== 'All') {
      const fetchSubCategories = async () => {
        try {
          const res = await api.get(`/categories/${selectedCategory}/subcategories`);
          if (res.success) {
            setSubCategories(res.data || []);
          } else {
            setSubCategories([]);
          }
        } catch (err) {
          setSubCategories([]);
        }
      };
      fetchSubCategories();
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory]);

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

  // Filter products locally for instant category and search filtering
  const getFilteredProducts = () => {
    let result = products;

    // Filter by Category
    if (selectedCategory !== 'All') {
      result = result.filter(product => product.categoryId === selectedCategory);
    }

    // Filter by SubCategory
    if (selectedSubCategory) {
      result = result.filter(product => product.subCategoryId === selectedSubCategory);
    }

    // Filter by Price Range
    if (minPrice !== '' && maxPrice !== '') {
      const min = Number(minPrice) || 0;
      const max = Number(maxPrice) || Infinity;
      result = result.filter(product => {
        const price = Number(product.price);
        return price >= min && price <= max;
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

  // Helper functions for visual slider positions
  const getThumbLeftPercent = () => {
    if (absoluteMax <= absoluteMin) return 0;
    const currentMin = Number(minPrice) || 0;
    const minPercent = ((currentMin - absoluteMin) / (absoluteMax - absoluteMin)) * 100;
    return Math.max(0, Math.min(100, minPercent));
  };

  const getThumbRightPercent = () => {
    if (absoluteMax <= absoluteMin) return 100;
    const currentMax = Number(maxPrice) || 0;
    const maxPercent = ((currentMax - absoluteMin) / (absoluteMax - absoluteMin)) * 100;
    return Math.max(0, Math.min(100, maxPercent));
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
        <TouchableOpacity style={[styles.filterSettingsBtn, { backgroundColor: showFilters ? theme.brand[500] : theme.bg.card }, shadows.premium]} activeOpacity={0.7} onPress={() => setShowFilters(v => !v)}>
          <SlidersHorizontal size={18} color={showFilters ? '#ffffff' : '#1e1e1e'} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.wishlistHeaderBtn, { backgroundColor: theme.bg.card }, shadows.premium]} 
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Wishlist')}
        >
          <Heart size={18} color="#1e1e1e" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <>
            {/* Popular Product Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                Products
              </Text>
              <TouchableOpacity 
                onPress={() => { 
                  setSelectedCategory('All'); 
                  setSelectedSubCategory(null);
                  setMinPrice(absoluteMin.toString()); 
                  setMaxPrice(absoluteMax.toString()); 
                }}
                style={[styles.seeAllBtn, { backgroundColor: theme.brand[50] }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllBtnText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                  Clear Filters
                </Text>
                <X size={12} color={theme.brand[500]} />
              </TouchableOpacity>
            </View>

            {/* Subcategories Horizontal Scroll */}
            {selectedCategory !== 'All' && subCategories.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 10 }}
              >
                <TouchableOpacity
                  style={[
                    styles.subCategoryPill,
                    !selectedSubCategory ? { backgroundColor: theme.brand[500] } : { backgroundColor: theme.bg.card }
                  ]}
                  onPress={() => setSelectedSubCategory(null)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.subCategoryText,
                    { fontFamily: fonts.medium },
                    !selectedSubCategory ? { color: '#ffffff' } : { color: theme.text.primary }
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                {subCategories.map(sub => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[
                      styles.subCategoryPill,
                      selectedSubCategory === sub.id ? { backgroundColor: theme.brand[500] } : { backgroundColor: theme.bg.card }
                    ]}
                    onPress={() => setSelectedSubCategory(sub.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.subCategoryText,
                      { fontFamily: fonts.medium },
                      selectedSubCategory === sub.id ? { color: '#ffffff' } : { color: theme.text.primary }
                    ]}>
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        }
        renderItem={({ item }) => {
            const isFav = favorites.has(item.id);
            const inCart = cartItems.has(item.id);
            const originalPrice = item.originalPrice ? Number(item.originalPrice) : null;

            return (
              <TouchableOpacity
                style={[styles.productCard, shadows.premium, { backgroundColor: theme.bg.card }]}
                onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
                activeOpacity={0.9}
              >
                <View style={styles.productImageWrapper}>
                  <Image
                    source={{ uri: (item.images && item.images[0]) || undefined }}
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
                      <Text style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Starts from</Text>
                      <Text style={[styles.productPrice, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                        ₹{Number(item.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Text>
                      {originalPrice ? (
                        <Text style={styles.originalPriceText}>
                          ₹{originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.cartBtn,
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
        }}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={theme.brand[500]} />
              <Text style={[styles.loadingMoreText, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
                Loading more products...
              </Text>
            </View>
          ) : !hasMore && filteredProducts.length > 0 ? (
            <View style={styles.loadingMoreContainer}>
              <Text style={[styles.loadingMoreText, { fontFamily: fonts.medium, color: theme.text.muted }]}>
                You've seen all products
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <ShoppingBag size={48} color="#9e9e9e" />
              <Text style={[styles.emptyText, { fontFamily: fonts.semiBold, color: theme.text.secondary }]}>
                No products found in this category.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilters(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: theme.bg.main }, shadows.premium]}>
            {/* Custom Tabs Header */}
            <View style={styles.filterTabsHeader}>
              <TouchableOpacity onPress={() => setActiveFilterTab('Product')} style={styles.topFilterTabBtn} activeOpacity={0.7}>
                <Text style={[styles.topFilterTabText, activeFilterTab === 'Product' && styles.topFilterTabTextActive]}>Product Filter</Text>
                {activeFilterTab === 'Product' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveFilterTab('Price')} style={styles.topFilterTabBtn} activeOpacity={0.7}>
                <Text style={[styles.topFilterTabText, activeFilterTab === 'Price' && styles.topFilterTabTextActive]}>Price Filter</Text>
                {activeFilterTab === 'Price' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {activeFilterTab === 'Product' ? (
                <View>
                  <Text style={[styles.filterLabel, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                    Category
                  </Text>
                  <View style={styles.filterTabsGrid}>
                    <TouchableOpacity
                      style={[
                        styles.filterTabPill,
                        selectedCategory === 'All' ? { backgroundColor: theme.brand[500] } : { backgroundColor: theme.bg.card }
                      ]}
                      activeOpacity={0.8}
                      onPress={() => { setSelectedCategory('All'); setSelectedSubCategory(null); }}
                    >
                      <Text
                        style={[
                          styles.filterTabText,
                          { fontFamily: fonts.medium },
                          selectedCategory === 'All' ? { color: '#ffffff' } : { color: theme.text.primary }
                        ]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {categories.map((cat) => {
                      const isActive = selectedCategory === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.filterTabPill,
                            isActive ? { backgroundColor: theme.brand[500] } : { backgroundColor: theme.bg.card }
                          ]}
                          activeOpacity={0.8}
                          onPress={() => { setSelectedCategory(cat.id); setSelectedSubCategory(null); }}
                        >
                          <Text
                            style={[
                              styles.filterTabText,
                              { fontFamily: fonts.medium },
                              isActive ? { color: '#ffffff' } : { color: theme.text.primary }
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  
                  {/* Subcategories in Filter Modal */}
                  {selectedCategory !== 'All' && subCategories.length > 0 && (
                    <View style={{ marginTop: 24 }}>
                      <Text style={[styles.filterLabel, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                        Subcategory
                      </Text>
                      <View style={styles.filterTabsGrid}>
                        <TouchableOpacity
                          style={[
                            styles.filterTabPill,
                            !selectedSubCategory ? { backgroundColor: theme.brand[500] } : { backgroundColor: theme.bg.card }
                          ]}
                          activeOpacity={0.8}
                          onPress={() => setSelectedSubCategory(null)}
                        >
                          <Text
                            style={[
                              styles.filterTabText,
                              { fontFamily: fonts.medium },
                              !selectedSubCategory ? { color: '#ffffff' } : { color: theme.text.primary }
                            ]}
                          >
                            All
                          </Text>
                        </TouchableOpacity>
                        {subCategories.map((sub) => {
                          const isActive = selectedSubCategory === sub.id;
                          return (
                            <TouchableOpacity
                              key={sub.id}
                              style={[
                                styles.filterTabPill,
                                isActive ? { backgroundColor: theme.brand[500] } : { backgroundColor: theme.bg.card }
                              ]}
                              activeOpacity={0.8}
                              onPress={() => setSelectedSubCategory(sub.id)}
                            >
                              <Text
                                style={[
                                  styles.filterTabText,
                                  { fontFamily: fonts.medium },
                                  isActive ? { color: '#ffffff' } : { color: theme.text.primary }
                                ]}
                              >
                                {sub.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.priceFilterContainer}>
                  {/* Interactive Slider */}
                  <View 
                    style={styles.sliderVisualContainer} 
                    onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                  >
                    <View style={styles.sliderTrackLine} />
                    <View style={[styles.sliderActiveLine, { left: `${getThumbLeftPercent()}%`, width: `${Math.max(0, getThumbRightPercent() - getThumbLeftPercent())}%` }]} />
                    
                    <View 
                      style={[styles.sliderThumbContainer, { left: `${getThumbLeftPercent()}%`, zIndex: activeThumb === 'left' ? 20 : 10 }]}
                      {...leftThumbPanResponder.panHandlers}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                      <View style={styles.tooltipBubble}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>◀</Text>
                      </View>
                      <View style={styles.tooltipPointer} />
                      <View style={styles.trackDot} />
                    </View>

                    <View 
                      style={[styles.sliderThumbContainer, { left: `${getThumbRightPercent()}%`, zIndex: activeThumb === 'right' ? 20 : 10 }]}
                      {...rightThumbPanResponder.panHandlers}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                      <View style={styles.tooltipBubble}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>▶</Text>
                      </View>
                      <View style={styles.tooltipPointer} />
                      <View style={styles.trackDot} />
                    </View>
                  </View>

                  {/* From To Boxes */}
                  <View style={styles.priceInputsRow}>
                    <View style={styles.priceInputBox}>
                      <Text style={styles.priceInputLabel}>From :</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.priceCurrencySymbol}>₹</Text>
                        <TextInput
                          style={styles.priceInputValue}
                          value={minPrice}
                          onChangeText={setMinPrice}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <View style={styles.priceInputBox}>
                      <Text style={styles.priceInputLabel}>To :</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.priceCurrencySymbol}>₹</Text>
                        <TextInput
                          style={styles.priceInputValue}
                          value={maxPrice}
                          onChangeText={setMaxPrice}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}
              
              <View style={styles.filterActionsRow}>
                <TouchableOpacity 
                  style={styles.applyFilterBtnBlack} 
                  onPress={() => setShowFilters(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.applyFilterBtnBlackText, { fontFamily: fonts.bold }]}>Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelFilterBtn} 
                  onPress={() => setShowFilters(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelFilterBtnText, { fontFamily: fonts.bold }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
  subCategoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subCategoryText: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  filterTabsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    paddingHorizontal: 20,
  },
  topFilterTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  topFilterTabText: {
    fontSize: 15,
    color: '#a1a1aa', // gray
  },
  topFilterTabTextActive: {
    color: '#000000',
    fontWeight: 'bold',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    width: 40,
    height: 4,
    backgroundColor: '#000000',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  filterLabel: {
    fontSize: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 8,
  },
  filterTabsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  filterTabPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabText: {
    fontSize: 14,
    textAlign: 'center',
  },
  priceFilterContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sliderVisualContainer: {
    height: 90,
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
    marginHorizontal: 20,
  },
  sliderTrackLine: {
    height: 2,
    width: '100%',
    backgroundColor: '#e5e5e5',
    position: 'absolute',
    top: 60,
  },
  sliderActiveLine: {
    height: 4,
    backgroundColor: '#ea580c',
    position: 'absolute',
    top: 59,
  },
  sliderThumbContainer: {
    position: 'absolute',
    width: 48,
    height: 60,
    marginLeft: -24,
    top: 10,
    alignItems: 'center',
  },
  tooltipBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ea580c',
  },
  trackDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ea580c',
    position: 'absolute',
    bottom: 4,
  },
  priceInputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 10,
  },
  priceInputBox: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    padding: 16,
    borderRadius: 16,
  },
  priceInputLabel: {
    color: '#71717a',
    fontSize: 13,
    marginBottom: 6,
  },
  priceCurrencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 4,
  },
  priceInputValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    padding: 0,
    flex: 1,
  },
  filterActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 30,
    gap: 16,
  },
  applyFilterBtnBlack: {
    flex: 2,
    backgroundColor: '#000000',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFilterBtnBlackText: {
    color: '#ffffff',
    fontSize: 16,
  },
  cancelFilterBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFilterBtnText: {
    color: '#000000',
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 12,
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
    width: 32,
    height: 32,
    borderRadius: 10,
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
