import React, { memo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, useWindowDimensions } from 'react-native';

const BannerCarousel = memo(function BannerCarousel({ banners, categories, theme, fonts, navigation }) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const cardWidth = width - 40;
  const cardGap = 12;
  const snapInterval = cardWidth + cardGap;

  const displayBanners = banners && banners.length > 0 ? banners : [
    {
      id: 'fallback-1',
      title: 'Get Your\nSpecial Sale\nUp to 40%',
      imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    }
  ];

  // Auto-slide banners every 3.5 seconds
  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % displayBanners.length;
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: nextIndex * snapInterval,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [displayBanners.length, snapInterval]);

  const handleScroll = (event) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / snapInterval);
    if (index >= 0 && index < displayBanners.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.bannerSliderContent, { gap: cardGap }]}
      >
        {displayBanners.map((banner, index) => (
          <TouchableOpacity
            key={banner.id || index}
            style={[styles.bannerCard, { backgroundColor: theme.brand[500], width: cardWidth }]}
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
                <Text style={[styles.bannerBtnText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
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

      {/* Animated Pagination Indicators */}
      {displayBanners.length > 1 && (
        <View style={styles.paginationContainer}>
          {displayBanners.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: isActive ? theme.brand[500] : theme.border },
                  isActive && styles.activeDot,
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
});

export default BannerCarousel;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  bannerSliderContent: {
    paddingHorizontal: 20,
  },
  bannerCard: {
    borderRadius: 20,
    flexDirection: 'row',
    height: 160,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  bannerLeft: {
    flex: 1,
    padding: 22,
    justifyContent: 'center',
  },
  bannerTitleText: {
    fontSize: 22,
    color: '#3D2E3D',
    lineHeight: 28,
    marginBottom: 14,
  },
  bannerBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    fontSize: 12,
  },
  bannerRight: {
    width: '45%',
    height: '100%',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    height: 6,
    borderRadius: 3,
  },
});
