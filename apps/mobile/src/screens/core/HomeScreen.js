import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
  TextInput,
  ImageBackground,
  Alert,
  Modal,
  Linking,
  Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import {
  Search,
  SlidersHorizontal,
  Bell,
  ShoppingBag,
  ShoppingCart,
  Heart,
  ChevronRight,
  Sparkles,
  Play,
  ExternalLink,
  X,
  MapPin,
  ChevronDown,
  Check,
  Home,
  Navigation,
  Plus,
  MoreVertical
} from 'lucide-react-native';
import { CustomCartAddIcon, CustomCartAddedIcon } from '../../components/CartIcons';
import { useVideoPlayer, VideoView } from 'expo-video';
import BannerCarousel from '../../components/home/BannerCarousel';
import CategoryList from '../../components/home/CategoryList';
import ProductCard from '../../components/home/ProductCard';
import ProductGridSection from '../../components/home/ProductGridSection';
import PromoReelsSection from '../../components/home/PromoReelsSection';
import SpecialOffersSection from '../../components/home/SpecialOffersSection';
import TopSellingSection from '../../components/home/TopSellingSection';

const { width } = Dimensions.get('window');

const SUCCESS_SVG_XML = `<?xml version="1.0" encoding="utf-8"?><svg fill="none" viewBox="0 0 796 714" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="cp-3459-3837"><rect height="3837" width="3459" y="0" x="0" /></clipPath><g id="comp_745"><g transform="matrix(1,0,0,1,1729.5,1918.5)" opacity="0.5" id="stroke1"><animate repeatCount="indefinite" begin="0s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g id="Shape 1" transform="matrix(1,0,0,1,0,0)"><path stroke-linejoin="miter" stroke-linecap="round" stroke-width="92" stroke-opacity="1" stroke="#8bffac" fill="#ffffff" fill-opacity="1" d="M-1401.5,-1457.5L-1027.49,-1672.499" /></g></g><g transform="matrix(1,0,0,1,1818.5,2059.5)" opacity="0.5" visibility="hidden" id="stroke2"><animate repeatCount="indefinite" begin="0.16s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g id="Shape 1" transform="matrix(1,0,0,1,0,0)"><path stroke-linejoin="miter" stroke-linecap="round" stroke-width="92" stroke-opacity="1" stroke="#8bffac" fill="#ffffff" fill-opacity="1" d="M-1401.5,-1457.5L-1027.49,-1672.499" /></g></g><g transform="matrix(1,0,0,1,2288.5,1790.5)" opacity="0.5" visibility="hidden" id="stroke4"><animate repeatCount="indefinite" begin="0.26s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g id="Shape 1" transform="matrix(1,0,0,1,0,0)"><path stroke-linejoin="miter" stroke-linecap="round" stroke-width="92" stroke-opacity="1" stroke="#8bffac" fill="#ffffff" fill-opacity="1" d="M-1401.5,-1457.5L-1372.351,-1474.477" /></g></g><g transform="matrix(1,0,0,1,1950.5,2175.5)" opacity="0.5" visibility="hidden" id="stroke3"><animate repeatCount="indefinite" begin="0.36s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g id="Shape 1" transform="matrix(1,0,0,1,0,0)"><path stroke-linejoin="miter" stroke-linecap="round" stroke-width="92" stroke-opacity="1" stroke="#8bffac" fill="#ffffff" fill-opacity="1" d="M-1401.5,-1457.5L-1117.454,-1623.493" /></g></g><g visibility="hidden" id="Bolas1"><animate repeatCount="indefinite" begin="0.44s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g transform="translate(621.5,478.5)"><g transform="rotate(-11)"><animateTransform repeatCount="indefinite" type="rotate" attributeName="transform" dur="1.56s" begin="0.44s" calcMode="spline" values="-11; 0; 6" keyTimes="0; 0.308; 1" keySplines="0.333 0 0.833 0.921; 0.167 0.327 0.15 1" fill="freeze" /><g transform="scale(0,0)"><animateTransform repeatCount="indefinite" type="scale" attributeName="transform" dur="0.48s" begin="0.44s" calcMode="spline" values="0 0; 1 1" keyTimes="0; 1" keySplines="0.333 0 0.101 1" fill="freeze" /><g transform="translate(1108,1440)"><g id="Ellipse 3" transform="matrix(0.857,0,0,0.857,-819.535,-1371.645)"><ellipse ry="9.6775" rx="9.6775" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="5" stroke-opacity="1" stroke="#8bffac" /></g><g id="Ellipse 1" transform="matrix(1.409,0,0,1.409,-1282.949,-1147.881)"><ellipse ry="9.6775" rx="9.6775" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="5" stroke-opacity="1" stroke="#8bffac" /></g><g id="Ellipse 2" transform="matrix(1.409,0,0,1.409,-1151.238,-1723.625)"><ellipse ry="9.6775" rx="9.6775" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="5" stroke-opacity="1" stroke="#8bffac" /></g></g></g></g></g></g><g visibility="hidden" id="Bolas2"><animate repeatCount="indefinite" begin="0.52s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><g transform="translate(617.5,490.5)"><g transform="scale(0,0)"><animateTransform repeatCount="indefinite" type="scale" attributeName="transform" dur="0.48s" begin="0.52s" calcMode="spline" values="0 0; 1 1" keyTimes="0; 1" keySplines="0.333 0 0.101 1" fill="freeze" /><g transform="translate(1112,1428)"><g id="Ellipse 2" transform="matrix(0.644,0,0,0.644,-1435.793,-1556.371)"><ellipse ry="9.6775" rx="9.6775" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="8" stroke-opacity="1" stroke="#8bffac" /></g><g id="Ellipse 3" transform="matrix(0.644,0,0,0.644,-952.029,-1150.197)"><ellipse ry="9.6775" rx="9.6775" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="8" stroke-opacity="1" stroke="#8bffac" /></g></g></g></g></g><g opacity="0.01" visibility="hidden" id="cruz1"><animate repeatCount="indefinite" begin="0.6s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><animate repeatCount="indefinite" attributeName="opacity" dur="0.4s" begin="0.6s" calcMode="spline" values="0.01; 1" keyTimes="0; 1" keySplines="0 0 1 1" fill="freeze" /><g transform="translate(614.125,462.5)"><animateTransform repeatCount="indefinite" type="translate" attributeName="transform" dur="0.4s" begin="0.6s" calcMode="spline" values="614.125 462.5; 852.125 164.5" keyTimes="0; 1" keySplines="0.333 0 0.103 1" fill="freeze" /><g transform="rotate(-28)"><animateTransform repeatCount="indefinite" type="rotate" attributeName="transform" dur="1.4s" begin="0.6s" calcMode="spline" values="-28; 18" keyTimes="0; 1" keySplines="0.333 0 0.667 1" fill="freeze" /><g transform="scale(1,1) translate(882.375,1726)"><g id="Shape 1" transform="matrix(0,-1,1,0,843.572,-2608.05)"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g><g id="Shape 2"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g></g></g></g></g><g opacity="0.01" visibility="hidden" id="cruz2"><animate repeatCount="indefinite" begin="0.64s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; hidden" keyTimes="0; 1" attributeName="visibility" /><animate repeatCount="indefinite" attributeName="opacity" dur="0.4s" begin="0.64s" calcMode="spline" values="0.01; 1" keyTimes="0; 1" keySplines="0 0 1 1" fill="freeze" /><g transform="translate(606.125,465.5)"><animateTransform repeatCount="indefinite" type="translate" attributeName="transform" dur="0.4s" begin="0.64s" calcMode="spline" values="606.125 465.5; 322.125 572.5" keyTimes="0; 1" keySplines="0.333 0 0 1" fill="freeze" /><g transform="rotate(-30)"><animateTransform repeatCount="indefinite" type="rotate" attributeName="transform" dur="1.36s" begin="0.64s" calcMode="spline" values="-30; 16" keyTimes="0; 1" keySplines="0.333 0 0.667 1" fill="freeze" /><g transform="scale(1,1) translate(882.375,1726)"><g id="Shape 1" transform="matrix(0,-1,1,0,843.572,-2608.05)"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g><g id="Shape 2"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g></g></g></g></g><g opacity="0.01" visibility="hidden" id="cruz3"><animate repeatCount="indefinite" begin="0.72s" calcMode="discrete" fill="freeze" dur="40.1s" values="visible; visible" keyTimes="0; 1" attributeName="visibility" /><animate repeatCount="indefinite" attributeName="opacity" dur="0.4s" begin="0.72s" calcMode="spline" values="0.01; 1" keyTimes="0; 1" keySplines="0 0 1 1" fill="freeze" /><g transform="translate(614.125,467.5)"><animateTransform repeatCount="indefinite" type="translate" attributeName="transform" dur="0.4s" begin="0.72s" calcMode="spline" values="614.125 467.5; 841.125 680.5" keyTimes="0; 1" keySplines="0.333 0 0 1" fill="freeze" /><g transform="rotate(-33)"><animateTransform repeatCount="indefinite" type="rotate" attributeName="transform" dur="1.28s" begin="0.72s" calcMode="spline" values="-33; 13" keyTimes="0; 1" keySplines="0.333 0 0.667 1" fill="freeze" /><g transform="scale(1,1) translate(882.375,1726)"><g id="Shape 1" transform="matrix(0,-1,1,0,843.572,-2608.05)"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g><g id="Shape 2"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="3" stroke-opacity="1" stroke="#8bffac" d="M-894.5,-1726L-869.5,-1726" /></g></g></g></g></g></g></defs><g transform="matrix(1,0,0,1,-216,-106)" id="BG"><use clip-path="url(#cp-3459-3837)" height="3837" width="3459" y="0" x="0" xlink:href="#comp_745" href="#comp_745" /></g><g visibility="hidden" id="Shape Layer 1"><animate repeatCount="indefinite" begin="0.32s" calcMode="discrete" fill="freeze" dur="2.2s" values="visible; visible" keyTimes="0; 1" attributeName="visibility" /><g transform="translate(398.111,357.031)"><g transform="scale(0.3,0.3)"><animateTransform repeatCount="indefinite" type="scale" attributeName="transform" dur="0.32s" begin="0.32s" calcMode="spline" values="0.3 0.3; 1.011 1.011" keyTimes="0; 1" keySplines="0.333 0 0 1" fill="freeze" /><g transform="translate(-9.719,-2.719)"><g id="Ellipse 1" transform="matrix(1,0,0,1,9.719,2.719)"><ellipse ry="177.719" rx="177.719" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="0" stroke-opacity="1" stroke="#ffffff" fill="#8bffac" fill-opacity="1" /></g></g></g></g></g><g visibility="hidden" id="Shape Layer 2"><animate repeatCount="indefinite" begin="0.52s" calcMode="discrete" fill="freeze" dur="2.2s" values="visible; visible" keyTimes="0; 1" attributeName="visibility" /><g transform="translate(398,357.031)"><g transform="scale(0.3,0.3)"><animateTransform repeatCount="indefinite" type="scale" attributeName="transform" dur="0.32s" begin="0.52s" calcMode="spline" values="0.3 0.3; 0.916 0.916" keyTimes="0; 1" keySplines="0.333 0 0 1" fill="freeze" /><g transform="translate(-9.719,-2.719)"><g id="Ellipse 1" transform="matrix(1,0,0,1,9.719,2.719)"><ellipse ry="177.719" rx="177.719" cy="0" cx="0" stroke-linejoin="miter" stroke-linecap="butt" stroke-width="0" stroke-opacity="1" stroke="#ffffff" fill="#17c37e" fill-opacity="1" /></g></g></g></g></g><g transform="matrix(1,0,0,1,396.5,357)" visibility="hidden" id="Shape Layer 3"><animate repeatCount="indefinite" begin="0.72s" calcMode="discrete" fill="freeze" dur="2.2s" values="visible; visible" keyTimes="0; 1" attributeName="visibility" /><g id="Shape 1"><path stroke-linejoin="miter" stroke-linecap="butt" stroke-width="18" stroke-opacity="1" stroke="#ffffff" d="M-72,6L-28,49L75,-54" /></g></g></svg>`;


