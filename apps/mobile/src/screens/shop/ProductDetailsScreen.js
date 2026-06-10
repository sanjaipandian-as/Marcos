import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import {
  ChevronLeft,
  Share2,
  Heart,
  Plus,
  Minus,
  ShoppingCart,
  ShoppingBag,
  PlusCircle
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId } = route.params;
  const { theme, fonts, shadows } = useTheme();

  // Data & Control States
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFav, setIsFav] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState('L'); // S, M, L, XL
  const [adding, setAdding] = useState(false);
  const [activeThumbnailIndex, setActiveThumbnailIndex] = useState(0);

  const loadProductDetails = async () => {
    try {
      if (!product || product.id !== productId) {
        setLoading(true);
      }
      const [prodRes, cartRes, favRes] = await Promise.all([
        api.get(`/products/${productId}`),
        api.get('/products/cart'),
        api.get('/products/favorites')
      ]);

      if (prodRes.success) {
        setProduct(prodRes.data);
      } else {
        Alert.alert('Error', 'Product not found.');
        navigation.goBack();
        return;
      }

      if (cartRes.success && cartRes.data) {
        setIsInCart(cartRes.data.some(item => item.productId === productId));
      }
      if (favRes.success && favRes.data) {
        setIsFav(favRes.data.some(item => item.productId === productId));
      }
    } catch (err) {
      console.error('Error loading product details:', err);
      Alert.alert('Error', 'Failed to load details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  const toggleFavorite = async () => {
    if (!product) return;
    try {
      if (isFav) {
        await api.delete(`/products/favorites/${product.id}`);
        setIsFav(false);
      } else {
        await api.post('/products/favorites', { productId: product.id });
        setIsFav(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (isInCart) {
      navigation.navigate('Cart');
      return;
    }

    setAdding(true);
    try {
      const res = await api.post('/products/cart', {
        productId: product.id,
        quantity: quantity,
      });

      if (res.success) {
        setIsInCart(true);
        Alert.alert(
          'Added to Cart',
          'This custom masterpiece has been successfully added to your cart.',
          [
            { text: 'Continue Shopping', style: 'cancel' },
            { text: 'View Cart', onPress: () => navigation.navigate('Cart') }
          ]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add item to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading && (!product || product.id !== productId)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
        {/* Header Skeleton */}
        <View style={styles.headerBar}>
          <View style={[styles.headerBtn, { backgroundColor: theme.border }]} />
          <View style={[styles.skeletonTitle, { backgroundColor: theme.border }]} />
          <View style={[styles.headerBtn, { backgroundColor: theme.border }]} />
        </View>

        <View style={styles.scrollContent}>
          {/* Large Image Block Skeleton */}
          <View style={[styles.imageCard, { backgroundColor: theme.border, height: 320 }]} />
          
          {/* Info Section Skeleton */}
          <View style={styles.infoSection}>
            <View style={[styles.skeletonLine, { width: '60%', height: 24, backgroundColor: theme.border }]} />
            <View style={[styles.skeletonLine, { width: '45%', height: 20, backgroundColor: theme.border }]} />
            <View style={[styles.skeletonLine, { width: '90%', height: 60, backgroundColor: theme.border, marginTop: 10 }]} />
          </View>
        </View>
      </View>
    );
  }

  if (!product) return null;

  const productImage = (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80';
  
  // Fake thumbnails for visualization of multiple angles
  const thumbnails = [productImage, productImage, productImage, productImage];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium]} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Details
        </Text>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium]}>
          <Share2 size={20} color="#1e1e1e" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Large Product Image Card */}
        <View style={[styles.imageCard, shadows.premium]}>
          <Image 
            source={{ uri: thumbnails[activeThumbnailIndex] }} 
            style={styles.mainImage} 
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.heartBtn} activeOpacity={0.7} onPress={toggleFavorite}>
            <Heart size={20} color={isFav ? '#ef4444' : '#767676'} fill={isFav ? '#ef4444' : 'transparent'} />
          </TouchableOpacity>
          
          {/* Thumbnails Row */}
          <View style={styles.thumbnailsRow}>
            {thumbnails.map((thumb, index) => {
              const isActive = index === activeThumbnailIndex;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.thumbnailWrapper, isActive && { borderColor: theme.brand[500], borderWidth: 2 }]}
                  onPress={() => setActiveThumbnailIndex(index)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: thumb }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Product Meta Section */}
        <View style={styles.infoSection}>
          <View style={styles.titlePriceRow}>
            <View style={styles.titleCol}>
              <Text style={[styles.productName, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                {product.name}
              </Text>
              <Text style={[styles.categoryText, { fontFamily: fonts.medium, color: theme.text.muted }]}>
                {product.materialInfo || 'Bespoke Premium Fabric'}
              </Text>
            </View>
            <Text style={[styles.productPrice, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              ₹{Number(product.price).toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Size Selector and Quantity Adjuster Row */}
          <View style={styles.selectorsRow}>
            <View style={styles.sizeSection}>
              <Text style={[styles.sectionLabel, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                Select Size
              </Text>
              <View style={styles.sizesRow}>
                {['S', 'M', 'L', 'XL'].map((size) => {
                  const isActive = selectedSize === size;
                  return (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeBox,
                        isActive ? { backgroundColor: theme.brand[500] } : { backgroundColor: theme.bg.input }
                      ]}
                      onPress={() => setSelectedSize(size)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          { fontFamily: fonts.bold },
                          isActive ? { color: '#ffffff' } : { color: theme.text.primary }
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Quantity Adjuster */}
            <View style={styles.qtySection}>
              <View style={styles.qtyContainer}>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => setQuantity(q => Math.max(1, q - 1))}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color="#1e1e1e" />
                </TouchableOpacity>
                <Text style={[styles.qtyText, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                  {quantity}
                </Text>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => setQuantity(q => q + 1)}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#1e1e1e" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionLabel, { fontFamily: fonts.bold, color: theme.text.primary, marginBottom: 8 }]}>
              Description
            </Text>
            <Text style={[styles.descriptionText, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
              {product.description || 'No description available for this luxury product. Every thread tells a story of craftsmanship.'}{' '}
              <Text style={{ color: theme.brand[500], fontFamily: fonts.bold }}>Learn More</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions Row */}
      <View style={[styles.bottomActionsRow, shadows.premium]}>
        <TouchableOpacity 
          style={[styles.cartActionBtn, { borderColor: theme.text.primary }]}
          onPress={handleAddToCart}
          disabled={adding}
          activeOpacity={0.8}
        >
          {adding ? (
            <ActivityIndicator size="small" color={theme.text.primary} />
          ) : (
            <>
              <PlusCircle size={20} color={theme.text.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.btnTextOutline, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                {isInCart ? 'Go to Cart' : 'Add To Cart'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.buyActionBtn, { backgroundColor: theme.brand[500] }]}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <ShoppingBag size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={[styles.btnTextFilled, { fontFamily: fonts.bold, color: '#ffffff' }]}>
            Buy Now
          </Text>
        </TouchableOpacity>
      </View>
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
  skeletonTitle: {
    width: 100,
    height: 20,
    borderRadius: 6,
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
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  imageCard: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginTop: 10,
    height: 380,
    position: 'relative',
    paddingBottom: 60, // Space for thumbnails inside the card
  },
  mainImage: {
    width: '100%',
    height: 310,
  },
  heartBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  thumbnailsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  thumbnailWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eaeaea',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    marginTop: 20,
    gap: 20,
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 22,
    lineHeight: 28,
  },
  categoryText: {
    fontSize: 13,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 22,
  },
  selectorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
  },
  sizeSection: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  sizesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeText: {
    fontSize: 13,
  },
  qtySection: {
    justifyContent: 'flex-end',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    height: 38,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    marginHorizontal: 10,
    minWidth: 16,
    textAlign: 'center',
  },
  descriptionSection: {
    marginTop: 5,
  },
  descriptionText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  bottomActionsRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f2',
  },
  cartActionBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyActionBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextOutline: {
    fontSize: 15,
  },
  btnTextFilled: {
    fontSize: 15,
  },
});
