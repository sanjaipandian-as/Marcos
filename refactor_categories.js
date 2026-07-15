const fs = require('fs');

let content = fs.readFileSync('apps/mobile/src/screens/shop/ProductsCatalogScreen.js', 'utf8');

// 1. Replace states
content = content.replace(
  /const \[selectedCategory, setSelectedCategory\] = useState\('All'\);\n\s*const \[activeFilterTab, setActiveFilterTab\] = useState\('Product'\);[\s\S]*?const \[selectedSubCategory, setSelectedSubCategory\] = useState\(null\);/,
  `const [categoryPath, setCategoryPath] = useState([]); // Stack of selected category objects
  const [activeFilterTab, setActiveFilterTab] = useState('Product');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('50000');
  const [absoluteMin, setAbsoluteMin] = useState(0);
  const [absoluteMax, setAbsoluteMax] = useState(50000);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeThumb, setActiveThumb] = useState('right');`
);

// 2. Remove the route params sync for categories (simplifying)
content = content.replace(
  /if \(route\?\.params\?\.categoryId\) \{[\s\S]*?setSelectedSubCategory\(route\.params\.subCategoryId\);\n\s*\}/,
  `// Drill-down category init can be handled here if needed`
);

// 3. Remove subCategories API call
content = content.replace(
  /\/\/ Fetch Subcategories when Category changes[\s\S]*?\}, \[selectedCategory\]\);/,
  ''
);

// Helper for Descendants
const helperFunc = `
  const getCategoryAndDescendantIds = (cat) => {
    let ids = new Set([cat.id]);
    if (cat.subCategories && cat.subCategories.length > 0) {
      cat.subCategories.forEach(sub => {
        const subIds = getCategoryAndDescendantIds(sub);
        subIds.forEach(id => ids.add(id));
      });
    }
    return ids;
  };
`;

content = content.replace(
  /const getFilteredProducts = \(\) => \{/,
  helperFunc + '\n  const getFilteredProducts = () => {'
);

// 4. Update getFilteredProducts
content = content.replace(
  /\/\/ Filter by Category[\s\S]*?\/\/ Filter by Price Range/,
  `// Filter by Drill-down Category
    if (categoryPath.length > 0) {
      const activeCat = categoryPath[categoryPath.length - 1];
      const validIds = getCategoryAndDescendantIds(activeCat);
      result = result.filter(product => validIds.has(product.categoryId));
    }

    // Filter by Price Range`
);

// 5. Update Recalculate price range
content = content.replace(
  /if \(selectedCategory !== 'All'\) \{\n\s*relevantProducts = products\.filter\(p => p\.categoryId === selectedCategory\);\n\s*\}/,
  `if (categoryPath.length > 0) {
      const activeCat = categoryPath[categoryPath.length - 1];
      const validIds = getCategoryAndDescendantIds(activeCat);
      relevantProducts = products.filter(p => validIds.has(p.categoryId));
    }`
);
content = content.replace(
  /\[selectedCategory, products\]\);/,
  `[categoryPath, products]);`
);


// 6. Replace Horizontal Scroll Categories UI
const horizontalCategoriesUI = `
            {/* Dynamic Drill-down Categories Horizontal Scroll */}
            <View style={{ marginBottom: 16 }}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
              >
                {categoryPath.length > 0 && (
                  <TouchableOpacity
                    style={[styles.subCategoryPill, { backgroundColor: theme.brand[50] }]}
                    onPress={() => setCategoryPath(prev => prev.slice(0, -1))}
                    activeOpacity={0.8}
                  >
                    <ChevronRight size={14} color="#6B4B6B" style={{ transform: [{ rotate: '180deg' }] }} />
                    <Text style={[styles.subCategoryText, { fontFamily: fonts.bold, color: '#6B4B6B', marginLeft: 4 }]}>
                      Back
                    </Text>
                  </TouchableOpacity>
                )}
                
                {(() => {
                  const currentList = categoryPath.length === 0 
                    ? categories 
                    : categoryPath[categoryPath.length - 1].subCategories || [];
                    
                  return currentList.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.subCategoryPill, { backgroundColor: theme.bg.card }]}
                      onPress={() => setCategoryPath(prev => [...prev, cat])}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.subCategoryText, { fontFamily: fonts.medium, color: theme.text.primary }]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ));
                })()}
              </ScrollView>
            </View>
`;

content = content.replace(
  /\{\/\* Subcategories Horizontal Scroll \*\/\}[\s\S]*?<\/ScrollView>\n\s*\)\}/,
  horizontalCategoriesUI
);

// Update Clear Filters button
content = content.replace(
  /setSelectedCategory\('All'\);\s*setSelectedSubCategory\(null\);/,
  `setCategoryPath([]);`
);


// 7. Replace Filter Modal UI
const modalCategoriesUI = `
                  <Text style={[styles.filterLabel, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                    Categories
                  </Text>
                  <View style={styles.filterTabsGrid}>
                    <TouchableOpacity
                      style={[
                        styles.filterTabPill,
                        categoryPath.length === 0 ? { backgroundColor: theme.brand[500] } : { backgroundColor: theme.bg.card }
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setCategoryPath([])}
                    >
                      <Text
                        style={[
                          styles.filterTabText,
                          { fontFamily: fonts.medium },
                          categoryPath.length === 0 ? { color: '#ffffff' } : { color: theme.text.primary }
                        ]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    
                    {categoryPath.length > 0 && (
                      <TouchableOpacity
                        style={[styles.filterTabPill, { backgroundColor: theme.brand[50] }]}
                        activeOpacity={0.8}
                        onPress={() => setCategoryPath(prev => prev.slice(0, -1))}
                      >
                        <Text style={[styles.filterTabText, { fontFamily: fonts.bold, color: '#6B4B6B' }]}>
                          ◀ Back
                        </Text>
                      </TouchableOpacity>
                    )}

                    {(() => {
                      const currentList = categoryPath.length === 0 
                        ? categories 
                        : categoryPath[categoryPath.length - 1].subCategories || [];
                        
                      return currentList.map(cat => (
                        <TouchableOpacity
                          key={cat.id}
                          style={[styles.filterTabPill, { backgroundColor: theme.bg.card }]}
                          activeOpacity={0.8}
                          onPress={() => setCategoryPath(prev => [...prev, cat])}
                        >
                          <Text style={[styles.filterTabText, { fontFamily: fonts.medium, color: theme.text.primary }]}>
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      ));
                    })()}
                  </View>
`;

content = content.replace(
  /<Text style=\{\[styles\.filterLabel, \{ fontFamily: fonts\.bold, color: theme\.text\.primary \}\]\}>\n\s*Category\n\s*<\/Text>\n\s*<View style=\{styles\.filterTabsGrid\}>[\s\S]*?\{\/\* Subcategories in Filter Modal \*\/\}[\s\S]*?<\/View>\n\s*\)\}/,
  modalCategoriesUI
);

fs.writeFileSync('apps/mobile/src/screens/shop/ProductsCatalogScreen.js', content);
console.log('Refactor complete');