export default function HomeScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();

  // Data States
  const [userProfile, setUserProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [cartItems, setCartItems] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [selectedTab, setSelectedTab] = useState('All'); // 'All', 'Men', 'Women', 'Girls'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCategories, setShowCategories] = useState(false);
  const [showReferralPopup, setShowReferralPopup] = useState(false);
  const [promos, setPromos] = useState([]);
  
  // Address Picker States
  const [customAddress, setCustomAddress] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  // Flipkart style address picker states
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddressName, setNewAddressName] = useState('');
  const [newAddressPhone, setNewAddressPhone] = useState('');
  const [newAddressLabel, setNewAddressLabel] = useState('HOME'); // HOME, WORK, OTHER
  const [savedAddressesList, setSavedAddressesList] = useState([]);
  
  // Separate address fields
  const [newAddressFlat, setNewAddressFlat] = useState('');
  const [newAddressArea, setNewAddressArea] = useState('');
  const [newAddressCity, setNewAddressCity] = useState('');
  const [newAddressState, setNewAddressState] = useState('');
  const [newAddressPincode, setNewAddressPincode] = useState('');
  
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkReferralPopup = async () => {
      try {
        const val = await AsyncStorage.getItem('show_referral_success_popup');
        if (val === 'true') {
          setShowReferralPopup(true);
          await AsyncStorage.removeItem('show_referral_success_popup');
        }
      } catch (e) {
        console.error('Error checking referral popup:', e);
      }
    };
    checkReferralPopup();
  }, []);

  useEffect(() => {
    const loadSavedAddressesList = async () => {
      try {
        const active = await AsyncStorage.getItem('active_delivery_address');
        if (active) {
          setCustomAddress(active);
        }
        
        const savedListJSON = await AsyncStorage.getItem('saved_delivery_addresses');
        if (savedListJSON) {
          setSavedAddressesList(JSON.parse(savedListJSON));
        }
      } catch (e) {
        console.error('Error loading saved addresses:', e);
      }
    };
    loadSavedAddressesList();
  }, []);

  function parseAddressText(addrStr) {
    if (!addrStr) return '';
    const trimmed = addrStr.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          const active = parsed.find(a => a.selected) || parsed[0];
          return active?.address || '';
        } else if (parsed && typeof parsed === 'object') {
          return parsed.address || '';
        }
      } catch (e) {
        // Fallback
      }
    }
    return addrStr;
  }

  function cleanPhone(phone) {
    if (!phone) return '';
    let p = phone.replace(/[\s\-\(\)]/g, '');
    if (p.startsWith('+91')) {
      p = p.substring(3);
    } else if (p.startsWith('91') && p.length === 12) {
      p = p.substring(2);
    }
    return p;
  }

  // Sync profile address to local saved addresses list if not already present
  useEffect(() => {
    const syncProfileAddress = async () => {
      if (userProfile && userProfile.address) {
        try {
          const savedListJSON = await AsyncStorage.getItem('saved_delivery_addresses');
          let currentList = savedListJSON ? JSON.parse(savedListJSON) : [];
          
          const hasProfile = currentList.some(item => item.id === 'profile');
          if (!hasProfile) {
            const cleanAddr = parseAddressText(userProfile.address);
            const cleanPh = cleanPhone(userProfile.phoneNumber);
            const profileAddrObj = {
              id: 'profile',
              name: userProfile.fullName || 'Sanjai Pandian',
              phone: cleanPh,
              address: cleanAddr,
              label: 'HOME'
            };
            const updated = [profileAddrObj, ...currentList];
            setSavedAddressesList(updated);
            await AsyncStorage.setItem('saved_delivery_addresses', JSON.stringify(updated));
            
            // Set it as active delivery address if none is active yet
            const active = await AsyncStorage.getItem('active_delivery_address');
            if (!active) {
              setCustomAddress(cleanAddr);
              await AsyncStorage.setItem('active_delivery_address', cleanAddr);
            }
          }
        } catch (e) {
          console.error('Error syncing profile address:', e);
        }
      }
    };
    syncProfileAddress();
  }, [userProfile]);



  const getFormattedAddress = () => {
    if (customAddress) return parseAddressText(customAddress);
    if (userProfile?.address) {
      const name = userProfile.fullName.trim().split(/\s+/)[0];
      return `Deliver to ${name} - ${parseAddressText(userProfile.address)}`;
    }
    return 'Select your delivery location';
  };

  const getHeaderAddress = () => {
    let addr = '';
    if (customAddress) {
      addr = customAddress;
    } else if (userProfile?.address) {
      addr = userProfile.address;
    }
    
    if (!addr) return 'Select location';
    const plain = parseAddressText(addr);
    return plain.replace(/^Deliver to:?\s*/i, '');
  };

  const handleSelectAddressObject = async (addrObj) => {
    try {
      setCustomAddress(addrObj.address);
      await AsyncStorage.setItem('active_delivery_address', addrObj.address);
      setShowAddressModal(false);
    } catch (e) {
      console.error('Error selecting address:', e);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsSavingAddress(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Permission to access location was denied. Please enable location services in your settings or enter an address manually.'
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'MarcosMobileApp/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reverse geocode coordinate.');
      }

      const data = await response.json();
      const addrDetails = data.address;

      // Format clean individual address components
      const road = addrDetails.road || addrDetails.pedestrian || '';
      const suburb = addrDetails.suburb || addrDetails.neighbourhood || '';
      const area = [road, suburb].filter(p => p && p.trim() !== '').join(', ');

      const city = addrDetails.city || addrDetails.town || addrDetails.village || '';
      const state = addrDetails.state || '';
      const postcode = addrDetails.postcode || '';

      // Transition to Add Address form pre-filled with geocoded details
      setNewAddressName(userProfile?.fullName || '');
      setNewAddressPhone(cleanPhone(userProfile?.phoneNumber));
      setNewAddressFlat('');
      setNewAddressArea(area);
      setNewAddressCity(city);
      setNewAddressState(state);
      setNewAddressPincode(postcode);
      setIsAddingNewAddress(true);

      Alert.alert(
        'Location Located',
        'Please enter your Flat / House / Apartment No. and Building Name to complete your address.'
      );
    } catch (error) {
      console.error('Location geocoding error:', error);
      Alert.alert('Location Error', 'Unable to fetch your current location. Please enter it manually.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSaveNewCustomAddress = async () => {
    const name = newAddressName.trim();
    const phone = newAddressPhone.trim();
    const flat = newAddressFlat.trim();
    const area = newAddressArea.trim();
    const city = newAddressCity.trim();
    const state = newAddressState.trim();
    const pincode = newAddressPincode.trim();

    if (!name || !phone || !flat || !area || !city || !state || !pincode) {
      Alert.alert('Required Fields', 'Please fill in all address details fields.');
      return;
    }

    if (pincode.length !== 6 || isNaN(pincode)) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode.');
      return;
    }

    // Concatenate details to form a complete address string
    const completeAddressStr = `${flat}, ${area}, ${city}, ${state} - ${pincode}`;

    setIsSavingAddress(true);
    try {
      const newAddrObj = {
        id: 'custom_' + Date.now(),
        name,
        phone,
        address: completeAddressStr,
        label: newAddressLabel.toUpperCase()
      };

      const updatedList = [newAddrObj, ...savedAddressesList];
      setSavedAddressesList(updatedList);
      await AsyncStorage.setItem('saved_delivery_addresses', JSON.stringify(updatedList));

      setCustomAddress(completeAddressStr);
      await AsyncStorage.setItem('active_delivery_address', completeAddressStr);

      // Persist to database profile if logged in
      if (userProfile) {
        await api.put('/auth/profile', { address: completeAddressStr });
        setUserProfile(prev => ({ ...prev, address: completeAddressStr }));
      }

      // Reset form
      setNewAddressName('');
      setNewAddressPhone('');
      setNewAddressFlat('');
      setNewAddressArea('');
      setNewAddressCity('');
      setNewAddressState('');
      setNewAddressPincode('');
      setNewAddressLabel('HOME');
      setIsAddingNewAddress(false);
      setShowAddressModal(false);

      Alert.alert('Success', 'Delivery address saved successfully!');
    } catch (e) {
      console.error('Error saving custom address:', e);
      Alert.alert('Error', 'Failed to save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteSavedAddress = async (id) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = savedAddressesList.filter(item => item.id !== id);
              setSavedAddressesList(updated);
              await AsyncStorage.setItem('saved_delivery_addresses', JSON.stringify(updated));
            } catch (e) {
              console.error('Error deleting address:', e);
            }
          }
        }
      ]
    );
  };

  const loadData = async () => {
    try {
      if (products.length === 0) {
        setLoading(true);
      }
      const [profileRes, productsRes, categoriesRes, favRes, cartRes, bannersRes, offersRes, promosRes] = await Promise.all([
        api.get('/auth/profile').catch(() => ({ success: false })),
        api.get('/products?page=1&limit=20').catch(() => ({ success: false, data: [] })),
        api.get('/categories').catch(() => ({ success: false, data: [] })),
        api.get('/products/favorites').catch(() => ({ success: false, data: [] })),
        api.get('/products/cart').catch(() => ({ success: false, data: [] })),
        api.get('/banners').catch(() => ({ success: false, data: [] })),
        api.get('/offers/active').catch(() => ({ success: false, data: [] })),
        api.get('/promos/active').catch(() => ({ success: false, data: [] }))
      ]);

      if (profileRes.success) setUserProfile(profileRes.data);
      if (productsRes.success) setProducts(productsRes.data || []);
      if (categoriesRes.success) setCategories(categoriesRes.data || []);
      if (favRes.success && favRes.data) {
        setFavorites(new Set(favRes.data.map(item => item.productId)));
      }
      if (cartRes.success && cartRes.data) {
        setCartItems(new Set(cartRes.data.map(item => item.productId)));
      }
      if (bannersRes.success) {
        setBanners(bannersRes.data || []);
      }
      if (offersRes.success) {
        setOffers(offersRes.data || []);
      }
      if (promosRes.success) {
        setPromos(promosRes.data || []);
      }
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, products]);

  const toggleFavorite = async (productId) => {
    try {
      const isFav = favorites.has(productId);
      if (isFav) {
        await api.delete(`/products/favorites/${productId}`);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await api.post('/products/favorites', { productId });
        setFavorites(prev => {
          const next = new Set(prev);
          next.add(productId);
          return next;
        });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const inCart = cartItems.has(productId);
      if (!inCart) {
        const res = await api.post('/products/cart', { productId, quantity: 1 });
        if (res.success) {
          setCartItems(prev => {
            const next = new Set(prev);
            next.add(productId);
            return next;
          });
          Alert.alert('Success', 'Added to cart successfully!');
        }
      } else {
        navigation.navigate('Cart');
      }
    } catch (err) {
      const errorMsg = err?.message || 'Unable to add item to cart. Please try again.';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Browse', { searchQuery: searchQuery.trim() });
    }
  };

  // Get user's first name
  const getFirstName = () => {
    if (!userProfile?.fullName) return 'Guest';
    return userProfile.fullName.trim().split(/\s+/)[0];
  };

  // Filter products based on Target Gender or Category Mapping
  const getFilteredProducts = () => {
    if (selectedTab === 'All') return products;

    return products.filter(product => {
      // Primary: Filter by the newly added Target Gender
      if (selectedTab === 'Men' && product.targetGender === 'MEN') return true;
      if (selectedTab === 'Women' && product.targetGender === 'WOMEN') return true;

      // Fallback: Legacy category slug mapping for products still set to UNISEX
      const category = categories.find(c => c.id === product.categoryId);
      if (!category) return false;

      const slug = category.slug;
      if (selectedTab === 'Men') {
        return slug === 'sherwanis' || slug === 'blazers-suits';
      }
      if (selectedTab === 'Women') {
        return slug === 'bridal-lehengas' || slug === 'anarkali-sets';
      }
      if (selectedTab === 'Girls') {
        return slug === 'anarkali-sets';
      }
      return false;
    });
  };

  if (loading && products.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
        {/* Header Skeleton */}
        <View style={styles.headerRow}>
          <View style={styles.profileContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.border }]} />
            <View style={styles.greetingContainer}>
              <View style={[styles.skeletonLine, { width: 60, height: 10, backgroundColor: theme.border, marginBottom: 6 }]} />
              <View style={[styles.skeletonLine, { width: 100, height: 14, backgroundColor: theme.border }]} />
            </View>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.actionBtn, { backgroundColor: theme.border }]} />
            <View style={[styles.actionBtn, { backgroundColor: theme.border }]} />
          </View>
        </View>

        <View style={styles.scrollContent}>
          {/* Search Bar Skeleton */}
          <View style={styles.searchRow}>
            <View style={[styles.searchBarContainer, { backgroundColor: theme.border }]} />
            <View style={[styles.filterSettingsBtn, { backgroundColor: theme.border }]} />
          </View>

          {/* Banner Skeleton */}
          <View style={[styles.bannerCard, { backgroundColor: theme.border, height: 150 }]} />

          {/* Products Header Skeleton */}
          <View style={styles.sectionHeader}>
            <View style={[styles.skeletonLine, { width: 120, height: 16, backgroundColor: theme.border }]} />
            <View style={[styles.skeletonLine, { width: 60, height: 16, backgroundColor: theme.border }]} />
          </View>

          {/* Grid Skeletons */}
          <View style={styles.gridContainer}>
            {[1, 2, 3, 4].map((idx) => (
              <View key={idx} style={[styles.productCard, { backgroundColor: theme.bg.card, height: 220, opacity: 0.6 }]}>
                <View style={[styles.productImageWrapper, { backgroundColor: theme.border }]} />
                <View style={{ padding: 10, gap: 8 }}>
                  <View style={[styles.skeletonLine, { width: '80%', height: 12, backgroundColor: theme.border }]} />
                  <View style={[styles.skeletonLine, { width: '50%', height: 12, backgroundColor: theme.border }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  const filteredProducts = getFilteredProducts();
  const trendingProducts = products.filter(p => p.isTrending).slice(0, 4);
  const newArrivals = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const bestSellers = [...products].sort((a, b) => {
    if (b.salesCount !== a.salesCount) return b.salesCount - a.salesCount;
    return Number(b.price) - Number(a.price);
  }).slice(0, 5);

  const renderProductCard = (item, isHorizontal = false) => {
    return (
      <ProductCard
        key={item.id}
        item={item}
        isHorizontal={isHorizontal}
        isFav={favorites.has(item.id)}
        inCart={cartItems.has(item.id)}
        theme={theme}
        fonts={fonts}
        shadows={shadows}
        navigation={navigation}
        toggleFavorite={toggleFavorite}
        handleAddToCart={handleAddToCart}
      />
    );
  };

  const renderReferralPopup = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showReferralPopup}
      onRequestClose={() => setShowReferralPopup(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.modalSvgContainer}>
            <SvgXml xml={SUCCESS_SVG_XML} width={120} height={120} />
          </View>
          <Text style={[styles.modalTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Referral Reward!
          </Text>
          <Text style={[styles.modalSub, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
            You have received <Text style={{ fontFamily: fonts.bold, color: theme.brand[500] }}>100 points</Text> for joining via referral code.
          </Text>
          <TouchableOpacity
            style={[styles.modalCloseBtn, { backgroundColor: theme.brand[500] }]}
            onPress={() => setShowReferralPopup(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.modalCloseBtnText, { fontFamily: fonts.bold }]}>
              START EXPLORING
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );  const renderAddressModal = () => {
    // Filter the saved addresses
    const filteredAddresses = savedAddressesList.filter(item => {
      const q = addressSearchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.address && item.address.toLowerCase().includes(q)) ||
        (item.phone && item.phone.toLowerCase().includes(q)) ||
        (item.label && item.label.toLowerCase().includes(q))
      );
    });

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddressModal}
        onRequestClose={() => {
          setIsAddingNewAddress(false);
          setShowAddressModal(false);
        }}
      >
        <View style={styles.addressModalOverlay}>
          <TouchableOpacity 
            style={styles.addressModalCloseArea} 
            activeOpacity={1} 
            onPress={() => {
              setIsAddingNewAddress(false);
              setShowAddressModal(false);
            }} 
          />
          <View style={[styles.addressModalSheet, { backgroundColor: theme.bg.card }]}>
            {/* Drag handle */}
            <View style={styles.addressModalHandle} />

            {/* Header */}
            <View style={styles.addressModalHeader}>
              <Text style={[styles.addressModalTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                {isAddingNewAddress ? 'Add New Address' : 'Select delivery address'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setIsAddingNewAddress(false);
                  setShowAddressModal(false);
                }} 
                style={styles.addressModalCloseBtn}
              >
                <X size={20} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.addressModalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {isAddingNewAddress ? (
                /* ADD NEW ADDRESS FORM */
                <View style={{ gap: 16 }}>
                  {/* Name Input */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: theme.text.secondary }}>
                      Full Name
                    </Text>
                    <View style={[styles.pincodeInputContainer, { backgroundColor: theme.bg.input }]}>
                      <TextInput
                        style={[styles.pincodeInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
                        placeholder="Enter full name"
                        placeholderTextColor={theme.text.muted}
                        value={newAddressName}
                        onChangeText={setNewAddressName}
                      />
                    </View>
                  </View>

                  {/* Phone Input */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: theme.text.secondary }}>
                      Phone Number
                    </Text>
                    <View style={[styles.pincodeInputContainer, { backgroundColor: theme.bg.input }]}>
                      <TextInput
                        style={[styles.pincodeInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
                        placeholder="Enter 10-digit phone number"
                        placeholderTextColor={theme.text.muted}
                        keyboardType="numeric"
                        maxLength={10}
                        value={newAddressPhone}
                        onChangeText={setNewAddressPhone}
                      />
                    </View>
                  </View>

                  {/* Flat / House No / Apartment No */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: theme.text.secondary }}>
                      Flat / House No. / Apartment / Floor
                    </Text>
                    <View style={[styles.pincodeInputContainer, { backgroundColor: theme.bg.input }]}>
                      <TextInput
                        style={[styles.pincodeInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
                        placeholder="e.g. Flat 101, 1st Floor, ABC Residency"
                        placeholderTextColor={theme.text.muted}
                        value={newAddressFlat}
                        onChangeText={setNewAddressFlat}
                      />
                    </View>
                  </View>

                  {/* Area / Street / Locality */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: theme.text.secondary }}>
                      Area / Street / Locality / Landmark
                    </Text>
                    <View style={[styles.pincodeInputContainer, { backgroundColor: theme.bg.input }]}>
                      <TextInput
                        style={[styles.pincodeInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
                        placeholder="e.g. Jothipuram Main Road"
                        placeholderTextColor={theme.text.muted}
                        value={newAddressArea}
                        onChangeText={setNewAddressArea}
                      />
                    </View>
                  </View>

                  {/* City and State side by side */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: theme.text.secondary }}>
                        City / District
                      </Text>
                      <View style={[styles.pincodeInputContainer, { backgroundColor: theme.bg.input }]}>
                        <TextInput
                          style={[styles.pincodeInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
                          placeholder="e.g. Chennai"
                          placeholderTextColor={theme.text.muted}
                          value={newAddressCity}
                          onChangeText={setNewAddressCity}
                        />
                      </View>
                    </View>

                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: theme.text.secondary }}>
                        State
                      </Text>
                      <View style={[styles.pincodeInputContainer, { backgroundColor: theme.bg.input }]}>
                        <TextInput
                          style={[styles.pincodeInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
                          placeholder="e.g. Tamil Nadu"
                          placeholderTextColor={theme.text.muted}
                          value={newAddressState}
                          onChangeText={setNewAddressState}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Pincode */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: theme.text.secondary }}>
                      Pincode
                    </Text>
                    <View style={[styles.pincodeInputContainer, { backgroundColor: theme.bg.input }]}>
                      <TextInput
                        style={[styles.pincodeInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
                        placeholder="6-digit postal code"
                        placeholderTextColor={theme.text.muted}
                        keyboardType="numeric"
                        maxLength={6}
                        value={newAddressPincode}
                        onChangeText={setNewAddressPincode}
                      />
                    </View>
                  </View>

                  {/* Label Selection */}
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: theme.text.secondary }}>
                      Address Type Label
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {['HOME', 'WORK', 'OTHER'].map(label => {
                        const isSelected = newAddressLabel === label;
                        return (
                          <TouchableOpacity
                            key={label}
                            style={[
                              styles.cityChip,
                              isSelected && { borderColor: theme.brand[500], backgroundColor: '#fff7ed' }
                            ]}
                            activeOpacity={0.7}
                            onPress={() => setNewAddressLabel(label)}
                          >
                            <Text style={[
                              styles.cityChipText, 
                              { fontFamily: fonts.bold, color: isSelected ? theme.brand[500] : theme.text.secondary }
                            ]}>
                              {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={[styles.addressSaveBtn, { backgroundColor: theme.brand[500], marginTop: 10 }]}
                    activeOpacity={0.8}
                    onPress={handleSaveNewCustomAddress}
                    disabled={isSavingAddress}
                  >
                    {isSavingAddress ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.addressSaveBtnText, { fontFamily: fonts.bold, color: '#fff' }]}>
                        Save & Deliver Here
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Back Link */}
                  <TouchableOpacity 
                    style={{ alignSelf: 'center', padding: 8, marginBottom: 20 }}
                    onPress={() => setIsAddingNewAddress(false)}
                  >
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: theme.text.secondary }}>
                      Back to Saved Addresses
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* SAVED ADDRESSES LIST VIEW */
                <View style={{ gap: 16 }}>
                  {/* Search Bar */}
                  <View style={[styles.addressSearchBarRow, { backgroundColor: theme.bg.input, borderColor: theme.border }]}>
                    <Search size={18} color="#9e9e9e" style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.addressSearchInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
                      placeholder="Search by name, area, street, pincode"
                      placeholderTextColor="#9e9e9e"
                      value={addressSearchQuery}
                      onChangeText={setAddressSearchQuery}
                    />
                  </View>

                  {/* Use Current Location Button */}
                  <TouchableOpacity 
                    style={[styles.actionLinkRow, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}
                    activeOpacity={0.7}
                    onPress={handleGetCurrentLocation}
                    disabled={isSavingAddress}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Navigation size={18} color={theme.brand[500]} style={{ marginRight: 10 }} />
                      {isSavingAddress ? (
                        <ActivityIndicator size="small" color={theme.brand[500]} />
                      ) : (
                        <Text style={[styles.actionLinkText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                          Use my current location
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={16} color={theme.brand[500]} />
                  </TouchableOpacity>

                  {/* Add New Button */}
                  <TouchableOpacity 
                    style={[styles.actionLinkRow, { backgroundColor: '#fff7ed', borderColor: '#ffedd5' }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setNewAddressName(userProfile?.fullName || '');
                      setNewAddressPhone(cleanPhone(userProfile?.phoneNumber));
                      setIsAddingNewAddress(true);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Plus size={18} color={theme.brand[500]} style={{ marginRight: 10 }} />
                      <Text style={[styles.actionLinkText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                        Add New
                      </Text>
                    </View>
                    <ChevronRight size={16} color={theme.brand[500]} />
                  </TouchableOpacity>

                  {/* Saved Addresses list */}
                  <View style={{ marginTop: 8, marginBottom: 20 }}>
                    <Text style={[styles.savedAddressesTitleText, { fontFamily: fonts.semiBold, color: theme.text.secondary }]}>
                      Saved addresses
                    </Text>

                    {filteredAddresses.length === 0 ? (
                      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                        <Text style={{ fontFamily: fonts.regular, color: theme.text.muted, fontSize: 13 }}>
                          No saved addresses found.
                        </Text>
                      </View>
                    ) : (
                      filteredAddresses.map(item => {
                        const isSelected = item.address === customAddress;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.savedAddressCard,
                              isSelected && { borderColor: theme.brand[500], backgroundColor: '#fffbf9' }
                            ]}
                            activeOpacity={0.9}
                            onPress={() => handleSelectAddressObject(item)}
                          >
                            {/* Left Icon and "You're here" badge */}
                            <View style={styles.savedAddressCardLeft}>
                              <View style={[styles.savedAddressIconBox, { backgroundColor: theme.bg.input }]}>
                                {item.label === 'HOME' ? (
                                  <Home size={18} color={isSelected ? theme.brand[500] : theme.text.secondary} />
                                ) : (
                                  <MapPin size={18} color={isSelected ? theme.brand[500] : theme.text.secondary} />
                                )}
                              </View>
                              {isSelected && (
                                <Text style={[styles.youAreHereText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                                  You're here
                                </Text>
                              )}
                            </View>

                            {/* Middle details */}
                            <View style={styles.savedAddressCardMiddle}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                                <Text style={[styles.savedAddressCardName, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                                  {item.name}
                                </Text>
                                {isSelected && (
                                  <View style={[styles.selectedPillBadge, { backgroundColor: '#ffedd5' }]}>
                                    <Text style={[styles.selectedPillText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                                      Selected
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text style={[styles.savedAddressCardAddr, { fontFamily: fonts.regular, color: theme.text.secondary }]} numberOfLines={3}>
                                {item.address}
                              </Text>
                              <Text style={[styles.savedAddressCardPhone, { fontFamily: fonts.medium, color: theme.text.secondary, marginTop: 4 }]}>
                                📞 {item.phone}
                              </Text>
                            </View>

                            {/* Right menu dots */}
                            <TouchableOpacity 
                              style={styles.savedAddressCardRight}
                              activeOpacity={0.6}
                              onPress={() => handleDeleteSavedAddress(item.id)}
                            >
                              <MoreVertical size={20} color={theme.text.muted} />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const defaultHeaderOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const scrolledHeaderOpacity = scrollY.interpolate({
    inputRange: [40, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const defaultHeaderTranslateY = scrollY.interpolate({
    inputRange: [0, 50, 51],
    outputRange: [0, 0, -1000],
    extrapolate: 'clamp',
  });

  const scrolledHeaderTranslateY = scrollY.interpolate({
    inputRange: [0, 39, 40, 80],
    outputRange: [-1000, -1000, 15, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {renderReferralPopup()}
      {renderAddressModal()}

      {/* Sticky Header Row */}
      <View style={styles.headerRow}>
        {/* Default Header */}
        <Animated.View style={[styles.absoluteHeader, { opacity: defaultHeaderOpacity, transform: [{ translateY: defaultHeaderTranslateY }] }]}>
          <View style={styles.profileContainer}>
            <View style={[styles.avatar, shadows.premium]}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' }}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.greetingContainer}>
              <Text style={[styles.helloText, { fontFamily: fonts.regular, color: theme.text.secondary, marginBottom: 2 }]}>
                Hello {getFirstName()}
              </Text>
              <TouchableOpacity 
                style={styles.headerAddressBtn} 
                activeOpacity={0.7} 
                onPress={() => setShowAddressModal(true)}
              >
                <MapPin size={13} color={theme.brand[500]} style={{ marginRight: 3 }} />
                <Text 
                  style={[styles.headerAddressText, { fontFamily: fonts.bold, color: theme.text.primary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {getHeaderAddress()}
                </Text>
                <ChevronDown size={10} color={theme.text.secondary} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.actionBtn, shadows.premium]} activeOpacity={0.7} onPress={() => navigation.navigate('NotificationHistory')}>
              <Bell size={20} color="#1e1e1e" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, shadows.premium]} activeOpacity={0.7} onPress={() => navigation.navigate('Wishlist')}>
              <Heart size={20} color="#1e1e1e" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Scrolled Header */}
        <Animated.View style={[styles.absoluteHeader, { opacity: scrolledHeaderOpacity, transform: [{ translateY: scrolledHeaderTranslateY }] }]}>
          <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', gap: 12 }}>
            <View style={[styles.searchBarContainer, { backgroundColor: theme.bg.card, flex: 1 }, shadows.premium]}>
              <Search size={18} color="#9e9e9e" style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
                placeholder="Search.."
                placeholderTextColor="#9e9e9e"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity style={[styles.actionBtn, shadows.premium]} activeOpacity={0.7} onPress={() => navigation.navigate('Wishlist')}>
              <Heart size={20} color="#1e1e1e" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >

        {/* Search Input Row */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBarContainer, { backgroundColor: theme.bg.card }, shadows.premium]}>
            <Search size={18} color="#9e9e9e" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { fontFamily: fonts.regular, color: theme.text.primary }]}
              placeholder="Search.."
              placeholderTextColor="#9e9e9e"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
          </View>
        </View>



        {/* Main Promotional Banners Slider */}
        <BannerCarousel
          banners={banners}
          categories={categories}
          theme={theme}
          fonts={fonts}
          navigation={navigation}
        />

        {/* Categories Section */}
        {categories.length > 0 && (
          <CategoryList
            categories={categories}
            theme={theme}
            fonts={fonts}
            shadows={shadows}
            navigation={navigation}
          />
        )}

        {/* Offers Section */}
        <SpecialOffersSection
          offers={offers}
          products={products}
          cartItems={cartItems}
          theme={theme}
          fonts={fonts}
          navigation={navigation}
          handleAddToCart={handleAddToCart}
        />

        {/* Trending Products Section */}
        <ProductGridSection
          title="Trending Now"
          products={trendingProducts}
          type="grid"
          onSeeAll={() => navigation.navigate('TrendingProducts')}
          renderProductCard={renderProductCard}
          theme={theme}
          fonts={fonts}
          shadows={shadows}
          buttonTitle="View All Trending"
        />

        {/* Promo Reels Section */}
        <PromoReelsSection
          promos={promos}
          cartItems={cartItems}
          navigation={navigation}
          theme={theme}
          fonts={fonts}
          handleAddToCart={handleAddToCart}
        />

        {/* New Arrivals Section */}
        <ProductGridSection
          title="New Arrivals"
          products={newArrivals}
          type="horizontal"
          onSeeAll={() => navigation.navigate('NewArrivals')}
          renderProductCard={renderProductCard}
          theme={theme}
          fonts={fonts}
          shadows={shadows}
          buttonTitle="View All"
        />

        {/* Top Selling Items Section */}
        <TopSellingSection
          title="Top Selling Items"
          products={bestSellers}
          onSeeAll={() => navigation.navigate('BestSellers')}
          theme={theme}
          fonts={fonts}
          shadows={shadows}
          navigation={navigation}
          cartItems={cartItems}
          handleAddToCart={handleAddToCart}
        />

        {/* Just For You Header */}
        <ProductGridSection
          title="Just For You"
          products={filteredProducts}
          type="grid"
          onSeeAll={() => navigation.navigate('Browse')}
          renderProductCard={renderProductCard}
          theme={theme}
          fonts={fonts}
          shadows={shadows}
          buttonTitle="See All Products"
        />

      </Animated.ScrollView>
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
  skeletonLine: {
    borderRadius: 4,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
    height: Platform.OS === 'ios' ? 114 : 94, // Fixed height for absolute children
    justifyContent: 'center',
  },
  absoluteHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eaeaea',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  greetingContainer: {
    justifyContent: 'center',
    flex: 1,
    flexShrink: 1,
  },
  helloText: {
    fontSize: 12,
  },
  welcomeText: {
    fontSize: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 14,
    gap: 12,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  filterSettingsBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  seeAllText: {
    fontSize: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    rowGap: 12,
  },
  categoryCard: {
    width: (width - 64) / 3, // 40 for horizontal padding + 24 for gaps
    height: 64,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryCardTextContainer: {
    flex: 1,
  },
  categoryCardText: {
    fontSize: 10,
    lineHeight: 14,
  },
  categoryCardImageContainer: {
    width: 32,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCardImage: {
    width: '100%',
    height: '100%',
  },
  offerCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 12,
    alignItems: 'stretch',
  },
  offerImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#ebf4f9', // light blue
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  offerImage: {
    width: '80%',
    height: '80%',
  },
  offerDiscountBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  offerDiscountText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  offerInfoContainer: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'space-between',
  },
  offerTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  offerDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  offerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  offerOriginalPrice: {
    fontSize: 10,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginBottom: -2,
  },
  offerPrice: {
    fontSize: 15,
  },
  offerCartBtn: {
    width: 32,
    height: 32,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBuyBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  offerBuyBtnText: {
    color: '#ffffff',
    fontSize: 12,
  },
  bannerCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    height: 150,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 20,
  },
  bannerLeft: {
    flex: 1.2,
    justifyContent: 'center',
    paddingLeft: 24,
    gap: 12,
  },
  bannerTitleText: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 22,
  },
  bannerBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  bannerBtnText: {
    fontSize: 11,
  },
  bannerRight: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 100,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  productCard: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '48%',
    marginBottom: 16,
  },
  productImageWrapper: {
    position: 'relative',
    height: 160,
    width: '100%',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  productInfo: {
    padding: 10,
    gap: 4,
  },
  productName: {
    fontSize: 13,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  productPrice: {
    fontSize: 13,
  },
  originalPriceText: {
    fontSize: 10,
    color: '#9e9e9e',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  cartBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  midBanner: {
    width: width - 40,
    height: 75,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 12,
    alignSelf: 'center',
  },
  midBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  midBannerPercent: {
    fontSize: 28,
    color: '#ffffff',
  },
  midBannerText: {
    fontSize: 12,
    color: '#ffffff',
    lineHeight: 15,
  },
  midBannerArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerSlider: {
    height: 150,
    marginBottom: 20,
  },
  bannerSliderContent: {
    paddingHorizontal: 0,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  seeAllBtnText: {
    fontSize: 11,
  },

  /* Modal styling for Referral Success */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  modalSvgContainer: {
    marginBottom: 16,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  modalCloseBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 1,
  },
  promoReelWrapper: {
    width: 280,
    height: 510, // 480 (card) + 30 (hanging buttons)
    position: 'relative',
    marginBottom: 0,
  },
  promoReelCard: {
    width: '100%',
    height: 480,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  promoReelFloatingActions: {
    position: 'absolute',
    bottom: 0, // Now positioned at the very bottom of the wrapper, inside bounds
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 20,
  },
  promoReelImage: {
    width: '100%',
    height: '100%',
  },
  promoReelOverlayGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  promoReelTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  promoReelTopLeftText: {
    fontSize: 9,
    color: '#0f172a',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  promoReelTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'column',
    gap: 8,
    zIndex: 10,
  },
  promoReelMiniBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  promoPlayCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 120,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  promoPlayCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  promoReelBottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    zIndex: 10,
  },
  promoReelSubBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  promoReelSubBadgeText: {
    fontSize: 9,
    color: '#0f172a',
  },
  promoReelTitleText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 4,
  },
  promoReelDescText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 12,
  },
  promoReelActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  promoReelActionRoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoReelActionRoundBtnLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelsVignetteTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  reelsVignetteBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 350,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  reelsTopLeftBadge: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  reelsTopRightContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  reelsMiniCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  reelsBottomContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  reelsSubBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  reelsActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  reelsActionRoundBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  reelsActionRoundBtnLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  addressBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  addressBarIcon: {
    marginRight: 6,
  },
  addressBarText: {
    fontSize: 12,
    lineHeight: 16,
  },
  addressModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addressModalCloseArea: {
    flex: 1,
  },
  addressModalSheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  addressModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  addressModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  addressModalTitle: {
    fontSize: 16,
  },
  addressModalCloseBtn: {
    padding: 4,
  },
  addressModalScroll: {
    paddingHorizontal: 24,
  },
  addressModalSection: {
    marginBottom: 20,
  },
  addressModalSectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#f0f0f2',
    padding: 16,
  },
  addressCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  addressCardIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  addressCardName: {
    fontSize: 13,
    marginBottom: 4,
  },
  addressCardText: {
    fontSize: 12,
    lineHeight: 16,
  },
  addressCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pincodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pincodeInputContainer: {
    flex: 1,
    height: 44,
    borderRadius: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  pincodeInput: {
    fontSize: 13,
    height: '100%',
  },
  pincodeVerifyBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pincodeVerifyText: {
    fontSize: 12,
  },
  citiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f0f0f2',
    backgroundColor: '#ffffff',
  },
  cityChipText: {
    fontSize: 12,
  },
  addressInputContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    minHeight: 80,
  },
  addressDetailInput: {
    fontSize: 13,
    lineHeight: 18,
    height: '100%',
    textAlignVertical: 'top',
  },
  addressSaveBtn: {
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressSaveBtnText: {
    fontSize: 13,
  },
  headerAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
    flex: 1,
    width: '100%',
  },
  headerAddressText: {
    fontSize: 13,
    flex: 1,
    flexShrink: 1,
  },
  addressSearchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  addressSearchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  actionLinkText: {
    fontSize: 14,
  },
  savedAddressesTitleText: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 12,
  },
  savedAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 16,
    marginBottom: 12,
  },
  savedAddressCardLeft: {
    alignItems: 'center',
    marginRight: 14,
    width: 60,
  },
  savedAddressIconBox: {
    width: 44,
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  youAreHereText: {
    fontSize: 10,
    textAlign: 'center',
  },
  savedAddressCardMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  savedAddressCardName: {
    fontSize: 14,
  },
  selectedPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedPillText: {
    fontSize: 10,
  },
  savedAddressCardAddr: {
    fontSize: 12,
    lineHeight: 16,
  },
  savedAddressCardPhone: {
    fontSize: 12,
  },
  savedAddressCardRight: {
    padding: 8,
    alignSelf: 'center',
  },
});
