import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import SectionHeader from './SectionHeader';
import { CustomCartAddIcon, CustomCartAddedIcon } from '../CartIcons';

const { width: screenWidth } = Dimensions.get('window');

const TopSellingCard = memo(function TopSellingCard({ item, index, onShopPress, onAddToCart, inCart, theme, fonts, shadows }) {
  // Rank text (1, 2, 3...)
  const rank = index + 1;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onShopPress}
      style={[
        styles.cardContainer,
        { backgroundColor: theme.bg.card },
        shadows?.card
      ]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.images && item.images.length > 0 ? item.images[0] : null }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Circular ranking badge in top-left corner */}
        <View style={{
          position: 'absolute',
          top: 8,
          left: 8,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#D8BFD8',
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 2,
          shadowColor: '#101828',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}>
          <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: '#3D2E3D' }}>
            {rank}
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text.primary, fontFamily: fonts.bold }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.brand, { color: theme.text.secondary, fontFamily: fonts.regular }]} numberOfLines={1}>
            {item.brand}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View>
            <Text style={{ fontSize: 10, color: theme.text.secondary, marginBottom: 2 }}>Starts from</Text>
            <Text style={[styles.price, { color: '#3D2E3D', fontFamily: fonts.bold }]}>
              ₹{Math.round(Number(item.price))}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const TopSellingSection = memo(function TopSellingSection({
  title,
  products,
  onSeeAll,
  theme,
  fonts,
  shadows,
  navigation
}) {
  if (!products || products.length === 0) return null;

  const chunkArray = (arr, size) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  return (
    <View style={{ marginTop: 32, marginBottom: 16 }}>
      <SectionHeader
        title={title}
        onSeeAll={onSeeAll}
        theme={theme}
        fonts={fonts}
        showSeeAll={true}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={screenWidth * 0.85 + 16}
        decelerationRate="fast"
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 4 }}
      >
        {chunkArray(products, 2).map((chunk, chunkIdx) => (
          <View key={`chunk-${chunkIdx}`} style={{ width: screenWidth * 0.85, marginRight: 16, gap: 16 }}>
            {chunk.map((item, itemIdx) => {
              const absoluteIndex = chunkIdx * 2 + itemIdx;

              const handleShopPress = () => {
                navigation.navigate('ProductDetails', { productId: item.id });
              };

              return (
                <TopSellingCard
                  key={item.id}
                  item={item}
                  index={absoluteIndex}
                  onShopPress={handleShopPress}
                  theme={theme}
                  fonts={fonts}
                  shadows={shadows}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

export default TopSellingSection;

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: 140,
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 0,
  },
  imageContainer: {
    width: 140,
    height: '100%',
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 12,
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  brand: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  price: {
    fontSize: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
