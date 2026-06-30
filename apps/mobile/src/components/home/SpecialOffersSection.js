import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, useWindowDimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { CustomCartAddIcon, CustomCartAddedIcon } from '../CartIcons';

export default function SpecialOffersSection({ offers, products, cartItems, theme, fonts, navigation, handleAddToCart }) {
  const { width } = useWindowDimensions();

  if (!offers || offers.length === 0) return null;

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Special Offers
        </Text>
        {offers.length > 6 && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Discounts')}
            style={[styles.seeAllBtn, { backgroundColor: theme.brand[50] }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeAllBtnText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
              See All
            </Text>
            <ChevronRight size={12} color={theme.brand[500]} />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16, paddingBottom: 16 }}>
        {Array.from({ length: Math.ceil(offers.slice(0, 6).length / 2) }).map((_, colIndex) => (
          <View key={`col-${colIndex}`} style={{ width: offers.length <= 2 ? width - 40 : width - 60 }}>
            {offers.slice(colIndex * 2, colIndex * 2 + 2).map(offer => {
              // Find a representative product
              let displayProduct = null;
              if (offer.applicableProductIds?.length > 0) {
                displayProduct = products.find(p => p.id === offer.applicableProductIds[0]);
              }
              if (!displayProduct && offer.applicableCategoryIds?.length > 0) {
                displayProduct = products.find(p => p.categoryId === offer.applicableCategoryIds[0]);
              }
              if (!displayProduct) {
                displayProduct = products[0]; // fallback
              }

              const originalPrice = Number(displayProduct?.price || 1000);
              let discountText = '';
              let finalPrice = originalPrice;

              const hasFreeShip = offer.isFreeShipping || offer.type === 'FREE_SHIPPING';
              if (offer.type === 'PERCENTAGE') {
                discountText = `${offer.discountValue}% OFF${hasFreeShip ? ' + Free Delivery' : ''}`;
                finalPrice = originalPrice - (originalPrice * (offer.discountValue / 100));
              } else if (offer.type === 'FLAT') {
                discountText = `₹${offer.discountValue} OFF${hasFreeShip ? ' + Free Delivery' : ''}`;
                finalPrice = Math.max(0, originalPrice - offer.discountValue);
              } else if (hasFreeShip) {
                discountText = `Free Delivery`;
              }

              const inCart = displayProduct && cartItems.has(displayProduct.id);

              return (
                <View key={offer.id} style={[styles.offerCard, { backgroundColor: theme.bg.card, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' }]}>
                  <View style={styles.offerImageContainer}>
                    <Image
                      source={{ uri: (displayProduct?.images && displayProduct.images[0]) || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&q=80' }}
                      style={styles.offerImage}
                      resizeMode="cover"
                    />
                    <View style={styles.offerDiscountBadge}>
                      <Text style={styles.offerDiscountText}>{discountText}</Text>
                    </View>
                  </View>
                  <View style={styles.offerInfoContainer}>
                    <View>
                      <Text style={[styles.offerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]} numberOfLines={1}>
                        {offer.title}
                      </Text>
                      <Text style={[styles.offerDesc, { fontFamily: fonts.regular, color: theme.text.secondary }]} numberOfLines={2}>
                        {offer.description || "Grab this amazing deal now!"}
                      </Text>
                    </View>

                    <View style={styles.offerBottomRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }} numberOfLines={1}>Starts from</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          <Text style={[styles.offerPrice, { fontFamily: fonts.bold, color: theme.text.primary }]} numberOfLines={1}>
                            ₹{finalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </Text>
                          {originalPrice > finalPrice && (
                            <Text style={[styles.offerOriginalPrice, { fontFamily: fonts.medium, marginBottom: 0 }]} numberOfLines={1}>
                              ₹{originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          style={[
                            styles.offerCartBtn,
                            inCart
                              ? { backgroundColor: theme.brand[500], borderWidth: 1, borderColor: theme.brand[500] }
                              : { backgroundColor: '#ffffff', borderWidth: 1, borderColor: theme.brand[500] }
                          ]}
                          activeOpacity={0.8}
                          onPress={() => displayProduct && handleAddToCart(displayProduct.id)}
                        >
                          {inCart ? (
                            <CustomCartAddedIcon color="#ffffff" size={16} />
                          ) : (
                            <CustomCartAddIcon color={theme.brand[500]} size={16} />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.offerBuyBtn}
                          activeOpacity={0.8}
                          onPress={() => displayProduct && navigation.navigate('ProductDetails', { productId: displayProduct.id })}
                        >
                          <Text style={[styles.offerBuyBtnText, { fontFamily: fonts.bold }]}>Buy Now</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
        {offers.length > 6 && (
          <TouchableOpacity
            style={[
              styles.offerCardViewAll,
              { backgroundColor: theme.bg.card, borderWidth: 1, borderColor: '#f1f5f9' }
            ]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Discounts')}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.brand[50], alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <ChevronRight size={24} color={theme.brand[500]} />
            </View>
            <Text style={{ fontFamily: fonts.bold, color: theme.text.primary, fontSize: 14 }}>
              View All
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  seeAllBtnText: {
    fontSize: 12,
    marginRight: 2,
  },
  offerCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    height: 124,
  },
  offerCardViewAll: {
    width: 120,
    height: 124,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginLeft: 4,
    marginBottom: 16,
    borderRadius: 16,
  },
  offerImageContainer: {
    width: 110,
    height: '100%',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  offerDiscountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderBottomRightRadius: 8,
  },
  offerDiscountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  offerInfoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  offerTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  offerDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  offerBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  offerOriginalPrice: {
    fontSize: 10,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  offerPrice: {
    fontSize: 14,
  },
  offerCartBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBuyBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 8,
  },
  offerBuyBtnText: {
    color: '#ffffff',
    fontSize: 12,
  },
});
