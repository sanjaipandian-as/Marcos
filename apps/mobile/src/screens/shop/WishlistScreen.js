import React, { useState, useEffect } from 'react';
import WishlistIcon from '../../components/common/WishlistIcon';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  ShoppingCart,
  X,
  ChevronLeft
} from 'lucide-react-native';
import { CustomCartAddIcon, CustomCartAddedIcon } from '../../components/CartIcons';

export default function WishlistScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuest, setIsGuest] = useState(false);

  const loadFavorites = async () => {
    try {
      if (favorites.length === 0) {
        setLoading(true);
      }
      const favRes = await api.get('/products/favorites');

      if (favRes.success) {
        setFavorites(favRes.data || []);
        setIsGuest(false);
      }
    } catch (err) {
      console.log('[Wishlist] Auth check failed:', err?.message || err);
      // Set guest mode if unauthorized or refresh token is not found
      if (err?.message?.includes('No refresh token') || err?.status === 401 || err?.statusCode === 401) {
        setIsGuest(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });
    return unsubscribe;
  }, [navigation]);

  const handleToggleFavorite = async (productId) => {
    try {
      await api.delete(`/products/favorites/${productId}`);
      // Optimistically remove from state
      setFavorites(prev => prev.filter(item => item.productId !== productId));
    } catch (err) {
      console.error('Error removing favorite:', err);
      Alert.alert('Error', 'Failed to remove from wishlist.');
    }
  };

  const getFilteredFavorites = () => {
    if (!searchQuery.trim()) return favorites;
    return favorites.filter(item => 
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.product.description && item.product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const renderProductItem = ({ item }) => {
    const product = item.product;
    const isOutOfStock = product.inventoryQty <= 0;
    
    // Generate cross-out price (original price)
    const originalPrice = product.price === "item.price" ? (item.originalPrice ? Number(item.originalPrice) : null) : (typeof product !== "undefined" && product.originalPrice ? Number(product.originalPrice) : (typeof item !== "undefined" && item.originalPrice ? Number(item.originalPrice) : null));

    return (
      <TouchableOpacity 
        style={[styles.prodCard, shadows.premium, { backgroundColor: theme.bg.card }]}
        onPress={() => navigation.navigate('ProductDetails', { productId: product.id })}
        activeOpacity={0.9}
      >
        <View style={styles.prodImageWrapper}>
          <Image 
            source={{ uri: (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=300&auto=format&fit=crop' }} 
            style={styles.prodImage}
          />
          
          {/* Favorite Toggle Button */}
          <TouchableOpacity 
            style={styles.favBtn}
            onPress={() => handleToggleFavorite(product.id)}
            activeOpacity={0.7}
          >
            <WishlistIcon 
              size={14} 
              color="#3D2E3D" 
              fill="#3D2E3D" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.prodInfo}>
          <Text style={[styles.prodName, { color: theme.text.primary, fontFamily: fonts.semiBold }]} numberOfLines={2}>
            {product.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isGuest) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={[styles.headerBtn, shadows.premium]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <ChevronLeft size={20} color="#1e1e1e" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary, fontFamily: fonts.bold }]}>
            My Wishlist
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.bg.card }]}>
            <WishlistIcon size={40} color={theme.brand[300]} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text.primary, fontFamily: fonts.bold }]}>
            Please Login
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary, fontFamily: fonts.medium }]}>
            Log in to your account to view and manage your personal wishlist collection.
          </Text>
          <TouchableOpacity 
            style={[styles.shopBtn, { backgroundColor: theme.brand[500] }]}
            onPress={() => navigation.navigate('AuthStack', { screen: 'LoginIdentifier' })}
          >
            <Text style={[styles.shopBtnText, { color: '#3D2E3D', fontFamily: fonts.bold }]}>LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary, fontFamily: fonts.bold }]}>
          My Wishlist
        </Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBarContainer, { backgroundColor: theme.bg.input, borderColor: theme.border }]}>
          <Search size={18} color={theme.text.muted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text.primary, fontFamily: fonts.regular }]}
            placeholder="Search..."
            placeholderTextColor={theme.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={theme.text.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.bg.input }]}>
          <SlidersHorizontal size={18} color={theme.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {loading && favorites.length === 0 ? (
        <View style={styles.gridPadding}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[1, 2, 3, 4].map((idx) => (
              <View key={idx} style={[styles.prodCard, { backgroundColor: theme.bg.card, height: 220, opacity: 0.6 }]}>
                <View style={[styles.prodImageWrapper, { backgroundColor: theme.border }]} />
                <View style={{ padding: 10, gap: 8 }}>
                  <View style={[styles.skeletonLine, { width: '80%', height: 12, backgroundColor: theme.border }]} />
                  <View style={[styles.skeletonLine, { width: '50%', height: 12, backgroundColor: theme.border }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.bg.card }]}>
            <WishlistIcon size={40} color={theme.brand[300]} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text.primary, fontFamily: fonts.bold }]}>
            Your Wishlist is Empty
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary, fontFamily: fonts.medium }]}>
            Tap the heart icon on any masterpiece to save it in your personal collection.
          </Text>
          <TouchableOpacity 
            style={[styles.shopBtn, { backgroundColor: theme.brand[500] }]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Browse' })}
          >
            <Text style={[styles.shopBtnText, { color: '#3D2E3D', fontFamily: fonts.bold }]}>EXPLORE CATALOG</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={getFilteredFavorites()}
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
  skeletonLine: {
    borderRadius: 4,
  },
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
    letterSpacing: 0.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 10,
    gap: 12,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
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
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPadding: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
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
    height: 180,
    width: '100%',
    backgroundColor: '#eaeaea',
  },
  prodImage: {
    width: '100%',
    height: '100%',
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  prodInfo: {
    padding: 10,
    gap: 4,
  },
  prodName: {
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  priceContainer: {
    flex: 1,
  },
  prodPrice: {
    fontSize: 14,
  },
  originalPrice: {
    fontSize: 11,
    color: '#B8A8B8',
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
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  shopBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  shopBtnText: {
    fontSize: 12,
    letterSpacing: 1,
  },
});
