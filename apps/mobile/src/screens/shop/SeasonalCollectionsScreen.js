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
  Dimensions
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import { ArrowLeft, Sparkles, ShoppingBag, ShoppingCart, Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function SeasonalCollectionsScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, favRes, cartRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/favorites').catch(() => ({ success: false, data: [] })),
        api.get('/products/cart').catch(() => ({ success: false, data: [] }))
      ]);

      if (prodRes.success) {
        // Seasonal: display bridal, sherwanis, or premium lehengas (typically priced above 35k)
        const items = prodRes.data.filter(p => Number(p.price) >= 35000);
        setProducts(items);
      }
      if (favRes.success && favRes.data) {
        setFavorites(new Set(favRes.data.map(item => item.productId)));
      }
      if (cartRes.success && cartRes.data) {
        setCartItems(new Set(cartRes.data.map(item => item.productId)));
      }
    } catch (err) {
      console.error('Error loading seasonal collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
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
        await api.post('/products/cart', { productId, quantity: 1 });
        setCartItems(prev => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      } else {
        navigation.navigate('Cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.prodCard, shadows.premium]}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.prodImageWrapper}>
        <Image 
          source={{ uri: (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=300&auto=format&fit=crop' }} 
          style={styles.prodImage}
        />
        
        {/* Left corner Favorite Button */}
        <TouchableOpacity 
          style={styles.favBtn}
          onPress={() => toggleFavorite(item.id)}
          activeOpacity={0.7}
        >
          <Heart 
            size={16} 
            color={favorites.has(item.id) ? '#ef4444' : '#475569'} 
            fill={favorites.has(item.id) ? '#ef4444' : 'transparent'} 
          />
        </TouchableOpacity>

        {/* Right corner tag */}
        <View style={styles.prodTag}>
          <Sparkles size={8} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={[styles.prodTagText, { fontFamily: fonts.bold }]}>SEASONAL</Text>
        </View>
      </View>
      <View style={styles.prodInfo}>
        <Text style={[styles.prodName, { fontFamily: fonts.semiBold }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.prodMaterial, { fontFamily: fonts.regular }]} numberOfLines={1}>
          {item.materialInfo || 'Premium Fabric'}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={[styles.prodPrice, { fontFamily: fonts.bold, color: '#006241' }]}>
            ₹{Number(item.price).toLocaleString('en-IN')}
          </Text>
          
          <View style={styles.cardRightActions}>
            <TouchableOpacity 
              style={styles.cartIconBtn} 
              onPress={() => handleAddToCart(item.id)}
              activeOpacity={0.7}
            >
              {cartItems.has(item.id) ? (
                <ShoppingCart size={15} color="#006241" />
              ) : (
                <ShoppingBag size={15} color="#475569" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>
            Seasonal Collections
          </Text>
          <Text style={[styles.headerSubtitle, { fontFamily: fonts.regular }]}>
            Royal crimson velvet lehengas & bridal wear for winter weddings
          </Text>
        </View>
      </View>

      {/* Product list */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#006241" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { fontFamily: fonts.medium }]}>
            No seasonal collections available at the moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
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
    borderBottomWidth: 0.8,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 0.8,
    borderColor: '#e2e8f0',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
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
    borderRadius: 24,
    borderWidth: 0.8,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  prodImageWrapper: {
    position: 'relative',
    height: 170,
    width: '100%',
  },
  prodImage: {
    width: '100%',
    height: '100%',
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 5,
  },
  prodTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  prodTagText: {
    color: '#ffffff',
    fontSize: 8,
    letterSpacing: 0.5,
  },
  prodInfo: {
    padding: 12,
    gap: 3,
  },
  prodName: {
    fontSize: 13,
    color: '#1e293b',
  },
  prodMaterial: {
    fontSize: 10.5,
    color: '#64748b',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  prodPrice: {
    fontSize: 13.5,
  },
  cardRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
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
    color: '#64748b',
  },
});
