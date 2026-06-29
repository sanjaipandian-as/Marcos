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
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
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
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.35;

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

export default function StoreLocatorScreen() {
  const { theme, fonts, shadows } = useTheme();
  const mapRef = useRef(null);
  const flatListRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [userCoords, setUserCoords] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(null);

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
  }, []);

  const handleCenterOnUser = async () => {
    const coords = await requestLocation();
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
      loadStores(coords);
    }
  };

  const handleSelectStore = useCallback((store, index) => {
    setSelectedStoreId(store.id);
    if (mapRef.current && mapReady) {
      mapRef.current.animateToRegion({
        latitude: store.latNum,
        longitude: store.lngNum,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 800);
    }
    if (flatListRef.current && index !== undefined && index >= 0) {
      try {
        flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      } catch(e) {}
    }
  }, [mapReady]);

  const handleGetDirections = (store) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${store.latNum},${store.lngNum}`;
    const label = encodeURIComponent(store.name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    }) || `https://maps.google.com/?q=${latLng}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/?q=${store.latNum},${store.lngNum}`);
    });
  };

  const renderStoreItem = ({ item, index }) => {
    const isSelected = selectedStoreId === item.id;
    const distanceText = item.distance !== undefined
      ? item.distance < 1
        ? `${(item.distance * 1000).toFixed(0)} m`
        : `${item.distance.toFixed(1)} km`
      : null;
    const storeOpen = isStoreOpen(item.openingHours, item.closingHours);

    return (
      <TouchableOpacity
        style={[
          styles.storeCard,
          {
            backgroundColor: theme.bg.card,
            borderColor: isSelected ? theme.brand[500] : 'transparent',
            borderWidth: isSelected ? 1.5 : 0,
          },
          isSelected && {
            ...Platform.select({
              android: { elevation: 8 },
              ios: {
                shadowColor: theme.brand[500],
                shadowOpacity: 0.2,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
              },
            }),
          },
          !isSelected && {
            ...Platform.select({
              android: { elevation: 2 },
              ios: {
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
              },
            }),
          },
        ]}
        onPress={() => handleSelectStore(item, index)}
        activeOpacity={0.92}
      >
        {/* Store Image / Placeholder */}
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.storeImage} />
        ) : (
          <LinearGradient
            colors={isSelected ? [theme.brand[500], theme.brand[600] || theme.brand[500]] : ['#f1f5f9', '#e2e8f0']}
            style={styles.storeImagePlaceholder}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Store size={26} color={isSelected ? '#fff' : theme.text.muted} />
          </LinearGradient>
        )}

        {/* Store Info */}
        <View style={styles.storeInfo}>
          {/* Name + Distance Row */}
          <View style={styles.storeHeaderRow}>
            <Text
              style={[styles.storeName, { fontFamily: fonts.bold, color: theme.text.primary }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {distanceText && (
              <View style={[styles.distanceBadge, { backgroundColor: theme.brand[500] + '14' }]}>
                <Navigation size={9} color={theme.brand[500]} />
                <Text style={[styles.distanceText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                  {distanceText}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text
            style={[styles.storeDescription, { fontFamily: fonts.regular, color: theme.text.secondary }]}
            numberOfLines={2}
          >
            {item.description || `${item.address}, ${item.city}`}
          </Text>

          {/* Meta Row */}
          <View style={styles.metaContainer}>
            {/* Open/Closed Status */}
            <View style={[styles.statusPill, { backgroundColor: storeOpen ? '#dcfce7' : '#fef2f2' }]}>
              <View style={[styles.statusDot, { backgroundColor: storeOpen ? '#22c55e' : '#ef4444' }]} />
              <Text style={[styles.statusText, { fontFamily: fonts.medium, color: storeOpen ? '#16a34a' : '#dc2626' }]}>
                {storeOpen ? 'Open' : 'Closed'}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Clock size={11} color={theme.text.muted} />
              <Text style={[styles.metaText, { fontFamily: fonts.medium, color: theme.text.muted }]}>
                {item.openingHours} – {item.closingHours}
              </Text>
            </View>
          </View>

          {item.phone && (
            <TouchableOpacity
              style={styles.metaRow}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
              activeOpacity={0.7}
            >
              <Phone size={11} color={theme.brand[500]} />
              <Text style={[styles.metaText, { fontFamily: fonts.medium, color: theme.brand[500] }]}>
                {item.phone}
              </Text>
            </TouchableOpacity>
          )}

          {/* Directions Button */}
          <TouchableOpacity
            style={[
              styles.directionsBtn,
              {
                backgroundColor: isSelected ? theme.brand[500] : theme.bg.input || '#f1f5f9',
              },
            ]}
            onPress={() => handleGetDirections(item)}
            activeOpacity={0.8}
          >
            <Navigation size={13} color={isSelected ? '#fff' : theme.text.primary} />
            <Text
              style={[
                styles.directionsBtnText,
                {
                  fontFamily: fonts.bold,
                  color: isSelected ? '#fff' : theme.text.primary,
                },
              ]}
            >
              Get Directions
            </Text>
            <ExternalLink size={11} color={isSelected ? '#fff' : theme.text.muted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
        Nearby Stores
      </Text>
      <Text style={[styles.sectionSubtitle, { fontFamily: fonts.regular, color: theme.text.muted }]}>
        {stores.length} {stores.length === 1 ? 'location' : 'locations'} found
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      <StatusBar barStyle="dark-content" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.bg.card, borderBottomColor: theme.border || '#f1f5f9' }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: theme.brand[500] + '14' }]}>
            <MapPin size={18} color={theme.brand[500]} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              Store Locator
            </Text>
            <Text style={[styles.headerSubtitle, { fontFamily: fonts.regular, color: theme.text.muted }]}>
              Find Couture Studios near you
            </Text>
          </View>
        </View>
      </View>

      {/* Content wrapper */}
      <View style={{ flex: 1 }}>
        {loading && stores.length === 0 ? (
          <View style={styles.centerWrap}>
            <View style={[styles.loaderContainer, { backgroundColor: theme.bg.card }]}>
              <ActivityIndicator size="large" color={theme.brand[500]} />
              <Text style={[styles.loaderText, { fontFamily: fonts.medium, color: theme.text.muted }]}>
                Finding stores near you…
              </Text>
            </View>
          </View>
        ) : error ? (
          <View style={styles.centerWrap}>
            <View style={[styles.errorCard, { backgroundColor: theme.bg.card }]}>
              <View style={styles.errorIconWrap}>
                <AlertTriangle size={32} color="#f59e0b" />
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
                <Text style={[styles.retryText, { fontFamily: fonts.bold }]}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {/* Interactive Map */}
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: stores[0]?.latNum || 13.0827,
                  longitude: stores[0]?.lngNum || 80.2707,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
                showsUserLocation={permissionGranted}
                showsMyLocationButton={false}
                onMapReady={() => setMapReady(true)}
              >
                {stores.map((store, index) => {
                  const isSelected = selectedStoreId === store.id;
                  return (
                    <Marker
                      key={store.id}
                      coordinate={{ latitude: store.latNum, longitude: store.lngNum }}
                      onPress={() => handleSelectStore(store, index)}
                      zIndex={isSelected ? 10 : 1}
                    >
                      <View style={[
                        styles.customMarker,
                        {
                          backgroundColor: isSelected ? theme.brand[500] : '#ffffff',
                          borderColor: isSelected ? '#ffffff' : theme.brand[200] || theme.brand[500] + '30',
                          borderWidth: isSelected ? 2.5 : 1.5,
                          transform: [{ scale: isSelected ? 1.25 : 1 }],
                          ...Platform.select({
                            android: { elevation: isSelected ? 8 : 3 },
                            ios: {
                              shadowColor: isSelected ? theme.brand[500] : '#000',
                              shadowOpacity: isSelected ? 0.3 : 0.1,
                              shadowRadius: isSelected ? 8 : 4,
                              shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
                            },
                          }),
                        }
                      ]}>
                        <MapPin size={isSelected ? 18 : 15} color={isSelected ? '#ffffff' : theme.brand[500]} />
                      </View>
                      <Callout tooltip>
                        <View style={styles.calloutBubble}>
                          <Text style={[styles.calloutName, { fontFamily: fonts.bold }]}>{store.name}</Text>
                          <Text style={[styles.calloutHours, { fontFamily: fonts.regular }]}>
                            {store.openingHours} – {store.closingHours}
                          </Text>
                        </View>
                      </Callout>
                    </Marker>
                  );
                })}
              </MapView>

              {/* Map overlay gradient (bottom fade) */}
              <LinearGradient
                colors={['transparent', theme.bg.main || '#f8fafc']}
                style={styles.mapFade}
                pointerEvents="none"
              />

              {/* Locate user button */}
              {permissionGranted && (
                <TouchableOpacity
                  style={[styles.locateBtn, {
                    backgroundColor: theme.bg.card || '#ffffff',
                    ...Platform.select({
                      android: { elevation: 6 },
                      ios: {
                        shadowColor: '#000',
                        shadowOpacity: 0.12,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 3 },
                      },
                    }),
                  }]}
                  onPress={handleCenterOnUser}
                  activeOpacity={0.8}
                >
                  <Locate size={20} color={theme.brand[500]} />
                </TouchableOpacity>
              )}
            </View>

            {/* Sorted Store List */}
            <FlatList
              ref={flatListRef}
              data={stores}
              renderItem={renderStoreItem}
              keyExtractor={item => item.id}
              ListHeaderComponent={renderHeader}
              contentContainerStyle={styles.listPadding}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
    letterSpacing: 0.1,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loaderContainer: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    width: '100%',
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  loaderText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    width: '100%',
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 17,
    marginBottom: 6,
  },
  errorMsg: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 19,
  },
  retryBtn: {
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 14,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  locateBtn: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 120,
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  calloutName: {
    fontSize: 12,
    color: '#1e293b',
    textAlign: 'center',
  },
  calloutHours: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
  },
  listHeader: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  storeCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 12,
    overflow: 'hidden',
  },
  storeImage: {
    width: 88,
    height: '100%',
    minHeight: 130,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  storeImagePlaceholder: {
    width: 88,
    height: '100%',
    minHeight: 130,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },
  storeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: 15,
    flex: 1,
    letterSpacing: -0.2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  distanceText: {
    fontSize: 10,
  },
  storeDescription: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  metaText: {
    fontSize: 10.5,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 10,
  },
  directionsBtnText: {
    fontSize: 11.5,
  },
});
