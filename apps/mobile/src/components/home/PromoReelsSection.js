import React, { useEffect, useRef, useState, memo } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Linking, Image, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import { ShoppingBag, Sparkles, ExternalLink, Play } from 'lucide-react-native';
import WishlistIcon from '../common/WishlistIcon';
import SectionHeader from './SectionHeader';
import { useCachedVideoUrl } from '../../utils/useCachedVideoUrl';

const PromoReelItemCard = memo(function PromoReelItemCard({ promo, onVideoPress, onShopPress, onToggleFav, isFav, theme, fonts, isActive }) {
  const isMounted = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Cache the video URL!
  const cachedVideoUrl = useCachedVideoUrl(promo.videoUrl);

  const player = useVideoPlayer(cachedVideoUrl || promo.videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    if (isActive) {
      p.play();
    }
  });

  // Listen to status changes of the player
  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status === 'readyToPlay') {
      setIsReady(true);
      setHasError(false);
      if (isActive) {
        player.play();
      }
    } else if (status === 'error') {
      setHasError(true);
      console.warn('Video load error in PromoReelItemCard:', error);
    }
  });

  // Dynamically play/pause based on active/inactive status
  useEffect(() => {
    if (!player) return;
    if (isActive) {
      if (player.status === 'readyToPlay') {
        player.play();
      }
    } else {
      player.pause();
    }
  }, [isActive, player]);

  // Keep player source updated if cached URL finishes downloading
  useEffect(() => {
    if (player && cachedVideoUrl) {
      try {
        player.replaceAsync(cachedVideoUrl);
        if (isActive) {
          player.play();
        }
      } catch (e) {
        console.warn('Error replacing player source with cached URL:', e);
      }
    }
  }, [player, cachedVideoUrl, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      try {
        player?.pause();
      } catch (_) {}
    };
  }, [player]);

  const fallbackThumbnail = promo.thumbnailUrl || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&q=80';

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
        {/* Thumbnail Background (always rendered as background/placeholder) */}
        <Image
          source={{ uri: fallbackThumbnail }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        {/* Video Player - Only show when ready and active */}
        {isActive && isReady && !hasError && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <VideoView
              player={player}
              style={styles.promoReelImage}
              nativeControls={false}
              contentFit="cover"
            />
          </View>
        )}

        {/* Loading Spinner / Placeholder when active but not ready */}
        {isActive && !isReady && !hasError && (
          <View style={styles.loaderOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={theme.brand[500]} />
          </View>
        )}

        {/* Soft Play Overlay to indicate playable media if not playing */}
        {(!isActive || !isReady) && (
          <View style={styles.playButtonOverlay} pointerEvents="none">
            <View style={styles.playButtonCircle}>
              <Play size={20} color="#ffffff" fill="#ffffff" style={{ marginLeft: 3 }} />
            </View>
          </View>
        )}

        {/* Dark gradient overlay */}
        <View style={styles.promoReelOverlayGradient} pointerEvents="none" />

        {/* Top Left Floating Badge */}
        <View style={styles.promoReelTopLeft} pointerEvents="none">
          <Text style={[styles.promoReelTopLeftText, { fontFamily: fonts.bold }]}>
            {(promo.linkType === 'PRODUCT' || promo.linkType === 'BOTH') ? 'Shop Reel' : 'Promo'}
          </Text>
        </View>

        {/* Bottom Info Overlay */}
        <View style={[styles.promoReelBottomInfo, { paddingBottom: 40 }]} pointerEvents="none">
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

      {/* Floating Action Buttons row */}
      <View style={styles.promoReelFloatingActions}>
        {/* Shopping Button */}
        <TouchableOpacity
          style={[styles.promoReelActionRoundBtnLarge, { backgroundColor: theme.brand[500] }]}
          activeOpacity={0.8}
          onPress={onShopPress}
        >
          {(promo.linkType === 'PRODUCT' || promo.linkType === 'BOTH') ? (
            <ShoppingBag size={24} color={theme.brand[900]} />
          ) : (
            <Sparkles size={24} color={theme.brand[900]} />
          )}
        </TouchableOpacity>

        {/* Wishlist Button (Only if linked to a specific product) */}
        {(promo.linkType === 'PRODUCT' || promo.linkType === 'BOTH') && promo.productId && (
          <TouchableOpacity
            style={[styles.promoReelActionRoundBtnLarge, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={onToggleFav}
          >
            <WishlistIcon
              size={22}
              color={isFav ? '#ef4444' : theme.brand[900]}
              fill={isFav ? '#ef4444' : 'transparent'}
            />
          </TouchableOpacity>
        )}

        {/* External Link Button */}
        {promo.linkType === 'BOTH' && promo.externalUrl && (
          <TouchableOpacity
            style={[styles.promoReelActionRoundBtnLarge, { backgroundColor: '#ffffff', borderWidth: 1, borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(promo.externalUrl).catch(() => {})}
          >
            <ExternalLink size={24} color={theme.text.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const PromoReelsSection = memo(function PromoReelsSection({ promos, favorites, toggleFavorite, navigation, theme, fonts }) {
  if (!promos || promos.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / 314); // 300 (card width) + 14 (gap)
    if (index !== activeIndex && index >= 0 && index < promos.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <SectionHeader
        title="Explore & Discover"
        theme={theme}
        fonts={fonts}
        showSeeAll={false}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
        snapToInterval={314}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
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

          const isFav = promo.productId ? (favorites ? favorites.has(promo.productId) : false) : false;
          
          const handleWishlistAction = () => {
            if (!promo.productId) return;
            toggleFavorite(promo.productId);
          };

          return (
            <PromoReelItemCard
              key={promo.id}
              promo={promo}
              onVideoPress={handleVideoPress}
              onShopPress={handleShopPress}
              onToggleFav={handleWishlistAction}
              isFav={isFav}
              theme={theme}
              fonts={fonts}
              isActive={index === activeIndex}
            />
          );
        })}
      </ScrollView>
    </View>
  );
});

export default PromoReelsSection;

const styles = StyleSheet.create({
  promoReelWrapper: {
    width: 300,
    height: 460,
  },
  promoReelCard: {
    width: '100%',
    height: 420,
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
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  playButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
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
    bottom: 14,
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
