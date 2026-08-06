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
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  AlertTriangle,
  Locate,
  Store,
  ChevronRight,
  Route,
  Compass,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.38;

// Custom Location Icon Component matching the user-provided SVG
function CustomLocationIcon({ size = 18, color = '#18181B' }) {
  return (
    <Svg width={size} height={size * 1.64} viewBox="0 0 158.4 260">
      <Path
        fill={color}
        d="m79 8.2c-35.5 0.1-67.5 28.5-67.8 64.6-0.3 31.1 18.2 52.8 33.8 74.2l29.8 42c2.8 4.2 8.6 4.1 11.5 0l29.7-42c15.8-21.7 34.9-43 35.8-72.1-1.7-37.9-35.2-66.8-72.8-66.7zm0 107.6c-21.3 0-38.8-16.3-38.8-40.8s17.6-39.9 38.8-39.9c20.9 0 38.8 16.5 38.8 39.9 0 22.1-17.5 40.8-38.8 40.8z"
      />
      <Path
        fill={color}
        d="m79 49.7c-13.2 0.1-24.2 10.4-24.8 24.7 0.4 14.7 11.3 25 24.8 26.8 13.8 0 24.9-10.1 25-25.2-0.1-13.3-10.3-26.2-25-26.3z"
      />
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="m146.8 197.3-33.2-20.8-17.7 21.5c-9 11.4-25.4 11.6-33.3 0l-14.9-21.4-34.8 22.4c-5.4 2.9-5.4 9.2-0.6 12.3l63.3 39.8c2.2 1.4 5 1.4 7.2 0.1l63.7-39c2.5-1.6 4.1-2.6 3.5-2.3 4.5-2.9 3.9-9.6-3.2-12.6z"
      />
    </Svg>
  );
}

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
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Check if store is currently open
function isStoreOpen(openingHours, closingHours) {
  try {
    if (!openingHours || !closingHours) return true;
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
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${(m || 0).toString().padStart(2, '0')}${ampm}`;
  } catch {
    return timeStr;
  }
}

// Leaflet OSM HTML template - Sleek minimalist light map styling
const LEAFLET_MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { padding: 0; margin: 0; background-color: #f4f4f5; }
    html, body, #map { height: 100%; width: 100vw; }
    .leaflet-control-attribution { display: none !important; }
    .store-marker {
      transition: transform 0.25s ease-out;
    }
    .store-marker.selected {
      transform: scale(1.2);
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
      var markerSize = isSelected ? 38 : 30;
      var bgColor = isSelected ? "#18181B" : "#ffffff";
      var iconColor = isSelected ? "#ffffff" : "#18181B";
      var borderColor = isSelected ? "#18181B" : "#e4e4e7";
      var shadow = isSelected ? "0 4px 14px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.12)";
      
      var icon = L.divIcon({
        className: 'store-marker' + (isSelected ? ' selected' : ''),
        html: "<div style='background:" + bgColor + "; width:" + markerSize + "px; height:" + markerSize + "px; border-radius:50%; border:2px solid " + borderColor + "; display:flex; align-items:center; justify-content:center; box-shadow:" + shadow + ";'><svg width='13' height='21' viewBox='0 0 158.4 260' fill='" + iconColor + "'><path d='m79 8.2c-35.5 0.1-67.5 28.5-67.8 64.6-0.3 31.1 18.2 52.8 33.8 74.2l29.8 42c2.8 4.2 8.6 4.1 11.5 0l29.7-42c15.8-21.7 34.9-43 35.8-72.1-1.7-37.9-35.2-66.8-72.8-66.7zm0 107.6c-21.3 0-38.8-16.3-38.8-40.8s17.6-39.9 38.8-39.9c20.9 0 38.8 16.5 38.8 39.9 0 22.1-17.5 40.8-38.8 40.8z'/><path d='m79 49.7c-13.2 0.1-24.2 10.4-24.8 24.7 0.4 14.7 11.3 25 24.8 26.8 13.8 0 24.9-10.1 25-25.2-0.1-13.3-10.3-26.2-25-26.3z'/><path style='fill-rule:evenodd;clip-rule:evenodd;' d='m146.8 197.3-33.2-20.8-17.7 21.5c-9 11.4-25.4 11.6-33.3 0l-14.9-21.4-34.8 22.4c-5.4 2.9-5.4 9.2-0.6 12.3l63.3 39.8c2.2 1.4 5 1.4 7.2 0.1l63.7-39c2.5-1.6 4.1-2.6 3.5-2.3 4.5-2.9 3.9-9.6-3.2-12.6z'/></svg></div>",
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2]
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
        html: "<div style='position:relative;'><div style='background:rgba(24,24,27,0.15); width:32px; height:32px; border-radius:50%; position:absolute; top:-8px; left:-8px;'></div><div style='background-color:#18181B; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.3);'></div></div>",
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

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRelocating, setIsRelocating] = useState(false);
  const [error, setError] = useState(null);

  const [userCoords, setUserCoords] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [storeFilter, setStoreFilter] = useState('all'); // 'all', 'open'

  // Request GPS location
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
      } else {
        setPermissionGranted(false);
      }
    } catch (err) {
      console.log('Error requesting location permission:', err);
    }
    return null;
  };

  // Fetch stores and sort by distance
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
          storeList.sort((a, b) => a.distance - b.distance);
        }

        setStores(storeList);

        if (storeList.length > 0) {
          setSelectedStoreId(prev => (prev && storeList.some(s => s.id === prev) ? prev : storeList[0].id));
        }
      } else {
        setError('Unable to retrieve store locations.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading stores.');
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

  // Sync Leaflet map markers
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

  // Relocate trigger handler
  const handleCenterOnUser = async () => {
    try {
      setIsRelocating(true);
      const coords = await requestLocation();
      if (coords && webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          updateUserLocation(${coords.latitude}, ${coords.longitude});
          centerMap(${coords.latitude}, ${coords.longitude}, 13);
        `);
        await loadStores(coords);
      } else {
        Alert.alert(
          'Location Access',
          'Please enable location services in your phone settings to automatically find nearby stores.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.log('Relocate error:', err);
    } finally {
      setIsRelocating(false);
    }
  };

  const handleSelectStore = useCallback((store, index) => {
    setSelectedStoreId(store.id);
    if (webViewRef.current && mapReady) {
      webViewRef.current.injectJavaScript(`centerMap(${store.latNum}, ${store.lngNum}, 14);`);
    }
    if (flatListRef.current && index !== undefined && index >= 0) {
      try {
        flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
      } catch (e) { }
    }
  }, [mapReady]);

  const handleGetDirections = (store) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.latNum},${store.lngNum}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Google Maps navigation.');
    });
  };

  const getFilteredStores = () => {
    if (storeFilter === 'open') {
      return stores.filter(s => isStoreOpen(s.openingHours, s.closingHours));
    }
    return stores;
  };

  const filteredStores = getFilteredStores();

  // Minimalist Store Card Item
  const renderStoreCard = ({ item, index }) => {
    const isSelected = selectedStoreId === item.id;
    const distanceText = item.distance !== undefined
      ? item.distance < 1
        ? `${(item.distance * 1000).toFixed(0)} m away`
        : `${item.distance.toFixed(1)} km away`
      : null;
    const storeOpen = isStoreOpen(item.openingHours, item.closingHours);

    return (
      <TouchableOpacity
        style={[
          styles.storeCard,
          {
            backgroundColor: isSelected ? '#18181B' : theme.bg.card,
            borderColor: isSelected ? '#18181B' : '#E4E4E7',
          },
        ]}
        onPress={() => handleSelectStore(item, index)}
        activeOpacity={0.88}
      >
        {/* Top Meta Row */}
        <View style={styles.storeCardTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <View style={[
              styles.storeIconWrap,
              { backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : '#F4F4F5' }
            ]}>
              <CustomLocationIcon size={16} color={isSelected ? '#FFFFFF' : '#18181B'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.storeCardName,
                  { fontFamily: fonts.bold, color: isSelected ? '#FFFFFF' : theme.text.primary }
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.storeCardCity,
                  { fontFamily: fonts.medium, color: isSelected ? 'rgba(255,255,255,0.7)' : theme.text.secondary }
                ]}
              >
                {item.city}
              </Text>
            </View>
          </View>

          {/* Open / Closed Status Pill */}
          <View style={[
            styles.statusPill,
            { backgroundColor: isSelected ? (storeOpen ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : (storeOpen ? '#ECFDF5' : '#FEF2F2') }
          ]}>
            <View style={[styles.statusDot, { backgroundColor: storeOpen ? '#10B981' : '#EF4444' }]} />
            <Text style={[
              styles.statusText,
              { fontFamily: fonts.bold, color: isSelected ? (storeOpen ? '#6EE7B7' : '#FCA5A5') : (storeOpen ? '#059669' : '#DC2626') }
            ]}>
              {storeOpen ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>

        {/* Address */}
        <Text
          style={[
            styles.storeCardAddress,
            { fontFamily: fonts.regular, color: isSelected ? 'rgba(255,255,255,0.8)' : theme.text.secondary }
          ]}
          numberOfLines={2}
        >
          {item.address}
        </Text>

        {/* Hours + Distance Info Row */}
        <View style={styles.storeCardInfoRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Clock size={13} color={isSelected ? 'rgba(255,255,255,0.6)' : '#71717A'} />
            <Text style={[
              styles.storeCardInfoText,
              { fontFamily: fonts.medium, color: isSelected ? 'rgba(255,255,255,0.6)' : '#71717A' }
            ]}>
              {formatTime(item.openingHours)} – {formatTime(item.closingHours)}
            </Text>
          </View>

          {distanceText && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Navigation size={12} color={isSelected ? '#6EE7B7' : theme.brand[500]} />
              <Text style={[
                styles.storeCardInfoText,
                { fontFamily: fonts.bold, color: isSelected ? '#6EE7B7' : theme.brand[500] }
              ]}>
                {distanceText}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons Row */}
        <View style={styles.storeCardActionsRow}>
          <TouchableOpacity
            style={[
              styles.directionsPrimaryBtn,
              { backgroundColor: isSelected ? '#FFFFFF' : '#18181B' }
            ]}
            onPress={() => handleGetDirections(item)}
            activeOpacity={0.8}
          >
            <Route size={14} color={isSelected ? '#18181B' : '#FFFFFF'} />
            <Text style={[
              styles.directionsPrimaryBtnText,
              { fontFamily: fonts.bold, color: isSelected ? '#18181B' : '#FFFFFF' }
            ]}>
              Directions
            </Text>
          </TouchableOpacity>

          {item.phone && (
            <TouchableOpacity
              style={[
                styles.phoneSecondaryBtn,
                { backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : '#F4F4F5' }
              ]}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
              activeOpacity={0.7}
            >
              <Phone size={14} color={isSelected ? '#FFFFFF' : '#18181B'} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Header above Store List
  const renderListHeader = () => (
    <View style={styles.listHeaderWrap}>
      {/* Top Handle Bar */}
      <View style={styles.sheetHandle} />

      {/* Title & Relocate Row */}
      <View style={styles.headerTitleRow}>
        <View>
          <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Boutique & Stores
          </Text>
          <Text style={[styles.headerSubtext, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
            {filteredStores.length} {filteredStores.length === 1 ? 'store' : 'stores'} available
          </Text>
        </View>

        {/* Relocate Me Button */}
        <TouchableOpacity
          style={[
            styles.relocateHeaderBtn,
            { backgroundColor: isRelocating ? '#EDE0ED' : '#F4F4F5' }
          ]}
          onPress={handleCenterOnUser}
          activeOpacity={0.8}
          disabled={isRelocating}
        >
          {isRelocating ? (
            <ActivityIndicator size="small" color={theme.brand[500]} />
          ) : (
            <Locate size={16} color="#18181B" />
          )}
          <Text style={[
            styles.relocateHeaderBtnText,
            { fontFamily: fonts.bold, color: isRelocating ? theme.brand[500] : '#18181B' }
          ]}>
            {isRelocating ? 'Locating...' : 'Relocate'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs Row */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[
            styles.filterTabPill,
            storeFilter === 'all' && styles.filterTabPillActive
          ]}
          onPress={() => setStoreFilter('all')}
        >
          <Text style={[
            styles.filterTabPillText,
            { fontFamily: storeFilter === 'all' ? fonts.bold : fonts.medium, color: storeFilter === 'all' ? '#FFFFFF' : theme.text.primary }
          ]}>
            All Stores ({stores.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTabPill,
            storeFilter === 'open' && styles.filterTabPillActive
          ]}
          onPress={() => setStoreFilter('open')}
        >
          <Text style={[
            styles.filterTabPillText,
            { fontFamily: storeFilter === 'open' ? fonts.bold : fonts.medium, color: storeFilter === 'open' ? '#FFFFFF' : theme.text.primary }
          ]}>
            Open Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && stores.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.brand[500]} />
          <Text style={[styles.loaderTitle, { fontFamily: fonts.bold, color: theme.text.primary, marginTop: 16 }]}>
            Locating nearby stores...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingWrap}>
          <AlertTriangle size={40} color="#F59E0B" />
          <Text style={[styles.loaderTitle, { fontFamily: fonts.bold, color: theme.text.primary, marginTop: 12 }]}>
            Unable to load stores
          </Text>
          <Text style={{ fontSize: 13, color: theme.text.secondary, textAlign: 'center', marginBottom: 20 }}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadStores()}
          >
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={{ fontFamily: fonts.bold, color: '#FFFFFF', fontSize: 14 }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      <StatusBar barStyle="dark-content" />

      {/* Top Map View */}
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
              console.log('WebView message error:', e);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />

        {/* Floating Relocate FAB on Map */}
        <TouchableOpacity
          style={styles.mapCompassFab}
          onPress={handleCenterOnUser}
          activeOpacity={0.85}
          disabled={isRelocating}
        >
          {isRelocating ? (
            <ActivityIndicator size="small" color="#18181B" />
          ) : (
            <Compass size={20} color="#18181B" />
          )}
        </TouchableOpacity>
      </View>

      {/* Store List Bottom Sheet */}
      <FlatList
        ref={flatListRef}
        data={filteredStores}
        renderItem={renderStoreCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.storeList}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ===== Map View =====
  mapContainer: {
    height: MAP_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapCompassFab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },

  // ===== Store List Sheet =====
  storeList: {
    flex: 1,
    marginTop: -16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // ===== List Header =====
  listHeaderWrap: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E4E7',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  headerSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  relocateHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  relocateHeaderBtnText: {
    fontSize: 12,
  },

  // ===== Filter Tabs =====
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
  },
  filterTabPillActive: {
    backgroundColor: '#18181B',
  },
  filterTabPillText: {
    fontSize: 12,
  },

  // ===== Minimalist Store Card =====
  storeCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  storeCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeCardName: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  storeCardCity: {
    fontSize: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  storeCardAddress: {
    fontSize: 13,
    lineHeight: 18,
  },
  storeCardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  storeCardInfoText: {
    fontSize: 12,
  },
  storeCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  directionsPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  directionsPrimaryBtnText: {
    fontSize: 13,
  },
  phoneSecondaryBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== Loading / Error =====
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loaderTitle: {
    fontSize: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#18181B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
});
