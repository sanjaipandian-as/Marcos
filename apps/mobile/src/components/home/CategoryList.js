import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LayoutGrid } from 'lucide-react-native';

export default function CategoryList({ categories, theme, fonts, shadows, navigation }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Categories
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Browse')}
          style={styles.seeAllBtn}
          activeOpacity={0.8}
        >
          <Text style={[styles.seeAllBtnText, { fontFamily: fonts.semiBold, color: theme.text.secondary }]}>
            View all
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesGrid}>
        {/* "All" Category Pill */}
        <TouchableOpacity
          style={[styles.categoryPill, { backgroundColor: theme.brand[50] }]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Browse')}
        >
          <Text style={[styles.categoryPillText, { fontFamily: fonts.bold, color: theme.brand[600] }]} numberOfLines={1}>
            All
          </Text>
          <View style={[styles.categoryPillImageContainer, { backgroundColor: '#ffffff' }]}>
            <LayoutGrid size={16} color={theme.brand[500]} />
          </View>
        </TouchableOpacity>

        {/* Category Icons */}
        {categories.slice(0, 5).map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryPill, { backgroundColor: theme.bg.card }, shadows.premium]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Browse', { categoryId: category.id })}
          >
            <Text style={[styles.categoryPillText, { fontFamily: fonts.semiBold, color: theme.text.primary }]} numberOfLines={1}>
              {category.name}
            </Text>
            <View style={styles.categoryPillImageContainer}>
              <Image
                source={{ uri: category.imageUrl || 'https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=100&q=80' }}
                style={styles.categoryPillImage}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
  },
  seeAllBtn: {
    paddingVertical: 4,
  },
  seeAllBtnText: {
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryPill: {
    width: '31.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 12,
    height: 48,
    marginBottom: 8,
  },
  categoryPillText: {
    fontSize: 12,
    flex: 1,
    marginRight: 4,
  },
  categoryPillImageContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  categoryPillImage: {
    width: '100%',
    height: '100%',
  },
});
