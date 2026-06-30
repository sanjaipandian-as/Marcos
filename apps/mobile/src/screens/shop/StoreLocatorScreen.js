import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  Linking,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  AlertTriangle,
  Locate,
  ExternalLink,
  Store,
  ChevronRight,
  Star,
  Route,
  Compass,
  RefreshCw,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.42;
const CARD_WIDTH = width * 0.82;

// Haversine Formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Check if store is currently open
function isStoreOpen(openingHours, closingHours) {
  try {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = openingHours.split(':').map(Number);
    const [closeH, closeM] = closingHours.split(':').map(Number);

    const openTime = openH * 60 + (openM || 0);
    const closeTime = closeH * 60 + (closeM || 0);

    return currentTime >= openTime && currentTime <= closeTime;
  } catch {
    return true;
  }
}

// Format time to 12-hour format
function formatTime(timeStr) {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${(m || 0).toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return timeStr;
  }
}

// Leaflet OSM HTML template - Premium styled dark map
const LEAFLET_MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { padding: 0; margin: 0; background-color: #f8fafc; }
    html, body, #map { height: 100%; width: 100vw; }
    .leaflet-control-attribution { display: none !important; }
    .store-marker {
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .store-marker.selected {
      transform: scale(1.25);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([13.0827, 80.2707], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    var markers = {};
    var userLocationMarker = null;

    function onMarkerClick(id) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_STORE', id: id }));
    }

    function addStoreMarker(id, name, lat, lng, isSelected) {
      var markerSize = isSelected ? 42 : 34;
      var bgColor = isSelected ? "#e85c1c" : "#ffffff";
      var iconColor = isSelected ? "#ffffff" : "#e85c1c";
      var shadowSpread = isSelected ? "0 4px 16px rgba(232,92,28,0.4)" : "0 2px 8px rgba(0,0,0,0.15)";
      var borderColor = isSelected ? "#e85c1c" : "#f0f0f2";
      
      var icon = L.divIcon({
        className: 'store-marker' + (isSelected ? ' selected' : ''),
        html: "<div style='background:" + bgColor + "; width:" + markerSize + "px; height:" + markerSize + "px; border-radius:14px; border:2.5px solid " + borderColor + "; display:flex; align-items:center; justify-content:center; box-shadow:" + shadowSpread + ";'><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='" + iconColor + "' stroke-width='2.5'><path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/><circle cx='12' cy='10' r='3'/></svg></div>",
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize]
      });

      if (markers[id]) {
        map.removeLayer(markers[id]);
      }

      var marker = L.marker([lat, lng], { icon: icon }).addTo(map);
      marker.on('click', function() {
        onMarkerClick(id);
      });
      markers[id] = marker;
    }

    function updateUserLocation(lat, lng) {
      if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
      }
      var icon = L.divIcon({
        className: 'user-icon',
        html: "<div style='position:relative;'><div style='background:rgba(59,130,246,0.15); width:32px; height:32px; border-radius:50%; position:absolute; top:-8px; left:-8px;'></div><div style='background-color:#3b82f6; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 12px rgba(59,130,246,0.5);'></div></div>",
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      userLocationMarker = L.marker([lat, lng], { icon: icon }).addTo(map);
    }

    function centerMap(lat, lng, zoom) {
      map.flyTo([lat, lng], zoom || 14, { duration: 0.8 });
    }
  </script>
</body>
</html>
`;

export default function StoreLocatorScreen() {
  const { theme, fonts, shadows } = useTheme();
  const webViewRef = useRef(null);
  const flatListRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userCoords, setUserCoords] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Fetch user location
  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (location && location.coords) {
          setUserCoords(location.coords);
          if (mapReady && webViewRef.current) {
            webViewRef.current.injectJavaScript(`updateUserLocation(${location.coords.latitude}, ${location.coords.longitude});`);
          }
          return location.coords;
        }
      }
    } catch (err) {
      console.log('Error requesting location permission:', err);
    }
    return null;
  };

  // Fetch stores and sort them
  const loadStores = async (coords = null) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/stores');
      if (res.success && Array.isArray(res.data)) {
        let storeList = res.data.map(store => ({
          ...store,
          latNum: Number(store.latitude),
          lngNum: Number(store.longitude),
        }));

        // Calculate distance if coordinates are available
        const activeCoords = coords || userCoords;
        if (activeCoords) {
          storeList = storeList.map(store => {
            const dist = calculateDistance(
              activeCoords.latitude,
              activeCoords.longitude,
              store.latNum,
              store.lngNum
            );
            return { ...store, distance: dist };
          });
          // Sort by distance (nearest to farthest)
          storeList.sort((a, b) => a.distance - b.distance);
        }

        setStores(storeList);

        // Auto-select the first store as active
        if (storeList.length > 0) {
          setSelectedStoreId(storeList[0].id);
        }
      } else {
        setError('Failed to retrieve active store locations.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading store locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const coords = await requestLocation();
      await loadStores(coords);
    })();
  }, [mapReady]);

  // Inject JavaScript to draw markers on webview when ready or selections change
  const syncMapState = useCallback(() => {
    if (!mapReady || !webViewRef.current || stores.length === 0) return;

    let markerCodes = stores.map(store => {
      const isSelected = store.id === selectedStoreId;
      return `addStoreMarker("${store.id}", "${store.name.replace(/"/g, '\\"')}", ${store.latNum}, ${store.lngNum}, ${isSelected});`;
    }).join('\n');

    const selectedStore = stores.find(s => s.id === selectedStoreId);
    let centerCode = selectedStore ? `centerMap(${selectedStore.latNum}, ${selectedStore.lngNum}, 14);` : '';

    let userLocCode = userCoords ? `updateUserLocation(${userCoords.latitude}, ${userCoords.longitude});` : '';

    webViewRef.current.injectJavaScript(`
      ${markerCodes}
      ${centerCode}
      ${userLocCode}
    `);
  }, [mapReady, stores, selectedStoreId, userCoords]);

  useEffect(() => {
    syncMapState();
  }, [syncMapState]);

  const handleCenterOnUser = async () => {
    const coords = await requestLocation();
    if (coords && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        updateUserLocation(${coords.latitude}, ${coords.longitude});
        centerMap(${coords.latitude}, ${coords.longitude}, 12);
      `);
      loadStores(coords);
    }
  };

  const handleSelectStore = useCallback((store, index) => {
    setSelectedStoreId(store.id);
    if (webViewRef.current && mapReady) {
      webViewRef.current.injectJavaScript(`centerMap(${store.latNum}, ${store.lngNum}, 14);`);
    }
    if (flatListRef.current && index !== undefined && index >= 0) {
      try {
        flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      } catch (e) { }
    }
  }, [mapReady]);

  const handleGetDirections = (store) => {
    // Navigation uses Google Maps link as requested
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latNum},${store.lngNum}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Directions Error', 'Unable to open Google Maps navigation.');
    });
  };

  // Premium store card - horizontal layout
  const renderStoreCard = ({ item, index }) => {
    const isSelected = selectedStoreId === item.id;
    const distanceText = item.distance !== undefined
      ? item.distance < 1
        ? `${(item.distance * 1000).toFixed(0)}m`
        : `${item.distance.toFixed(1)}km`
      : null;
    const storeOpen = isStoreOpen(item.openingHours, item.closingHours);

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <TouchableOpacity
          style={[
            styles.storeCard,
            {
              backgroundColor: isSelected ? theme.brand[500] : theme.bg.card,
              borderColor: isSelected ? theme.brand[500] : theme.border,
            },
            isSelected && styles.storeCardSelected,
            !isSelected && styles.storeCardDefault,
          ]}
          onPress={() => {
            handleSelectStore(item, index);
            handleGetDirections(item);
          }}
          activeOpacity={0.88}
        >
          {/* Left: Store Icon / Image */}
          <View style={[
            styles.storeCardIconWrap,
            {
              backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : theme.brand[500] + '0F',
            }
          ]}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.storeCardImage} />
            ) : (
              <Store size={24} color={isSelected ? '#ffffff' : theme.brand[500]} />
            )}
          </View>

          {/* Center: Store Details */}
          <View style={styles.storeCardContent}>
            {/* Name Row */}
            <View style={styles.storeNameRow}>
              <Text
                style={[
                  styles.storeCardName,
                  {
                    fontFamily: fonts.bold,
                    color: isSelected ? '#ffffff' : theme.text.primary,
                  },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </View>

            {/* Address */}
            <Text
              style={[
                styles.storeCardAddress,
                {
                  fontFamily: fonts.regular,
                  color: isSelected ? 'rgba(255,255,255,0.75)' : theme.text.secondary,
                },
              ]}
              numberOfLines={1}
            >
              {item.address}, {item.city}
            </Text>

            {/* Meta Row: Status + Hours */}
            <View style={styles.storeCardMeta}>
              {/* Open/Closed */}
              <View style={[
                styles.statusChip,
                {
                  backgroundColor: isSelected
                    ? (storeOpen ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)')
                    : (storeOpen ? '#f0fdf4' : '#fef2f2'),
                }
              ]}>
                <View style={[
                  styles.statusDotSmall,
                  { backgroundColor: storeOpen ? '#22c55e' : '#ef4444' }
                ]} />
                <Text style={[
                  styles.statusChipText,
                  {
                    fontFamily: fonts.semiBold,
                    color: isSelected
                      ? (storeOpen ? '#86efac' : '#fca5a5')
                      : (storeOpen ? '#16a34a' : '#dc2626'),
                  }
                ]}>
                  {storeOpen ? 'Open' : 'Closed'}
                </Text>
              </View>

              {/* Hours */}
              <View style={styles.hoursChip}>
                <Clock size={10} color={isSelected ? 'rgba(255,255,255,0.6)' : theme.text.muted} />
                <Text style={[
                  styles.hoursText,
                  {
                    fontFamily: fonts.medium,
                    color: isSelected ? 'rgba(255,255,255,0.6)' : theme.text.muted,
                  }
                ]}>
                  {formatTime(item.openingHours)} – {formatTime(item.closingHours)}
                </Text>
              </View>
            </View>
          </View>

          {/* Right: Distance + Action */}
          <View style={styles.storeCardRight}>
            {distanceText && (
              <View style={[
                styles.distancePill,
                {
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : theme.brand[500] + '12',
                }
              ]}>
                <Navigation size={10} color={isSelected ? '#ffffff' : theme.brand[500]} />
                <Text style={[
                  styles.distancePillText,
                  {
                    fontFamily: fonts.bold,
                    color: isSelected ? '#ffffff' : theme.brand[500],
                  }
                ]}>
                  {distanceText}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.directionIconBtn,
                {
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : theme.bg.input,
                }
              ]}
              onPress={() => handleGetDirections(item)}
              activeOpacity={0.7}
            >
              <Route size={16} color={isSelected ? '#ffffff' : theme.brand[500]} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Phone row - below the card for the selected store */}
        {isSelected && item.phone && (
          <TouchableOpacity
            style={[styles.phoneRow, { backgroundColor: theme.bg.card, borderColor: theme.border }]}
            onPress={() => Linking.openURL(`tel:${item.phone}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.phoneIconWrap, { backgroundColor: '#f0fdf4' }]}>
              <Phone size={14} color="#16a34a" />
            </View>
            <Text style={[styles.phoneText, { fontFamily: fonts.medium, color: theme.text.primary }]}>
              {item.phone}
            </Text>
            <Text style={[styles.phoneCta, { fontFamily: fonts.semiBold, color: '#16a34a' }]}>
              Call Now
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  // Floating header inside the map area
  const renderMapOverlay = () => (
    <>
      {/* Top gradient overlay for header readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.15)', 'transparent']}
        style={styles.mapTopGradient}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.floatingHeader}>
        <View style={styles.floatingHeaderLeft}>
          <View style={styles.headerPinIcon}>
            <MapPin size={16} color="#ffffff" />
          </View>
          <View>
            <Text style={[styles.floatingTitle, { fontFamily: fonts.bold }]}>
              Our Stores
            </Text>
            <Text style={[styles.floatingSubtitle, { fontFamily: fonts.regular }]}>
              {stores.length} {stores.length === 1 ? 'location' : 'locations'} near you
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom gradient overlay for list transition */}
      <LinearGradient
        colors={['transparent', theme.bg.main]}
        style={styles.mapBottomGradient}
        pointerEvents="none"
      />

      {/* Locate user FAB */}
      {permissionGranted && (
        <TouchableOpacity
          style={[styles.locateFab, { backgroundColor: theme.bg.card }]}
          onPress={handleCenterOnUser}
          activeOpacity={0.85}
        >
          <Compass size={22} color={theme.brand[500]} />
        </TouchableOpacity>
      )}
    </>
  );

  const renderSectionHeader = () => (
    <View style={styles.sectionHeaderWrap}>
      {/* Drag handle indicator */}
      <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />

      {/* Section heading */}
      <View style={styles.sectionTitleRow}>
        <View>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Nearby Stores
          </Text>
          <Text style={[styles.sectionSubtext, { fontFamily: fonts.regular, color: theme.text.muted }]}>
            Sorted by distance from you
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: theme.brand[500] + '0F' }]}
          onPress={() => loadStores(userCoords)}
          activeOpacity={0.7}
        >
          <RefreshCw size={16} color={theme.brand[500]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state
  if (loading && stores.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
        <StatusBar barStyle="dark-content" translucent={false} />
        <View style={styles.loadingWrap}>
          <View style={[styles.loaderCard, { backgroundColor: theme.bg.card }]}>
            <View style={[styles.loaderIconWrap, { backgroundColor: theme.brand[500] + '14' }]}>
              <ActivityIndicator size="large" color={theme.brand[500]} />
            </View>
            <Text style={[styles.loaderTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              Finding stores
            </Text>
            <Text style={[styles.loaderSubtext, { fontFamily: fonts.regular, color: theme.text.muted }]}>
              Locating the nearest stores to you…
            </Text>
            {/* Skeleton cards */}
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.skeletonCard, { backgroundColor: theme.bg.input }]}>
                <View style={[styles.skeletonCircle, { backgroundColor: theme.border }]} />
                <View style={styles.skeletonLines}>
                  <View style={[styles.skeletonLine, { backgroundColor: theme.border, width: '70%' }]} />
                  <View style={[styles.skeletonLine, { backgroundColor: theme.border, width: '45%' }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
        <StatusBar barStyle="dark-content" translucent={false} />
        <View style={styles.loadingWrap}>
          <View style={[styles.errorCard, { backgroundColor: theme.bg.card }]}>
            <View style={styles.errorIconWrap}>
              <AlertTriangle size={36} color="#f59e0b" />
            </View>
            <Text style={[styles.errorTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              Unable to load stores
            </Text>
            <Text style={[styles.errorMsg, { fontFamily: fonts.regular, color: theme.text.muted }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.brand[500] }]}
              onPress={() => loadStores()}
              activeOpacity={0.85}
            >
              <RefreshCw size={16} color="#ffffff" />
              <Text style={[styles.retryText, { fontFamily: fonts.bold }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      <StatusBar barStyle="light-content" translucent={false} backgroundColor="transparent" />

      {/* Full-bleed Map */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          style={styles.map}
          source={{ html: LEAFLET_MAP_HTML }}
          onLoadEnd={() => {
            setMapReady(true);
            syncMapState();
          }}
          onMessage={(event) => {
            try {
              const message = JSON.parse(event.nativeEvent.data);
              if (message.type === 'SELECT_STORE') {
                const selectedStore = stores.find(s => s.id === message.id);
                const selectedIndex = stores.findIndex(s => s.id === message.id);
                if (selectedStore) {
                  handleSelectStore(selectedStore, selectedIndex);
                }
              }
            } catch (e) {
              console.log('Error parsing WebView message:', e);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
        {renderMapOverlay()}
      </View>

      {/* Store List - bottom sheet style */}
      <FlatList
        ref={flatListRef}
        data={stores}
        renderItem={renderStoreCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={[styles.storeList, { backgroundColor: theme.bg.main }]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ===== Map Area =====
  mapContainer: {
    height: MAP_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 2,
  },
  mapBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 2,
  },

  // ===== Floating Header =====
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  floatingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerPinIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(232,92,28,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: '#e85c1c',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  floatingTitle: {
    fontSize: 17,
    color: '#ffffff',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  floatingSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ===== Locate FAB =====
  locateFab: {
    position: 'absolute',
    right: 16,
    bottom: 70,
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },

  // ===== Store List =====
  storeList: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 5,
    ...Platform.select({
      android: { elevation: 12 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
      },
    }),
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // ===== Section Header =====
  sectionHeaderWrap: {
    paddingTop: 12,
    paddingBottom: 14,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    letterSpacing: -0.4,
  },
  sectionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== Store Card =====
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  storeCardSelected: {
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#e85c1c',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  storeCardDefault: {
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  storeCardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  storeCardImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
  },
  storeCardContent: {
    flex: 1,
    gap: 3,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeCardName: {
    fontSize: 15,
    letterSpacing: -0.2,
    flex: 1,
  },
  storeCardAddress: {
    fontSize: 12,
    lineHeight: 16,
  },
  storeCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },

  // ===== Status Chip =====
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusChipText: {
    fontSize: 10,
  },

  // ===== Hours Chip =====
  hoursChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hoursText: {
    fontSize: 10,
  },

  // ===== Right Column =====
  storeCardRight: {
    alignItems: 'center',
    gap: 8,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  distancePillText: {
    fontSize: 11,
  },
  directionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== Phone Row =====
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 14,
    marginRight: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  phoneIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneText: {
    flex: 1,
    fontSize: 13,
  },
  phoneCta: {
    fontSize: 12,
  },

  // ===== Loading State =====
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loaderCard: {
    width: '100%',
    alignItems: 'center',
    padding: 32,
    borderRadius: 28,
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  loaderIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loaderTitle: {
    fontSize: 18,
    marginBottom: 6,
  },
  loaderSubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    gap: 12,
  },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  skeletonLines: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
  },

  // ===== Error State =====
  errorCard: {
    alignItems: 'center',
    padding: 36,
    borderRadius: 28,
    width: '100%',
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  errorMsg: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 19,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
  },
});
