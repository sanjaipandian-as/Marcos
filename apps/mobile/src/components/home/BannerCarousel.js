import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, useWindowDimensions } from 'react-native';

export default function BannerCarousel({ banners, categories, theme, fonts, navigation }) {
  const { width } = useWindowDimensions();

  if (banners && banners.length > 0) {
    return (
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.bannerSlider}
        contentContainerStyle={styles.bannerSliderContent}
      >
        {banners.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            style={[styles.bannerCard, { backgroundColor: theme.brand[500], width: width - 40 }]}
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
                <Text style={[styles.bannerBtnText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
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
    );
  }

  // Fallback banner if empty
  return (
    <TouchableOpacity
      style={[styles.bannerCard, { backgroundColor: theme.brand[500] }]}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Browse')}
    >
      <View style={styles.bannerLeft}>
        <Text style={[styles.bannerTitleText, { fontFamily: fonts.bold }]}>
          Get Your{'\n'}Special Sale{'\n'}Up to 40%
        </Text>
        <TouchableOpacity style={styles.bannerBtn} onPress={() => navigation.navigate('Browse')}>
          <Text style={[styles.bannerBtnText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
            Shop Now
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bannerRight}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80' }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bannerSlider: {
    marginBottom: 20,
  },
  bannerSliderContent: {
    paddingHorizontal: 20,
    gap: 16,
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
    padding: 24,
    justifyContent: 'center',
  },
  bannerTitleText: {
    fontSize: 24,
    color: '#ffffff',
    lineHeight: 32,
    marginBottom: 16,
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
});
