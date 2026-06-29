import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import SectionHeader from './SectionHeader';

export default function ProductGridSection({
  title,
  products,
  type = 'grid', // 'grid' | 'horizontal'
  onSeeAll,
  renderProductCard,
  theme,
  fonts,
  shadows,
  buttonTitle = 'View All',
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
    <View style={{ marginBottom: 16 }}>
      <SectionHeader
        title={title}
        onSeeAll={onSeeAll}
        theme={theme}
        fonts={fonts}
        showSeeAll={type !== 'grid'} // For grid, we have a giant button at the bottom
      />
      
      {type === 'grid' ? (
        <View style={styles.gridContainer}>
          {products.map((item) => renderProductCard(item, false))}
          {products.length > 0 && onSeeAll && (
            <TouchableOpacity
              style={[
                styles.gridSeeAllBtn,
                { backgroundColor: theme.brand[500] },
                shadows.premium
              ]}
              activeOpacity={0.8}
              onPress={onSeeAll}
            >
              <Text style={{ color: '#ffffff', fontFamily: fonts.bold, fontSize: 14, marginRight: 6 }}>
                {buttonTitle}
              </Text>
              <ChevronRight size={18} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      ) : type === 'horizontal-grid' ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={Dimensions.get('window').width}
          decelerationRate="fast"
        >
          {chunkArray(products, 4).map((chunk, chunkIdx) => (
            <View key={`chunk-${chunkIdx}`} style={{ width: Dimensions.get('window').width }}>
              <View style={styles.gridContainer}>
                {chunk.map(item => renderProductCard(item, false))}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
          {products.map((item) => renderProductCard(item, true))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  gridSeeAllBtn: {
    width: '100%',
    marginHorizontal: 0,
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalSeeAllBtn: {
    width: 160,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  horizontalSeeAllIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
