import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export default function SectionHeader({ title, onSeeAll, theme, fonts, showSeeAll = true }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
        {title}
      </Text>
      {showSeeAll && onSeeAll && (
        <TouchableOpacity
          onPress={onSeeAll}
          style={[styles.seeAllBtn, { backgroundColor: theme.brand[500] }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.seeAllBtnText, { fontFamily: fonts.bold, color: '#ffffff' }]}>
            SEE ALL
          </Text>
          <ChevronRight size={12} color="#ffffff" />
        </TouchableOpacity>
      )}
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
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  seeAllBtnText: {
    fontSize: 10,
    marginRight: 4,
    letterSpacing: 0.5,
  },
});
