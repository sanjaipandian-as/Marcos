import React, { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ShoppingBag, Sparkles, ExternalLink } from 'lucide-react-native';
import { CustomCartAddIcon, CustomCartAddedIcon } from '../CartIcons';
import SectionHeader from './SectionHeader';
import { useCachedVideoUrl } from '../../utils/useCachedVideoUrl';

function PromoReelItemCard({ promo, onVideoPress, onShopPress, onAddToCart, inCart, theme, fonts }) {
  const cachedUrl = useCachedVideoUrl(promo.videoUrl);
  
  const player = useVideoPlayer(cachedUrl || promo.videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (player) {
      player.loop = true;
      player.play();
    }
  }, [player]);

  return (
    <View style={styles.promoReelWrapper}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onVideoPress}
        style={[
          styles.promoReelCard,
          { backgroundColor: theme.bg.card }
        ]}
      >
        {/* Wrap video in pointerEvents="none" so it cannot steal touches on Android */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <VideoView
            player={player}
            style={styles.promoReelImage}
            nativeControls={false}
            contentFit="cover"
          />
        </View>

        {/* Dark gradient overlay covering the entire card to make white text pop */}
        <View style={styles.promoReelOverlayGradient} pointerEvents="none" />

        {/* Top Left Floating Badge */}
        <View style={styles.promoReelTopLeft} pointerEvents="none">
          <Text style={[styles.promoReelTopLeftText, { fontFamily: fonts.bold }]}>
            {(promo.linkType === 'PRODUCT' || promo.linkType === 'BOTH') ? 'Shop Reel' : 'Promo'}
          </Text>
        </View>

        {/* Bottom Info Overlay */}
        <View style={[styles.promoReelBottomInfo, { paddingBottom: 40 }]} pointerEvents="none">
          {/* Title & Description */}
          <Text style={[styles.promoReelTitleText, { fontFamily: fonts.bold }]} numberOfLines={1}>
            {promo.title}
          </Text>
          {promo.description && (
            <Text style={[styles.promoReelDescText, { fontFamily: fonts.regular }]} numberOfLines={2}>
              {promo.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Floating Tinder-style Action Buttons row overlapping the bottom edge of the card */}
      <View style={styles.promoReelFloatingActions}>
        {/* Shopping Button (Tinder Flame style - Solid Background) */}
        <TouchableOpacity
          style={[styles.promoReelActionRoundBtnLarge, { backgroundColor: theme.brand[500] }]}
          activeOpacity={0.8}
          onPress={onShopPress}
        >
          {(promo.linkType === 'PRODUCT' || promo.linkType === 'BOTH') ? (
            <ShoppingBag size={24} color="#ffffff" />
          ) : (
            <Sparkles size={24} color="#ffffff" />
          )}
        </TouchableOpacity>

        {/* Add to Cart Button (Only if linked to a specific product) - White Button */}
        {(promo.linkType === 'PRODUCT' || promo.linkType === 'BOTH') && promo.productId && (
          <TouchableOpacity
            style={[styles.promoReelActionRoundBtnLarge, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' }]}
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

        {/* External Link Button (Only if BOTH and has external URL) */}
        {promo.linkType === 'BOTH' && promo.externalUrl && (
          <TouchableOpacity
            style={[styles.promoReelActionRoundBtnLarge, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' }]}
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

export default function PromoReelsSection({ promos, cartItems, navigation, theme, fonts, handleAddToCart }) {
  if (!promos || promos.length === 0) return null;

  return (
    <View style={{ marginBottom: 16 }}>
      <SectionHeader
        title="Explore & Discover"
        theme={theme}
        fonts={fonts}
        showSeeAll={false}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
        {promos.map((promo, index) => {
          const handleVideoPress = () => {
            navigation.navigate('Reels', { promos, initialIndex: index });
          };

          const handleShopPress = () => {
            if ((promo.linkType === 'PRODUCT' || promo.linkType === 'BOTH') && promo.productId) {
              navigation.navigate('ProductDetails', { productId: promo.productId });
            } else if (promo.linkType === 'EXTERNAL' && promo.externalUrl) {
              Linking.openURL(promo.externalUrl).catch(() => {});
            }
          };

          const inCart = promo.productId ? cartItems.has(promo.productId) : false;
          
          const handleCartAction = () => {
            if (!promo.productId) return;
            if (inCart) {
              navigation.navigate('Cart');
            } else {
              handleAddToCart(promo.productId);
            }
          };

          return (
            <PromoReelItemCard
              key={promo.id}
              promo={promo}
              onVideoPress={handleVideoPress}
              onShopPress={handleShopPress}
              onAddToCart={handleCartAction}
              inCart={inCart}
              theme={theme}
              fonts={fonts}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  promoReelWrapper: {
    width: 300,
    height: 460, // Total space reserved (card + floating buttons)
  },
  promoReelCard: {
    width: '100%',
    height: 420, // Base card height without buttons
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  promoReelImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  promoReelOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)', // Smooth darkening to make text readable
  },
  promoReelTopLeft: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  promoReelTopLeftText: {
    color: '#ffffff',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promoReelBottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  promoReelTitleText: {
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  promoReelDescText: {
    fontSize: 12,
    color: '#f8fafc',
    opacity: 0.9,
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  promoReelFloatingActions: {
    position: 'absolute',
    bottom: 14, // Centered on the bottom edge of the card
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  promoReelActionRoundBtnLarge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});
