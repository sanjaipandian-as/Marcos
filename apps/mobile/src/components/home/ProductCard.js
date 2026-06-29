import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Heart } from 'lucide-react-native';
import { CustomCartAddIcon, CustomCartAddedIcon } from '../CartIcons';

export default function ProductCard({
  item,
  isHorizontal = false,
  isFav,
  inCart,
  theme,
  fonts,
  shadows,
  navigation,
  toggleFavorite,
  handleAddToCart,
}) {
  const originalPrice = item.price === "item.price" ? (item.originalPrice ? Number(item.originalPrice) : null) : (typeof product !== "undefined" && product.originalPrice ? Number(product.originalPrice) : (typeof item !== "undefined" && item.originalPrice ? Number(item.originalPrice) : null));

  return (
    <TouchableOpacity
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
        {item.hasFreeShipping && (
          <View style={styles.freeShippingBadge}>
            <Text style={styles.freeShippingText}>Free Shipping</Text>
          </View>
        )}
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
}

const styles = StyleSheet.create({
  productCard: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '47%',
    marginBottom: 16,
  },
  productImageWrapper: {
    position: 'relative',
    height: 160,
    backgroundColor: '#f1f5f9',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  freeShippingBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 8,
  },
  freeShippingText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    marginBottom: 6,
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
    fontSize: 15,
  },
  originalPriceText: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  cartBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
