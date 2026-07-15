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
import { useAuth } from '../../contexts/AuthContext';
import {
  ChevronLeft,
  Share2,
  Heart,
  CalendarCheck,
  Sparkles,
  Truck
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId } = route.params;
  const { theme, fonts, shadows } = useTheme();
  const { requireAuth } = useAuth();

  // Data & Control States
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isFav, setIsFav] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState('L'); // S, M, L, XL
  const [adding, setAdding] = useState(false);
  const [activeThumbnailIndex, setActiveThumbnailIndex] = useState(0);
  
  const [similarCategoryProducts, setSimilarCategoryProducts] = useState([]);
  const [similarSubCategoryProducts, setSimilarSubCategoryProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [activeOffers, setActiveOffers] = useState([]);

  const loadProductDetails = async () => {
    try {
      if (!product || product.id !== productId) {
        setLoading(true);
      }
      const [prodRes, cartRes, favRes, allProductsRes, categoriesRes, offersRes] = await Promise.all([
        api.get(`/products/${productId}`).catch(err => ({ success: false, _err: err })),
        api.get('/products/cart').catch(() => ({ success: false, data: [] })),
        api.get('/products/favorites').catch(() => ({ success: false, data: [] })),
        api.get('/products?page=1&limit=200').catch(() => ({ success: false, data: [] })),
        api.get('/categories').catch(() => ({ success: false, data: [] })),
        api.get('/offers/active').catch(() => ({ success: false, data: [] }))
      ]);

      if (prodRes.success) {
        const prod = prodRes.data;
        setProduct(prod);

        if (categoriesRes.success) {
          const cat = categoriesRes.data.find(c => c.id === prod.categoryId);
          if (cat) setCategoryName(cat.name);
        }

        if (allProductsRes.success) {
          const allProds = allProductsRes.data || [];
          const others = allProds.filter(p => p.id !== prod.id);
          const bySubCat = prod.subCategoryId 
            ? others.filter(p => p.subCategoryId === prod.subCategoryId).slice(0, 10)
            : [];
          const byCat = others.filter(p => p.categoryId === prod.categoryId && p.subCategoryId !== prod.subCategoryId).slice(0, 10);
          setSimilarCategoryProducts(byCat);
          setSimilarSubCategoryProducts(bySubCat);
        }

        if (offersRes.success && offersRes.data) {
          const applicable = offersRes.data.filter(offer => {
            const isStorewide = (!offer.applicableProductIds || offer.applicableProductIds.length === 0) &&
                                (!offer.applicableCategoryIds || offer.applicableCategoryIds.length === 0);
            const isProductMatch = offer.applicableProductIds?.includes(prod.id);
            const isCategoryMatch = offer.applicableCategoryIds?.includes(prod.categoryId);
            return isStorewide || isProductMatch || isCategoryMatch;
          });
          setActiveOffers(applicable);
        }
      } else {
        console.warn('Product not found or failed to load:', prodRes);
        Alert.alert('Error', 'Product not found or failed to load.');
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
      console.warn('Error loading product details:', err.message);
      // Don't navigate back — just stop loading so user isn't trapped
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  const toggleFavorite = async () => {
    requireAuth(async () => {
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
        console.warn('Favorite toggle failed (likely session expired):', err.message);
      }
    });
  };

  const handleAddToCart = async () => {
    requireAuth(async () => {
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
    });
  };

  const handleBuyNow = () => {
    requireAuth(() => {
      if (!product) return;
      const directCheckoutItem = {
        id: 'direct_' + Date.now(),
        productId: product.id,
        quantity: quantity,
        product: product
      };
      navigation.navigate('Checkout', {
        cartItems: [directCheckoutItem],
        appliedCoupon: null,
        discountAmount: 0
      });
    });
  };

  const handleBookConsultation = () => {
    requireAuth(() => {
      if (!product) return;
      navigation.navigate('BespokeBooking', {
        prefillProduct: product.name,
        prefillCategory: categoryName || 'Product Consultation',
        prefillProductImage: product.images && product.images[0] ? product.images[0] : ''
      });
    });
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

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.main, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 }]}>
        <Text style={{ fontSize: 16, color: theme.text.secondary, textAlign: 'center', fontFamily: fonts.medium }}>
          Could not load product details. Please check your connection and try again.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: theme.brand[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}
          onPress={() => { setLoading(true); loadProductDetails(); }}
        >
          <Text style={{ color: '#3D2E3D', fontFamily: fonts.bold }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: theme.text.secondary, fontFamily: fonts.medium }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const thumbnails = (product.images && product.images.length > 0) 
    ? product.images 
    : [];

  // Check if any active offer grants free delivery for this product
  const hasFreeDelivery = product.hasFreeShipping || activeOffers.some(
    offer => offer.isFreeShipping || offer.type === 'FREE_SHIPPING'
  );

  // Horizontal card renderer (for category products)
  const renderHorizontalProduct = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.similarCard, { backgroundColor: theme.bg.card }, shadows.premium]}
      onPress={() => navigation.push('ProductDetails', { productId: item.id })}
      activeOpacity={0.8}
    >
      {item.images && item.images[0] ? (
        <Image 
          source={{ uri: item.images[0] }} 
          style={styles.similarImage} 
        />
      ) : (
        <View style={[styles.similarImage, { backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' }]}>
          <ShoppingBag size={28} color={theme.text.muted} />
        </View>
      )}
      <View style={styles.similarInfo}>
        <Text style={[styles.similarName, { fontFamily: fonts.semiBold, color: theme.text.primary }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.similarPrice, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          ₹{Number(item.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Vertical grid card renderer (for subcategory products)
  const renderGridProduct = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.gridCard, { backgroundColor: theme.bg.card }, shadows.premium]}
      onPress={() => navigation.push('ProductDetails', { productId: item.id })}
      activeOpacity={0.8}
    >
      {item.images && item.images[0] ? (
        <Image 
          source={{ uri: item.images[0] }} 
          style={styles.gridImage} 
        />
      ) : (
        <View style={[styles.gridImage, { backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' }]}>
          <ShoppingBag size={28} color={theme.text.muted} />
        </View>
      )}
      <View style={styles.gridInfo}>
        <Text style={[styles.gridName, { fontFamily: fonts.semiBold, color: theme.text.primary }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.gridPrice, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          ₹{Number(item.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </Text>
        {item.hasFreeShipping && (
          <View style={styles.gridFreeShipBadge}>
            <Truck size={10} color="#16a34a" />
            <Text style={styles.gridFreeShipText}>Free Delivery</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
        
        {/* Product Banner Image (above product images) */}
        {product.bannerImage ? (
          <Image 
            source={{ uri: product.bannerImage }} 
            style={[styles.bannerImage, shadows.premium]} 
            resizeMode="cover"
          />
        ) : null}

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
        </View>
        
        {/* Thumbnails Row (Moved under main image) */}
        {thumbnails.length > 1 && (
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
        )}

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
              {hasFreeDelivery && (
                <View style={[styles.freeDeliveryRow, { marginTop: 8 }]}>
                  <Truck size={14} color="#16a34a" style={{ marginRight: 5 }} />
                  <Text style={styles.freeDeliveryText}>Free Delivery</Text>
                </View>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 10, color: theme.text.muted, fontFamily: fonts.medium, marginBottom: 2 }}>
                Starts from
              </Text>
              <Text style={[styles.productPrice, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                ₹{Number(product.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>

          {/* Active Offers Section */}
          {activeOffers && activeOffers.length > 0 && (
            <View style={styles.offersContainer}>
              <View style={styles.offersHeader}>
                <Sparkles size={14} color={theme.brand[500]} style={{ marginRight: 6 }} />
                <Text style={[styles.offersHeading, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                  Special Promos & Offers
                </Text>
              </View>
              {activeOffers.map(offer => {
                const isFreeShip = offer.isFreeShipping || offer.type === 'FREE_SHIPPING';
                let offerTag = '';
                if (offer.type === 'PERCENTAGE') {
                  offerTag = `${offer.discountValue}% OFF`;
                } else if (offer.type === 'FLAT') {
                  offerTag = `₹${offer.discountValue} OFF`;
                } else if (isFreeShip) {
                  offerTag = 'FREE SHIP';
                }

                return (
                  <View key={offer.id} style={[styles.offerRow, { borderColor: theme.border, backgroundColor: theme.bg.input }]}>
                    <View style={[styles.offerBadge, { backgroundColor: theme.brand[500] }]}>
                      <Text style={[styles.offerBadgeText, { fontFamily: fonts.bold }]}>{offerTag}</Text>
                    </View>
                    <View style={styles.offerTextCol}>
                      <Text style={[styles.offerRowTitle, { fontFamily: fonts.bold, color: theme.text.primary }]} numberOfLines={1}>
                        {offer.title}
                      </Text>
                      {offer.description ? (
                        <Text style={[styles.offerRowDesc, { fontFamily: fonts.medium, color: theme.text.secondary }]} numberOfLines={1}>
                          {offer.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}



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

        {/* Similar Products - SubCategory first (vertical 2-per-row grid), then Category (horizontal scroll) */}
        {product.subCategoryId && similarSubCategoryProducts.length > 0 && (
          <View style={styles.similarSection}>
            <View style={styles.similarHeader}>
              <Text style={[styles.similarTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                Similar Styles
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProductsCatalog', { categoryId: product.categoryId, subCategoryId: product.subCategoryId })}>
                <Text style={[styles.seeAllText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              {similarSubCategoryProducts.map(renderGridProduct)}
            </View>
          </View>
        )}

        {similarCategoryProducts.length > 0 && (
          <View style={styles.similarSection}>
            <View style={styles.similarHeader}>
              <Text style={[styles.similarTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                More in {categoryName || 'this Category'}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProductsCatalog', { categoryId: product.categoryId })}>
                <Text style={[styles.seeAllText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarScroll}>
              {similarCategoryProducts.map(renderHorizontalProduct)}
            </ScrollView>
          </View>
        )}

        {/* If no subcategory, but subcategory products exist (fallback) */}
        {!product.subCategoryId && similarSubCategoryProducts.length > 0 && (
          <View style={styles.similarSection}>
            <View style={styles.similarHeader}>
              <Text style={[styles.similarTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                You May Also Like
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarScroll}>
              {similarSubCategoryProducts.map(renderHorizontalProduct)}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions Row */}
      <View style={[styles.bottomActionsRow, shadows.premium]}>
        {/* Wishlist / Heart Button */}
        <TouchableOpacity
          style={[
            styles.wishlistActionBtn,
            { borderColor: isFav ? '#ef4444' : theme.border, backgroundColor: isFav ? '#fff0f0' : theme.bg.card }
          ]}
          onPress={toggleFavorite}
          activeOpacity={0.8}
        >
          <Heart
            size={24}
            color={isFav ? '#ef4444' : theme.text.secondary}
            fill={isFav ? '#ef4444' : 'transparent'}
          />
        </TouchableOpacity>

        {/* Book a Slot Button */}
        <TouchableOpacity
          style={[styles.bookSlotBtn, { backgroundColor: theme.brand[500] }]}
          onPress={handleBookConsultation}
          activeOpacity={0.8}
        >
          <CalendarCheck size={20} color="#3D2E3D" style={{ marginRight: 10 }} />
          <Text style={[styles.bookSlotBtnText, { fontFamily: fonts.bold, color: '#3D2E3D' }]}>
            BOOK A SLOT
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
    height: 380,
    position: 'relative',
    // Removed paddingBottom to keep it clean for the main image
  },
  bannerImage: {
    width: '100%',
    height: 100, // Reduced height for better proportion
    borderRadius: 20,
    marginBottom: 16,
    marginTop: 4,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  thumbnailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  thumbnailWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eaeaea',
    borderWidth: 2,
    borderColor: 'transparent',
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
  freeDeliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  freeDeliveryText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: 'bold',
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
  wishlistActionBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookSlotBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookSlotBtnText: {
    fontSize: 14,
    letterSpacing: 1.2,
  },
  similarSection: {
    marginTop: 32,
    marginBottom: 8,
  },
  similarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  similarTitle: {
    fontSize: 18,
  },
  seeAllText: {
    fontSize: 13,
  },
  similarScroll: {
    gap: 16,
    paddingRight: 20, // Add padding at end of scroll
  },
  similarCard: {
    width: 150,
    borderRadius: 16,
    overflow: 'hidden',
  },
  similarImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#eaeaea',
  },
  similarInfo: {
    padding: 10,
    gap: 4,
  },
  similarName: {
    fontSize: 13,
  },
  similarPrice: {
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  gridImage: {
    width: '100%',
    height: (width - 52) / 2,
    backgroundColor: '#eaeaea',
  },
  gridInfo: {
    padding: 10,
    gap: 3,
  },
  gridName: {
    fontSize: 13,
  },
  gridPrice: {
    fontSize: 14,
  },
  gridFreeShipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  gridFreeShipText: {
    color: '#16a34a',
    fontSize: 10,
    fontWeight: 'bold',
  },
  offersContainer: {
    marginTop: 8,
    gap: 8,
  },
  offersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  offersHeading: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  offerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
  },
  offerTextCol: {
    flex: 1,
  },
  offerRowTitle: {
    fontSize: 12.5,
  },
  offerRowDesc: {
    fontSize: 10,
    marginTop: 1,
  },

});
