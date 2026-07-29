import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Platform,
  StatusBar,
  ScrollView,
  Keyboard,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import WishlistIcon from '../../components/common/WishlistIcon';
import { 
  ArrowLeft, 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  ChevronRight, 
  Sparkles
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 40 - CARD_GAP) / 2; // 40 = 20px padding left + 20px padding right

const RECENT_SEARCHES_KEY = 'marcos_recent_searches_list';
const POPULAR_TAGS = ['Tuxedo', 'Sherwani', 'Velvet Suit', 'Silk Shirt', 'Overcoat', 'Linen Blazer', 'Kurtas', 'Accessories'];

export default function SearchScreen({ navigation, route }) {
  const { theme, fonts, shadows } = useTheme();
  const inputRef = useRef(null);

  const [query, setQuery] = useState(route.params?.initialQuery || '');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load initial products, categories & recent search history
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, favRes, storedRecent] = await Promise.all([
          api.get('/products?limit=100').catch(() => ({ success: false, data: [] })),
          api.get('/categories').catch(() => ({ success: false, data: [] })),
          api.get('/products/favorites').catch(() => ({ success: false, data: [] })),
          AsyncStorage.getItem(RECENT_SEARCHES_KEY).catch(() => null),
        ]);

        if (prodRes.success && Array.isArray(prodRes.data)) {
          setProducts(prodRes.data);
        }
        if (catRes.success && Array.isArray(catRes.data)) {
          setCategories(catRes.data);
        }
        if (favRes.success && Array.isArray(favRes.data)) {
          setFavorites(new Set(favRes.data.map((item) => item.productId)));
        }
        if (storedRecent) {
          try {
            setRecentSearches(JSON.parse(storedRecent));
          } catch (e) {}
        }
      } catch (err) {
        console.error('Search init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();

    // Auto-focus input on mount
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  const saveRecentSearch = async (searchTerm) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    try {
      const filtered = recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving recent search:', e);
    }
  };

  const removeRecentSearch = async (searchTerm) => {
    try {
      const updated = recentSearches.filter((s) => s !== searchTerm);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error removing recent search:', e);
    }
  };

  const clearAllRecent = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {}
  };

  const toggleFavorite = async (productId) => {
    try {
      const isFav = favorites.has(productId);
      if (isFav) {
        await api.delete(`/products/favorites/${productId}`);
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await api.post('/products/favorites', { productId });
        setFavorites((prev) => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const cleanQuery = query.trim().toLowerCase();

  // client-side singular/plural match query helper
  const matchQuery = (text, queryStr) => {
    if (!text || !queryStr) return false;
    const t = text.toLowerCase().trim();
    const q = queryStr.toLowerCase().trim();
    if (t.includes(q) || q.includes(t)) return true;
    
    const stripPlural = (str) => {
      if (str.endsWith('es') && str.length > 4) return str.slice(0, -2);
      if (str.endsWith('s') && !str.endsWith('ss') && str.length > 2) return str.slice(0, -1);
      return str;
    };
    
    const tSingular = stripPlural(t);
    const qSingular = stripPlural(q);
    
    return tSingular.includes(qSingular) || qSingular.includes(tSingular);
  };

  // Debounced live suggestions from backend
  useEffect(() => {
    const cleanQ = query.trim();
    if (!cleanQ) {
      setSuggestions([]);
      return;
    }
    
    if (isSubmitted) return;

    const delayDebounce = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(cleanQ)}&limit=8`);
        if (res.success && Array.isArray(res.data)) {
          setSuggestions(res.data);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Suggestions fetch error:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, isSubmitted]);

  // Matching categories using the client-side smart matchQuery helper
  const matchingCategories = useMemo(() => {
    if (!cleanQuery) return [];
    return categories.filter((c) => c.name && matchQuery(c.name, cleanQuery)).slice(0, 3);
  }, [categories, cleanQuery]);

  // Fetch full search results from backend
  const performSearch = async (searchTerm) => {
    const term = searchTerm.trim();
    if (!term) return;
    setSearchLoading(true);
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(term)}&limit=100`);
      if (res.success && Array.isArray(res.data)) {
        setSearchResults(res.data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search query error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Relevant Recommendations fallback when 0 results or default view
  const relevantRecommendations = useMemo(() => {
    return products.filter((p) => p.isTrending || p.price > 10000).slice(0, 6);
  }, [products]);

  const handleSearchSubmit = (searchTerm) => {
    const term = searchTerm !== undefined ? searchTerm : query;
    if (!term.trim()) return;
    setQuery(term);
    setIsSubmitted(true);
    saveRecentSearch(term);
    Keyboard.dismiss();
    performSearch(term);
  };

  const handleSelectSuggestion = (item) => {
    saveRecentSearch(item.name);
    navigation.navigate('ProductDetails', { productId: item.id });
  };

  const renderSuggestionItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.suggestionRow, { borderBottomColor: theme.border }]}
        activeOpacity={0.7}
        onPress={() => handleSelectSuggestion(item)}
      >
        <Image
          source={{ uri: (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=100&q=80' }}
          style={styles.suggestionThumb}
        />
        <View style={styles.suggestionMeta}>
          <Text style={[styles.suggestionTitle, { fontFamily: fonts.bold, color: theme.brand[900] }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.suggestionSub, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
              ₹{Number(item.price).toLocaleString('en-IN')}
            </Text>
            {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
              <Text style={[styles.suggestionOriginalPrice, { fontFamily: fonts.medium }]}>
                ₹{Number(item.originalPrice).toLocaleString('en-IN')}
              </Text>
            )}
          </View>
        </View>
        <ChevronRight size={18} color={theme.text.muted} />
      </TouchableOpacity>
    );
  };

  const renderGridProductCard = ({ item }) => {
    const isFav = favorites.has(item.id);
    const originalPrice = item?.originalPrice ? Number(item.originalPrice) : null;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.gridCard,
          shadows.premium,
          { width: CARD_WIDTH, backgroundColor: theme.bg.card, borderColor: theme.border }
        ]}
        onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
        activeOpacity={0.9}
      >
        <View style={[styles.gridImgWrapper, { backgroundColor: theme.bg.hover }]}>
          <Image
            source={{ uri: (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&q=80' }}
            style={styles.gridImg}
            resizeMode="cover"
          />

          <TouchableOpacity
            style={styles.gridFavBtn}
            onPress={() => toggleFavorite(item.id)}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <WishlistIcon
              size={15}
              color={isFav ? '#ef4444' : theme.brand[900]}
              fill={isFav ? '#ef4444' : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.gridInfo}>
          <Text style={[styles.gridTitle, { fontFamily: fonts.bold, color: theme.brand[900] }]} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.gridPriceRow}>
            <Text style={[styles.gridPrice, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
              ₹{Number(item.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            {originalPrice ? (
              <Text style={[styles.gridOriginalPrice, { fontFamily: fonts.medium }]}>
                ₹{originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const topStatusBarPadding = Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 38);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {/* Header Search Input Bar */}
      <View style={[styles.header, { paddingTop: topStatusBarPadding, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.bg.card, borderColor: theme.border }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={theme.brand[900]} />
        </TouchableOpacity>

        <View style={[styles.searchInputContainer, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
          <Search size={18} color={theme.brand[600]} style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { fontFamily: fonts.medium, color: theme.brand[900] }]}
            placeholder="Search suits, tuxedos, sherwanis..."
            placeholderTextColor="#9e9e9e"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setIsSubmitted(false);
            }}
            onSubmitEditing={() => handleSearchSubmit()}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setIsSubmitted(false);
                if (inputRef.current) inputRef.current.focus();
              }}
              style={{ padding: 4 }}
            >
              <X size={16} color={theme.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* BODY CONTENT */}
      {loading || searchLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.brand[500]} />
        </View>
      ) : isSubmitted ? (
        /* SUBMITTED GRID RESULTS VIEW */
        <View style={{ flex: 1 }}>
          <View style={styles.resultsSummaryRow}>
            <Text style={[styles.resultsCountText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
              {searchResults.length} Relevant Products found for "{query}"
            </Text>
          </View>

          {searchResults.length === 0 ? (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyTitle, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
                  No direct matches for "{query}"
                </Text>
                <Text style={[styles.emptySub, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
                  Explore relevant bespoke collections and trending items below.
                </Text>
              </View>

              {/* RELEVANT PRODUCTS RECOMMENDATIONS */}
              <View style={{ paddingHorizontal: 20, marginTop: 10, paddingBottom: 40 }}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionHeading, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
                    RELEVANT PRODUCTS YOU MAY LIKE
                  </Text>
                  <Sparkles size={16} color={theme.brand[500]} />
                </View>

                <View style={styles.gridRowWrap}>
                  {relevantRecommendations.map((item) => renderGridProductCard({ item }))}
                </View>
              </View>
            </ScrollView>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderGridProductCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.gridPadding}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : cleanQuery.length > 0 ? (
        /* LIVE AUTO-SUGGESTIONS LIST VIEW AS USER TYPES */
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Submit Search Prompt Pill */}
          <TouchableOpacity
            style={[styles.searchQueryPromptRow, { backgroundColor: theme.brand[50], borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={() => handleSearchSubmit()}
          >
            <Search size={16} color={theme.brand[600]} style={{ marginRight: 10 }} />
            <Text style={[styles.searchQueryPromptText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
              Search for "{query}"
            </Text>
            <ChevronRight size={16} color={theme.brand[600]} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {/* Matching Categories Header */}
          {matchingCategories.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginVertical: 12 }}>
              <Text style={[styles.sectionHeading, { fontFamily: fonts.bold, color: theme.text.secondary }]}>
                CATEGORIES
              </Text>
              {matchingCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categorySuggestionRow, { borderBottomColor: theme.border }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    navigation.navigate('Browse', { categoryId: cat.id });
                  }}
                >
                  <Text style={[styles.categorySuggestionText, { fontFamily: fonts.semiBold, color: theme.brand[900] }]}>
                    In <Text style={{ fontFamily: fonts.bold, color: theme.brand[600] }}>{cat.name}</Text>
                  </Text>
                  <ChevronRight size={16} color={theme.text.muted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Matching Live Product Name Suggestions */}
          <View style={{ paddingHorizontal: 20, marginTop: 10, paddingBottom: 40 }}>
            <Text style={[styles.sectionHeading, { fontFamily: fonts.bold, color: theme.text.secondary }]}>
              {suggestionsLoading ? 'SUGGESTIONS (LOADING...)' : `SUGGESTIONS (${suggestions.length})`}
            </Text>

            {suggestionsLoading ? (
              <ActivityIndicator size="small" color={theme.brand[500]} style={{ marginVertical: 20 }} />
            ) : suggestions.length === 0 ? (
              <View style={{ paddingVertical: 20 }}>
                <Text style={{ fontFamily: fonts.regular, color: theme.text.muted, fontSize: 13 }}>
                  No product names match "{query}". Press enter to see full results.
                </Text>
              </View>
            ) : (
              suggestions.map((item) => (
                <View key={item.id}>
                  {renderSuggestionItem({ item })}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      ) : (
        /* DEFAULT STATE: RECENT SEARCHES, POPULAR TAGS & RELEVANT PRODUCTS */
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={{ paddingHorizontal: 20, marginTop: 18, marginBottom: 20 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
                  RECENT SEARCHES
                </Text>
                <TouchableOpacity onPress={clearAllRecent} activeOpacity={0.7}>
                  <Text style={{ fontFamily: fonts.semiBold, fontSize: 12, color: theme.brand[600] }}>
                    Clear All
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chipsWrap}>
                {recentSearches.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={[styles.recentChip, { backgroundColor: theme.bg.card, borderColor: theme.border }]}
                    activeOpacity={0.8}
                    onPress={() => handleSearchSubmit(term)}
                  >
                    <Clock size={13} color={theme.text.secondary} style={{ marginRight: 6 }} />
                    <Text style={[styles.recentChipText, { fontFamily: fonts.medium, color: theme.brand[900] }]}>
                      {term}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeRecentSearch(term)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ marginLeft: 6 }}
                    >
                      <X size={13} color={theme.text.muted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Popular Trending Tags */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
                POPULAR SEARCHES
              </Text>
              <TrendingUp size={16} color={theme.brand[500]} />
            </View>

            <View style={styles.chipsWrap}>
              {POPULAR_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.popularTagPill, { backgroundColor: theme.bg.hover, borderColor: theme.border }]}
                  activeOpacity={0.8}
                  onPress={() => handleSearchSubmit(tag)}
                >
                  <Text style={[styles.popularTagText, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* RELEVANT FEATURED PRODUCTS */}
          <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { fontFamily: fonts.bold, color: theme.brand[900] }]}>
                RELEVANT FOR YOU
              </Text>
              <Sparkles size={16} color={theme.brand[500]} />
            </View>

            <View style={styles.gridRowWrap}>
              {relevantRecommendations.map((item) => renderGridProductCard({ item }))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchInputContainer: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  recentChipText: {
    fontSize: 12.5,
  },
  popularTagPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  popularTagText: {
    fontSize: 12.5,
  },
  searchQueryPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchQueryPromptText: {
    fontSize: 13.5,
  },
  categorySuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categorySuggestionText: {
    fontSize: 13.5,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  suggestionThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  suggestionMeta: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  suggestionTitle: {
    fontSize: 13.5,
  },
  suggestionSub: {
    fontSize: 13,
  },
  suggestionOriginalPrice: {
    fontSize: 11,
    color: '#B8A8B8',
    textDecorationLine: 'line-through',
  },
  resultsSummaryRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  resultsCountText: {
    fontSize: 14,
    lineHeight: 18,
  },
  gridPadding: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gridImgWrapper: {
    position: 'relative',
    height: 185,
    width: '100%',
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  gridFavBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  gridInfo: {
    padding: 10,
    gap: 3,
  },
  gridTitle: {
    fontSize: 13,
    lineHeight: 17,
  },
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  gridPrice: {
    fontSize: 14,
  },
  gridOriginalPrice: {
    fontSize: 11,
    color: '#B8A8B8',
    textDecorationLine: 'line-through',
  },
  emptyContainer: {
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
