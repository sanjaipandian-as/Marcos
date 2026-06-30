import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  StatusBar
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { useVideoPlayer, VideoView } from 'expo-video';
import api from '../../utils/api';
import {
  ShoppingBag,
  Sparkles,
  ExternalLink,
  ChevronLeft
} from 'lucide-react-native';
import { CustomCartAddIcon, CustomCartAddedIcon } from '../../components/CartIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

import { useCachedVideoUrl } from '../../utils/useCachedVideoUrl';

// Individual Full Screen Reel Item
function FullScreenReelItem({ promo, isActive, inCart, onAddToCart, onShopPress, theme, fonts, insets }) {
  const player = useVideoPlayer(promo.videoUrl, (p) => {
    p.loop = true;
  });

  // Play/Pause based on whether this item is currently focused on screen
  useEffect(() => {
    if (player) {
      player.loop = true;
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, player]);

  return (
    <View style={[styles.reelContainer, { height }]}>
      {/* Video Player */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={false}
        contentFit="cover"
      />

      {/* Dark overlay for text readability at the bottom */}
      <View style={styles.overlayGradient} />

      {/* Bottom Info Section */}
      <View style={[styles.bottomInfo, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { fontFamily: fonts.bold }]} numberOfLines={2}>
            {promo.title}
          </Text>
          {promo.description && (
            <Text style={[styles.description, { fontFamily: fonts.regular }]} numberOfLines={3}>
              {promo.description}
            </Text>
          )}
        </View>
      </View>

      {/* Floating Action Buttons Column (Right Side) */}
      <View style={[styles.actionsColumn, { bottom: Math.max(insets.bottom + 20, 40) }]}>
        
        {/* Shop Button */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.brand[500] }]}
          activeOpacity={0.8}
          onPress={onShopPress}
        >
          {(promo.linkType === 'PRODUCT' || promo.linkType === 'BOTH') ? (
            <ShoppingBag size={24} color="#ffffff" />
          ) : (
            <Sparkles size={24} color="#ffffff" />
          )}
        </TouchableOpacity>

        {/* Add to Cart Button */}
        {(promo.linkType === 'PRODUCT' || promo.linkType === 'BOTH') && promo.productId && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ffffff' }]}
            activeOpacity={0.8}
            onPress={onAddToCart}
          >
            {inCart ? (
              <CustomCartAddedIcon color={theme.brand[500]} size={24} />
            ) : (
              <CustomCartAddIcon color={theme.brand[500]} size={24} />
            )}
          </TouchableOpacity>
        )}

        {/* External Link Button */}
        {promo.linkType === 'BOTH' && promo.externalUrl && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ffffff' }]}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(promo.externalUrl).catch(() => {})}
          >
            <ExternalLink size={24} color={theme.text.secondary} />
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}

export default function ReelsScreen({ route, navigation }) {
  const { promos = [], initialIndex = 0 } = route.params || {};
  const { theme, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [cartItems, setCartItems] = useState(new Set());
  const flatListRef = useRef(null);

  useEffect(() => {
    // Hide status bar when Reels screen opens for full immersion
    StatusBar.setHidden(true, 'fade');
    fetchCart();
    return () => {
      // Restore status bar on exit
      StatusBar.setHidden(false, 'fade');
    };
  }, []);

  const fetchCart = async () => {
    try {
      const res = await api.get('/products/cart');
      if (res.success) {
        const cartSet = new Set((res.data || []).map(item => item.productId));
        setCartItems(cartSet);
      }
    } catch (err) {
      console.log('Error fetching cart:', err);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const inCart = cartItems.has(productId);
      if (inCart) {
        navigation.navigate('Cart');
        return;
      }
      
      const res = await api.post('/products/cart', { productId, quantity: 1 });
      if (res.success) {
        setCartItems(prev => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <FlatList
        ref={flatListRef}
        data={promos}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const handleShopPress = () => {
            if ((item.linkType === 'PRODUCT' || item.linkType === 'BOTH') && item.productId) {
              navigation.navigate('ProductDetails', { productId: item.productId });
            } else if (item.linkType === 'EXTERNAL' && item.externalUrl) {
              Linking.openURL(item.externalUrl).catch(() => {});
            }
          };

          return (
            <FullScreenReelItem
              promo={item}
              isActive={index === activeIndex}
              inCart={cartItems.has(item.productId)}
              onAddToCart={() => handleAddToCart(item.productId)}
              onShopPress={handleShopPress}
              theme={theme}
              fonts={fonts}
              insets={insets}
            />
          );
        }}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
      />

      {/* Back Button Floating on Top Left */}
      <TouchableOpacity
        style={[styles.backBtn, { top: Math.max(insets.top + 10, 20) }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <ChevronLeft size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  reelContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  overlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 80, // Leave room for actions column
    paddingHorizontal: 20,
    zIndex: 10,
  },
  textContainer: {
    justifyContent: 'flex-end',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  description: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  actionsColumn: {
    position: 'absolute',
    right: 16,
    alignItems: 'center',
    gap: 20,
    zIndex: 20,
  },
  actionBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  }
});
