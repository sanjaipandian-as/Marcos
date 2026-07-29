import React, { useState, useEffect, useRef, useMemo } from 'react';
import WishlistIcon from '../../components/common/WishlistIcon';
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
  PanResponder,
  Animated
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
  ChevronDown,
  X,
  CheckSquare,
  Square
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
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [showCategoryHierarchyModal, setShowCategoryHierarchyModal] = useState(false);
  const [activePopupSubCategory, setActivePopupSubCategory] = useState(null);

  const toggleExpand = (catId) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Get all descendant category IDs (including the node itself) for filtering
  const getAllDescendantIds = (node) => {
    const ids = [node.id];
    if (node.subCategories && node.subCategories.length > 0) {
      node.subCategories.forEach(child => {
        ids.push(...getAllDescendantIds(child));
      });
    }
    return ids;
  };

  // Recursive renderer for category tree nodes
  const renderCategoryNode = (node, depth = 0, rootId = null) => {
    const effectiveRoot = rootId || node.id;
    const isChecked = selectedCategory === node.id;
    const hasSub = node.subCategories && node.subCategories.length > 0;
    const isExpanded = expandedCategories.has(node.id);
    const indentLeft = depth * 16;

    return (
      <View key={node.id}>
        <View style={[styles.checkboxRow, { paddingLeft: indentLeft }]}>
          <TouchableOpacity
            style={styles.expandIconBox}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => { if (hasSub) toggleExpand(node.id); }}
          >
            {hasSub ? (
              isExpanded ? <ChevronDown size={15} color="#a1a1aa" /> : <ChevronRight size={15} color="#a1a1aa" />
            ) : (
              <View style={{ width: 15 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkboxRowContent}
            activeOpacity={0.65}
            onPress={() => {
              if (isChecked) {
                // Deselect — go back to All
                setSelectedCategory('All');
                setSelectedSubCategory(null);
              } else {
                // Select this node directly (works at any depth)
                setSelectedCategory(node.id);
                setSelectedSubCategory(null);
                if (hasSub) setExpandedCategories(prev => new Set(prev).add(node.id));
              }
            }}
          >
            <View style={[
              styles.customCheckbox,
              depth > 0 && styles.customCheckboxSmall,
              isChecked && styles.customCheckboxActive
            ]}>
              {isChecked && <View style={depth === 0 ? styles.customCheckboxInner : styles.customCheckboxInnerSmall} />}
            </View>
            <Text style={[
              depth === 0 ? styles.checkboxLabel : styles.subCheckboxLabel,
              {
                fontFamily: isChecked ? fonts.semiBold : fonts.regular,
                color: isChecked ? '#18181b' : (depth === 0 ? '#52525b' : '#71717a')
              }
            ]}>
              {node.name}
            </Text>
          </TouchableOpacity>
        </View>

        {isExpanded && hasSub && (
          <View style={{ paddingLeft: indentLeft + 8 }}>
            {node.subCategories.map(child => renderCategoryNode(child, depth + 1, effectiveRoot))}
          </View>
        )}
      </View>
    );
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  // Slider Dragging Logic — use refs so PanResponder closures always read fresh values
  const [sliderWidth, setSliderWidth] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;
  const hierarchySlideAnim = useRef(new Animated.Value(width)).current;

  const openFilters = () => {
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 14
    }).start();
  };

  const closeFilters = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const openHierarchyDrawer = () => {
    setShowCategoryHierarchyModal(true);
    hierarchySlideAnim.setValue(width);
    Animated.spring(hierarchySlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 14
    }).start();
  };

  const closeHierarchyDrawer = () => {
    Animated.timing(hierarchySlideAnim, {
      toValue: width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowCategoryHierarchyModal(false));
  };

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
      if (route.params.categoryId !== 'All') {
        setShowCategoryHierarchyModal(true);
      }
    } else if (!route?.params?.categoryId && !route?.params?.searchQuery) {
      setSelectedCategory('All');
    }

    if (route?.params?.subCategoryId) {
      setSelectedSubCategory(route.params.subCategoryId);
    }
  }, [route?.params]);

  // Set the default Level 2 subcategory and auto-expand all dropdowns when category changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All' && categories.length > 0) {
      const activeCat = categories.find(c => c.id === selectedCategory);
      if (activeCat && activeCat.subCategories && activeCat.subCategories.length > 0) {
        setActivePopupSubCategory(activeCat.subCategories[0].id);
        
        // Populate set with all category + subcategory IDs to expand them by default
        const idsToExpand = [activeCat.id];
        activeCat.subCategories.forEach(sub => {
          idsToExpand.push(sub.id);
          if (sub.subCategories) {
            sub.subCategories.forEach(child => idsToExpand.push(child.id));
          }
        });
        setExpandedCategories(new Set(idsToExpand));
      } else {
        setActivePopupSubCategory(null);
      }
    }
  }, [selectedCategory, categories]);

  // Reload products from server when category filter changes
  useEffect(() => {
    if (categories.length > 0) {
      setCurrentPage(1);
      setHasMore(true);
      loadData(1, false);
    }
  }, [selectedCategory]);

  const loadData = async (page = 1, append = false) => {
    try {
      if (!append) {
        if (products.length === 0) setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const productsUrl = selectedCategory !== 'All'
        ? `/products?page=${page}&limit=${PAGE_SIZE}&categoryId=${selectedCategory}`
        : `/products?page=${page}&limit=${PAGE_SIZE}`;

      const requests = [
        api.get(productsUrl).catch(() => ({ success: false, data: [], pagination: {} })),
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

  // Load Subcategories when Category changes
  useEffect(() => {
    if (selectedCategory !== 'All' && categories.length > 0) {
      const category = categories.find(c => c.id === selectedCategory);
      setSubCategories(category?.subCategories || []);
    } else {
      setSubCategories([]);
    }
  }, [selectedCategory, categories]);

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

    // Filter by selected category — collect all descendant IDs so sub/sub-sub products show too
    if (selectedCategory !== 'All') {
      const findNode = (nodes, id) => {
        for (const n of nodes) {
          if (n.id === id) return n;
          if (n.subCategories) {
            const found = findNode(n.subCategories, id);
            if (found) return found;
          }
        }
        return null;
      };
      const selectedNode = findNode(categories, selectedCategory);
      
      // Determine valid category IDs (selected category itself + all its descendants)
      const validIds = selectedNode ? getAllDescendantIds(selectedNode) : [selectedCategory];
      const filtered = result.filter(product => validIds.includes(product.categoryId));
      
      if (filtered.length > 0) {
        result = filtered;
      }
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

  const renderPopupCategoryNode = (node, depth = 0) => {
    const isChecked = selectedCategory === node.id;
    const hasSub = node.subCategories && node.subCategories.length > 0;
    const isExpanded = expandedCategories.has(node.id);
    const indentLeft = depth * 16;

    return (
      <View key={node.id}>
        <View style={[styles.popupTreeRow, { paddingLeft: indentLeft }]}>
          <TouchableOpacity
            style={styles.popupTreeExpandIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => { if (hasSub) toggleExpand(node.id); }}
          >
            {hasSub ? (
              isExpanded ? <ChevronDown size={16} color="#71717a" /> : <ChevronRight size={16} color="#71717a" />
            ) : (
              <View style={{ width: 16 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.popupTreeRowContent}
            activeOpacity={0.7}
            onPress={() => {
              setSelectedCategory(node.id);
              setSelectedSubCategory(null);
              setShowCategoryHierarchyModal(false);
            }}
          >
            <View style={[
              styles.popupTreeCheckbox,
              isChecked && { backgroundColor: theme.brand[500], borderColor: theme.brand[500] }
            ]}>
              {isChecked && <View style={styles.popupTreeCheckboxInner} />}
            </View>
            <Text style={[
              styles.popupTreeLabel,
              {
                fontFamily: isChecked ? fonts.semiBold : fonts.regular,
                color: isChecked ? theme.brand[500] : theme.text.primary,
                fontSize: depth === 0 ? 15 : 13
              }
            ]}>
              {node.name}
            </Text>
          </TouchableOpacity>
        </View>

        {isExpanded && hasSub && (
          <View style={{ paddingLeft: 8 }}>
            {node.subCategories.map(child => renderPopupCategoryNode(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  const renderCategoryHierarchyModal = () => {
    if (selectedCategory === 'All') return null;

    const parentCat = categories.find(c => c.id === selectedCategory);
    if (!parentCat) return null;

    return (
      <Modal
        visible={showCategoryHierarchyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryHierarchyModal(false)}
      >
        <TouchableOpacity 
          style={styles.popupModalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCategoryHierarchyModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={[styles.popupModalContainer, { backgroundColor: theme.bg.card }, shadows.premium]}
          >
            {/* Header */}
            <View style={styles.popupModalHeader}>
              <View>
                <Text style={[styles.popupModalTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                  {parentCat.name}
                </Text>
                <Text style={[styles.popupModalSubtitle, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
                  Choose subcategory dropdowns
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowCategoryHierarchyModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={theme.text.muted} />
              </TouchableOpacity>
            </View>

            {/* Tree Accordion Dropdown List */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.popupModalScroll}>
              <View style={{ paddingBottom: 16 }}>
                {renderPopupCategoryNode(parentCat, 0)}
              </View>
            </ScrollView>

            {/* View All / Reset Footer */}
            <View style={[styles.popupModalFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.popupModalBtn, { backgroundColor: theme.brand[500] }]}
                onPress={() => {
                  setSelectedCategory(parentCat.id);
                  setSelectedSubCategory(null);
                  setShowCategoryHierarchyModal(false);
                }}
              >
                <Text style={[styles.popupModalBtnText, { fontFamily: fonts.bold }]}>
                  Show All {parentCat.name}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

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
        <TouchableOpacity 
          style={[styles.filterSettingsBtn, { backgroundColor: theme.bg.card }, shadows.premium]} 
          activeOpacity={0.7} 
          onPress={openFilters}
        >
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
            </View>
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
                </View>
                
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { fontFamily: fonts.semiBold, color: theme.text.primary }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <View style={styles.priceContainer}>
                      <Text style={{ fontSize: 10, color: '#7A6B7A', marginBottom: 2 }}>Starts from</Text>
                      <Text style={[styles.productPrice, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                        ₹{Number(item.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Text>
                      {originalPrice ? (
                        <Text style={[styles.originalPriceText, { color: '#B8A8B8' }]}>
                          ₹{originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={styles.wishlistBtnBottom}
                      onPress={() => toggleFavorite(item.id)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <WishlistIcon
                        size={22}
                        color={isFav ? '#ef4444' : '#94a3b8'}
                        fill={isFav ? '#ef4444' : 'transparent'}
                      />
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
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeFilters}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeFilters}>
          <Animated.View style={[styles.sideDrawer, { backgroundColor: theme.bg.main, transform: [{ translateX: slideAnim }] }, shadows.premium]}>
            <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
            <View style={styles.filterDrawerHeader}>
              <Text style={[styles.filterDrawerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>Filter by category</Text>
              <TouchableOpacity onPress={closeFilters} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={theme.text.muted} />
              </TouchableOpacity>
            </View>
            <View style={styles.filterDrawerSubheader}>
               <Text style={[styles.filterDrawerSubText, { color: theme.text.secondary }]}>
                 {selectedCategory === 'All' && !selectedSubCategory ? 'No filters selected' : '1 filter selected'}
               </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={styles.categoryCheckboxList}>
                {categories.map(cat => renderCategoryNode(cat, 0))}
              </View>
            </ScrollView>
            
            <View style={styles.filterActionsRowFixed}>
              <TouchableOpacity 
                style={styles.cancelFilterBtnLight} 
                onPress={() => { setSelectedCategory('All'); setSelectedSubCategory(null); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelFilterBtnTextLight, { fontFamily: fonts.bold }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyFilterBtnBlack} 
                onPress={closeFilters}
                activeOpacity={0.8}
              >
                <Text style={[styles.applyFilterBtnBlackText, { fontFamily: fonts.bold }]}>Apply filters</Text>
              </TouchableOpacity>
            </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {renderCategoryHierarchyModal()}

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
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sideDrawer: {
    width: width * 0.85,
    height: '100%',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    flexDirection: 'column',
  },
  filterDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 8,
  },
  filterDrawerTitle: {
    fontSize: 18,
  },
  filterDrawerSubheader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  filterDrawerSubText: {
    fontSize: 13,
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
    backgroundColor: '#d8bfd8',
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
    backgroundColor: '#d8bfd8',
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
    borderTopColor: '#d8bfd8',
  },
  trackDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d8bfd8',
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
  filterActionsRowFixed: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  categoryCheckboxList: {
    paddingHorizontal: 20,
  },
  checkboxItemWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  expandIconBox: {
    width: 28,
    alignItems: 'center',
    marginRight: 2,
  },
  checkboxRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d4d4d8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCheckboxActive: {
    borderColor: '#18181b',
    backgroundColor: '#18181b',
  },
  customCheckboxSmall: {
    width: 18,
    height: 18,
    borderRadius: 3,
  },
  customCheckboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  customCheckboxInnerSmall: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },
  checkboxLabel: {
    fontSize: 15,
  },
  subCategoryCheckboxList: {
    paddingLeft: 42,
    paddingBottom: 8,
  },
  subCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  subCheckboxLabel: {
    fontSize: 14,
  },
  applyFilterBtnBlack: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFilterBtnBlackText: {
    color: '#ffffff',
    fontSize: 14,
  },
  cancelFilterBtnLight: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFilterBtnTextLight: {
    color: '#18181b',
    fontSize: 14,
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
  wishlistBtnBottom: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
    color: '#B8A8B8',
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
  popupModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  popupModalContainer: {
    width: '100%',
    height: '65%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  popupModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupModalTitle: {
    fontSize: 20,
  },
  popupModalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  popupModalScroll: {
    marginVertical: 10,
  },
  popupModalFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 10,
  },
  popupModalBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  popupModalBtnText: {
    color: '#3D2E3D',
    fontSize: 14,
  },
  popupTreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  popupTreeExpandIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  popupTreeRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popupTreeCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#a1a1aa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  popupTreeCheckboxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#3D2E3D',
  },
  popupTreeLabel: {
    fontSize: 14,
  },
});
