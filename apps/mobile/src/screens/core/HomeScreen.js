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
  Alert,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SvgXml } from 'react-native-svg';
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
import { CustomCartAddIcon, CustomCartAddedIcon } from '../../components/CartIcons';

const { width } = Dimensions.get('window');

const SUCCESS_SVG_XML = `<?xml version="1.0" encoding="utf-8"?><svg fill="none" viewBox="0 0 796 714" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="cp-3459-3837"><rect height="3837" width="3459" y="0" x="0" /></clipPath><g id="comp_745"><g transform="matrix(1,0,0,1,1729.5,1918.5)" opacity="0.5" id="stroke1"><animate repeatCount="indefinite" begin="0s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g id="Shape 1" transform="matrix(1,0,0,1,0,0)"><path stroke-linejoin="miter" stroke-linecap="round" stroke-width="92" stroke-opacity="1" stroke="#8bffac" fill="#ffffff" fill-opacity="1" d="M-1401.5,-1457.5L-1027.49,-1672.499" /></g></g><g transform="matrix(1,0,0,1,1818.5,2059.5)" opacity="0.5" visibility="hidden" id="stroke2"><animate repeatCount="indefinite" begin="0.16s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g id="Shape 1" transform="matrix(1,0,0,1,0,0)"><path stroke-linejoin="miter" stroke-linecap="round" stroke-width="92" stroke-opacity="1" stroke="#8bffac" fill="#ffffff" fill-opacity="1" d="M-1401.5,-1457.5L-1027.49,-1672.499" /></g></g><g transform="matrix(1,0,0,1,2288.5,1790.5)" opacity="0.5" visibility="hidden" id="stroke4"><animate repeatCount="indefinite" begin="0.26s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g id="Shape 1" transform="matrix(1,0,0,1,0,0)"><path stroke-linejoin="miter" stroke-linecap="round" stroke-width="92" stroke-opacity="1" stroke="#8bffac" fill="#ffffff" fill-opacity="1" d="M-1401.5,-1457.5L-1372.351,-1474.477" /></g></g><g transform="matrix(1,0,0,1,1950.5,2175.5)" opacity="0.5" visibility="hidden" id="stroke3"><animate repeatCount="indefinite" begin="0.36s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g id="Shape 1" transform="matrix(1,0,0,1,0,0)"><path stroke-linejoin="miter" stroke-linecap="round" stroke-width="92" stroke-opacity="1" stroke="#8bffac" fill="#ffffff" fill-opacity="1" d="M-1401.5,-1457.5L-1117.454,-1623.493" /></g></g><g visibility="hidden" id="Bolas1"><animate repeatCount="indefinite" begin="0.44s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g transform="translate(621.5,478.5)"><g transform="rotate(-11)"><animateTransform repeatCount="indefinite" type="rotate" attributeName="transform" dur="1.56s" begin="0.44s" calcMode="spline" values="-11; 0; 6" keyTimes="0; 0.308; 1" keySplines="0.333 0 0.833 0.921; 0.167 0.327 0.15 1" fill="freeze" /><g transform="scale(0,0)"><animateTransform repeatCount="indefinite" type="scale" attributeName="transform" dur="0.48s" begin="0.44s" calcMode="spline" values="0 0; 1 1" keyTimes="0; 1" keySplines="0.333 0 0.101 1" fill="freeze" /><g transform="translate(1108,1440)"><g id="Ellipse 3" transform="matrix(0.857,0,0,0.857,-819.535,-1371.645)"><ellipse ry="9.6775" rx="9.6775" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="5" stroke-opacity="1" stroke="#8bffac" /></g><g id="Ellipse 1" transform="matrix(1.409,0,0,1.409,-1282.949,-1147.881)"><ellipse ry="9.6775" rx="9.6775" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="5" stroke-opacity="1" stroke="#8bffac" /></g><g id="Ellipse 2" transform="matrix(1.409,0,0,1.409,-1151.238,-1723.625)"><ellipse ry="9.6775" rx="9.6775" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="5" stroke-opacity="1" stroke="#8bffac" /></g></g></g></g></g></g><g visibility="hidden" id="Bolas2"><animate repeatCount="indefinite" begin="0.52s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g transform="translate(617.5,490.5)"><g transform="scale(0,0)"><animateTransform repeatCount="indefinite" type="scale" attributeName="transform" dur="0.48s" begin="0.52s" calcMode="spline" values="0 0; 1 1" keyTimes="0; 1" keySplines="0.333 0 0.101 1" fill="freeze" /><g transform="translate(1112,1428)"><g id="Ellipse 2" transform="matrix(0.644,0,0,0.644,-1435.793,-1556.371)"><ellipse ry="9.6775" rx="9.6775" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="8" stroke-opacity="1" stroke="#8bffac" /></g><g id="Ellipse 3" transform="matrix(0.644,0,0,0.644,-952.029,-1150.197)"><ellipse ry="9.6775" rx="9.6775" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="8" stroke-opacity="1" stroke="#8bffac" /></g></g></g></g></g><g opacity="0.01" visibility="hidden" id="cruz1"><animate repeatCount="indefinite" begin="0.6s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><animate repeatCount="indefinite" attributeName="opacity" dur="0.4s" begin="0.6s" calcMode="spline" values="0.01; 1" keyTimes="0; 1" keySplines="0 0 1 1" fill="freeze" /><g transform="translate(614.125,462.5)"><animateTransform repeatCount="indefinite" type="translate" attributeName="transform" dur="0.4s" begin="0.6s" calcMode="spline" values="614.125 462.5; 852.125 164.5" keyTimes="0; 1" keySplines="0.333 0 0.103 1" fill="freeze" /><g transform="rotate(-28)"><animateTransform repeatCount="indefinite" type="rotate" attributeName="transform" dur="1.4s" begin="0.6s" calcMode="spline" values="-28; 18" keyTimes="0; 1" keySplines="0.333 0 0.667 1" fill="freeze" /><g transform="scale(1,1) translate(882.375,1726)"><g id="Shape 1" transform="matrix(0,-1,1,0,843.572,-2608.05)"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g><g id="Shape 2"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g></g></g></g></g><g opacity="0.01" visibility="hidden" id="cruz2"><animate repeatCount="indefinite" begin="0.64s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><animate repeatCount="indefinite" attributeName="opacity" dur="0.4s" begin="0.64s" calcMode="spline" values="0.01; 1" keyTimes="0; 1" keySplines="0 0 1 1" fill="freeze" /><g transform="translate(606.125,465.5)"><animateTransform repeatCount="indefinite" type="translate" attributeName="transform" dur="0.4s" begin="0.64s" calcMode="spline" values="606.125 465.5; 322.125 572.5" keyTimes="0; 1" keySplines="0.333 0 0 1" fill="freeze" /><g transform="rotate(-30)"><animateTransform repeatCount="indefinite" type="rotate" attributeName="transform" dur="1.36s" begin="0.64s" calcMode="spline" values="-30; 16" keyTimes="0; 1" keySplines="0.333 0 0.667 1" fill="freeze" /><g transform="scale(1,1) translate(882.375,1726)"><g id="Shape 1" transform="matrix(0,-1,1,0,843.572,-2608.05)"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g><g id="Shape 2"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g></g></g></g></g><g opacity="0.01" visibility="hidden" id="cruz3"><animate repeatCount="indefinite" begin="0.72s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; visible" keyTimes="0; 1" attributeName="visibility" /><animate repeatCount="indefinite" attributeName="opacity" dur="0.4s" begin="0.72s" calcMode="spline" values="0.01; 1" keyTimes="0; 1" keySplines="0 0 1 1" fill="freeze" /><g transform="translate(614.125,467.5)"><animateTransform repeatCount="indefinite" type="translate" attributeName="transform" dur="0.4s" begin="0.72s" calcMode="spline" values="614.125 467.5; 841.125 680.5" keyTimes="0; 1" keySplines="0.333 0 0 1" fill="freeze" /><g transform="rotate(-33)"><animateTransform repeatCount="indefinite" type="rotate" attributeName="transform" dur="1.28s" begin="0.72s" calcMode="spline" values="-33; 13" keyTimes="0; 1" keySplines="0.333 0 0.667 1" fill="freeze" /><g transform="scale(1,1) translate(882.375,1726)"><g id="Shape 1" transform="matrix(0,-1,1,0,843.572,-2608.05)"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g><g id="Shape 2"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g></g></g></g></g></g></defs><g transform="matrix(1,0,0,1,-216,-106)" id="BG"><use clip-path="url(#cp-3459-3837)" height="3837" width="3459" y="0" x="0" xlink:href="#comp_745" href="#comp_745" /></g><g visibility="hidden" id="Shape Layer 1"><animate repeatCount="indefinite" begin="0.32s" calcMode="discrete" fill="freeze" dur="2.2s" values="visible; visible" keyTimes="0; 1" attributeName="visibility" /><g transform="translate(398.111,357.031)"><g transform="scale(0.3,0.3)"><animateTransform repeatCount="indefinite" type="scale" attributeName="transform" dur="0.32s" begin="0.32s" calcMode="spline" values="0.3 0.3; 1.011 1.011" keyTimes="0; 1" keySplines="0.333 0 0 1" fill="freeze" /><g transform="translate(-9.719,-2.719)"><g id="Ellipse 1" transform="matrix(1,0,0,1,9.719,2.719)"><ellipse ry="177.719" rx="177.719" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="0" stroke-opacity="1" stroke="#ffffff" fill="#8bffac" fill-opacity="1" /></g></g></g></g></g><g visibility="hidden" id="Shape Layer 2"><animate repeatCount="indefinite" begin="0.52s" calcMode="discrete" fill="freeze" dur="2.2s" values="visible; visible" keyTimes="0; 1" attributeName="visibility" /><g transform="translate(398,357.031)"><g transform="scale(0.3,0.3)"><animateTransform repeatCount="indefinite" type="scale" attributeName="transform" dur="0.32s" begin="0.52s" calcMode="spline" values="0.3 0.3; 0.916 0.916" keyTimes="0; 1" keySplines="0.333 0 0 1" fill="freeze" /><g transform="translate(-9.719,-2.719)"><g id="Ellipse 1" transform="matrix(1,0,0,1,9.719,2.719)"><ellipse ry="177.719" rx="177.719" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="0" stroke-opacity="1" stroke="#ffffff" fill="#17c37e" fill-opacity="1" /></g></g></g></g></g><g transform="matrix(1,0,0,1,396.5,357)" visibility="hidden" id="Shape Layer 3"><animate repeatCount="indefinite" begin="0.72s" calcMode="discrete" fill="freeze" dur="2.2s" values="visible; visible" keyTimes="0; 1" attributeName="visibility" /><g id="Shape 1"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="18" stroke-opacity="1" stroke="#ffffff" d="M-72,6L-28,49L75,-54" /></g></g></svg>`;

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
  const [showCategories, setShowCategories] = useState(false);
  const [showReferralPopup, setShowReferralPopup] = useState(false);

  useEffect(() => {
    const checkReferralPopup = async () => {
      try {
        const val = await AsyncStorage.getItem('show_referral_success_popup');
        if (val === 'true') {
          setShowReferralPopup(true);
          await AsyncStorage.removeItem('show_referral_success_popup');
        }
      } catch (e) {
        console.error('Error checking referral popup:', e);
      }
    };
    checkReferralPopup();
  }, []);

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
      const errorMsg = err?.message || 'Unable to add item to cart. Please try again.';
      Alert.alert('Error', errorMsg);
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

  // Filter products based on Target Gender or Category Mapping
  const getFilteredProducts = () => {
    if (selectedTab === 'All') return products;

    return products.filter(product => {
      // Primary: Filter by the newly added Target Gender
      if (selectedTab === 'Men' && product.targetGender === 'MEN') return true;
      if (selectedTab === 'Women' && product.targetGender === 'WOMEN') return true;

      // Fallback: Legacy category slug mapping for products still set to UNISEX
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
      return false;
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
  const trendingProducts = products.filter(p => p.isTrending).slice(0, 4);
  const newArrivals = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const bestSellers = [...products].sort((a, b) => {
    if (b.salesCount !== a.salesCount) return b.salesCount - a.salesCount;
    return Number(b.price) - Number(a.price);
  }).slice(0, 5);

  const renderProductCard = (item, isHorizontal = false) => {
    const isFav = favorites.has(item.id);
    const inCart = cartItems.has(item.id);
    const originalPrice = Number(item.price) * 1.5;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.productCard, 
          shadows.premium, 
          { backgroundColor: theme.bg.card },
          isHorizontal && { width: 160, marginBottom: 10 }
        ]}
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
                ₹{Number(item.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.originalPriceText}>
                ₹{originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
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
  };

  const renderReferralPopup = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showReferralPopup}
      onRequestClose={() => setShowReferralPopup(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.modalSvgContainer}>
            <SvgXml xml={SUCCESS_SVG_XML} width={120} height={120} />
          </View>
          <Text style={[styles.modalTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Referral Reward!
          </Text>
          <Text style={[styles.modalSub, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
            You have received <Text style={{ fontFamily: fonts.bold, color: theme.brand[500] }}>100 points</Text> for joining via referral code.
          </Text>
          <TouchableOpacity 
            style={[styles.modalCloseBtn, { backgroundColor: theme.brand[500] }]} 
            onPress={() => setShowReferralPopup(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.modalCloseBtnText, { fontFamily: fonts.bold }]}>
              START EXPLORING
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {renderReferralPopup()}
      
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
          <TouchableOpacity style={[styles.filterSettingsBtn, { backgroundColor: showCategories ? theme.brand[500] : theme.bg.card }, shadows.premium]} activeOpacity={0.7} onPress={() => setShowCategories(v => !v)}>
            <SlidersHorizontal size={18} color={showCategories ? '#ffffff' : '#1e1e1e'} />
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        {showCategories && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                Categories
              </Text>
            </View>

            {/* Categories Tabs Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesTabsRow}>
              {['All', 'Men', 'Women'].map((tab) => {
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
              <TouchableOpacity
                style={[
                  styles.categoryTab,
                  { backgroundColor: theme.bg.card },
                  shadows.premium
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Browse')}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    { fontFamily: fonts.medium, color: theme.text.primary }
                  ]}
                >
                  View All
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}

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

        {/* Trending Products Section */}
        {trendingProducts.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                Trending Now
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('TrendingProducts')}
                style={[styles.seeAllBtn, { backgroundColor: theme.brand[50] }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllBtnText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                  See All
                </Text>
                <ChevronRight size={12} color={theme.brand[500]} />
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              {trendingProducts.map((item) => renderProductCard(item, false))}
            </View>
            <TouchableOpacity
              style={[
                {
                  backgroundColor: theme.brand[500],
                  marginHorizontal: 20,
                  marginTop: 4,
                  paddingVertical: 14,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                shadows.premium
              ]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('TrendingProducts')}
            >
              <Text style={{ color: '#ffffff', fontFamily: fonts.bold, fontSize: 14, marginRight: 6 }}>
                View All Trending
              </Text>
              <ChevronRight size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* New Arrivals Section */}
        {newArrivals.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                New Arrivals
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('NewArrivals')}
                style={[styles.seeAllBtn, { backgroundColor: theme.brand[50] }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllBtnText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                  See All
                </Text>
                <ChevronRight size={12} color={theme.brand[500]} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
              {newArrivals.map((item) => renderProductCard(item, true))}
              <TouchableOpacity
                style={[
                  styles.productCard, 
                  shadows.premium, 
                  { backgroundColor: theme.bg.card, width: 160, marginBottom: 10, alignItems: 'center', justifyContent: 'center' }
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('NewArrivals')}
              >
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.brand[50], alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <ChevronRight size={24} color={theme.brand[500]} />
                </View>
                <Text style={{ fontFamily: fonts.bold, color: theme.text.primary, fontSize: 14 }}>
                  View All
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Top Selling Items Section */}
        {bestSellers.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                Top Selling Items
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('BestSellers')}
                style={[styles.seeAllBtn, { backgroundColor: theme.brand[50] }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllBtnText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                  See All
                </Text>
                <ChevronRight size={12} color={theme.brand[500]} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
              {bestSellers.map((item) => renderProductCard(item, true))}
              <TouchableOpacity
                style={[
                  styles.productCard, 
                  shadows.premium, 
                  { backgroundColor: theme.bg.card, width: 160, marginBottom: 10, alignItems: 'center', justifyContent: 'center' }
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('BestSellers')}
              >
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.brand[50], alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <ChevronRight size={24} color={theme.brand[500]} />
                </View>
                <Text style={{ fontFamily: fonts.bold, color: theme.text.primary, fontSize: 14 }}>
                  View All
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Just For You Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Just For You
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
          {filteredProducts.map((item) => renderProductCard(item, false))}
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

  /* Modal styling for Referral Success */
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
  modalSvgContainer: {
    marginBottom: 16,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 10,
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
