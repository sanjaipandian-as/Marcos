import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Dimensions,
  Image
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Sparkles, 
  ChevronLeft, 
  MapPin, 
  ChevronDown, 
  CheckCircle2, 
  X,
  ShieldCheck,
  Info,
  Check
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const AVAILABLE_SLOTS = [
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 01:00 PM",
  "01:00 PM - 02:00 PM",
  "02:00 PM - 03:00 PM",
  "03:00 PM - 04:00 PM",
  "04:00 PM - 05:00 PM",
  "05:00 PM - 06:00 PM",
  "06:00 PM - 07:00 PM",
  "07:00 PM - 08:00 PM"
];

// Helper to dynamically build slots from start/end times and duration
const generateSlots = (startStr, endStr, durationMins) => {
  if (!startStr || !endStr) return AVAILABLE_SLOTS;
  
  const slots = [];
  try {
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    
    let current = new Date();
    current.setHours(startH, startM, 0, 0);
    
    const end = new Date();
    end.setHours(endH, endM, 0, 0);
    
    const formatTime = (dateObj) => {
      let h = dateObj.getHours();
      const m = String(dateObj.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    };
    
    while (current < end) {
      const next = new Date(current.getTime() + durationMins * 60 * 1000);
      if (next > end) break;
      slots.push(`${formatTime(current)} - ${formatTime(next)}`);
      current = next;
    }
  } catch (e) {
    console.error('Error generating slots:', e);
  }
  
  return slots.length > 0 ? slots : AVAILABLE_SLOTS;
};

export default function BespokeBookingScreen({ navigation, route }) {
  const { theme, fonts, shadows } = useTheme();
  const { requireAuth } = useAuth();
  
  // Params passed from ProductDetails
  const { 
    prefillProduct = 'Product Masterpiece', 
    prefillCategory = 'Product Consultation', 
    prefillProductImage = '' 
  } = route.params || {};

  // Fitting mode: 'STUDIO' (In-Store) or 'HOME' (Home Visit)
  const [fittingMode, setFittingMode] = useState('STUDIO');
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  // Form states
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Quick Order states
  const [isQuickOrder, setIsQuickOrder] = useState(false);
  const [quickOrderExpectedDate, setQuickOrderExpectedDate] = useState('');
  const [quickOrderReason, setQuickOrderReason] = useState('');
  const [showExpectedDateCalendar, setShowExpectedDateCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  // Address states
  const [customAddress, setCustomAddress] = useState('');
  const [savedAddressesList, setSavedAddressesList] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Availability & Slots states
  const [availableSlots, setAvailableSlots] = useState(AVAILABLE_SLOTS);
  const [bookedSlotsCounts, setBookedSlotsCounts] = useState({});
  const [maxBookingsPerSlot, setMaxBookingsPerSlot] = useState(3);

  // Load Saved Addresses
  const loadAddresses = async () => {
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
      console.error('Error loading addresses:', e);
    }
  };

  // Load Slot Settings & Bookings from system settings
  const fetchSettings = async () => {
    try {
      const res = await api.get('/system/settings/public');
      if (res.success && res.data) {
        if (res.data.maxBookingsPerSlot) {
          setMaxBookingsPerSlot(Number(res.data.maxBookingsPerSlot));
        }
        
        const start = res.data.businessHoursStart || '09:00';
        const end = res.data.businessHoursEnd || '18:00';
        const duration = Number(res.data.bookingSlotDurationMinutes) || 60;
        
        const generated = generateSlots(start, end, duration);
        setAvailableSlots(generated);
      }
    } catch (err) {
      console.error('Error loading settings from /system/settings/public:', err);
    }
  };

  const loadBookedSlots = async (dateObj) => {
    try {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      const res = await api.get(`/appointments/availability?date=${formattedDate}`);
      if (res.success && res.data) {
        setBookedSlotsCounts(res.data);
      } else {
        setBookedSlotsCounts({});
      }
    } catch (err) {
      console.error('Error loading slot availability:', err);
      setBookedSlotsCounts({});
    }
  };

  useEffect(() => {
    loadAddresses();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedDate && fittingMode === 'STUDIO') {
      loadBookedSlots(selectedDate);
    }
  }, [selectedDate, fittingMode]);

  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handlePrevMonth = () => {
    const prev = new Date(currentCalendarMonth);
    prev.setMonth(prev.getMonth() - 1);
    const today = new Date();
    if (prev.getFullYear() < today.getFullYear() || (prev.getFullYear() === today.getFullYear() && prev.getMonth() < today.getMonth())) {
      return;
    }
    setCurrentCalendarMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentCalendarMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentCalendarMonth(next);
  };

  const getFilteredAvailableSlots = () => {
    if (!selectedDate) return availableSlots;
    
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const now = new Date();

    return availableSlots.filter(s => {
      const count = bookedSlotsCounts[s] || 0;
      if (count >= maxBookingsPerSlot) return false;

      if (isToday) {
        try {
          const startPart = s.split(' - ')[0];
          const [time, modifier] = startPart.split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          
          if (modifier === 'PM' && hours !== 12) {
            hours += 12;
          }
          if (modifier === 'AM' && hours === 12) {
            hours = 0;
          }
          
          const slotStartTime = new Date(now);
          slotStartTime.setHours(hours, minutes, 0, 0);
          
          if (now >= slotStartTime) {
            return false;
          }
        } catch (e) {
          console.error(e);
        }
      }
      return true;
    });
  };

  const validateForm = () => {
    const tempErrors = {};
    if (!selectedDate) tempErrors.date = 'Please select a date';
    if (fittingMode === 'STUDIO' && !timeSlot) tempErrors.timeSlot = 'Please select a time slot';
    if (fittingMode === 'HOME' && !customAddress) tempErrors.address = 'Please specify a fitting address';
    if (isQuickOrder) {
      if (!quickOrderExpectedDate) tempErrors.quickDate = 'Please select expected delivery date';
      if (!quickOrderReason.trim()) tempErrors.quickReason = 'Please specify reason for quick order';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleBookingSubmit = async () => {
    requireAuth(async () => {
      if (!validateForm()) return;
      setSubmitting(true);

    try {
      const yearVal = selectedDate.getFullYear();
      const monthVal = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dayVal = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${yearVal}-${monthVal}-${dayVal}T12:00:00.000Z`;

      let quickOrderText = '';
      if (isQuickOrder) {
        quickOrderText = `\n[QUICK_ORDER]\nExpected Date: ${quickOrderExpectedDate}\nReason: ${quickOrderReason}\n`;
      }

      let res;
      if (fittingMode === 'STUDIO') {
        res = await api.post('/appointments', {
          date: formattedDate,
          timeSlot,
          productType: prefillProduct,
          type: 'CONSULTATION',
          notes: `Category: ${prefillCategory}\nProductImage: ${prefillProductImage}\nFitting Address: In-Store\n${notes}${quickOrderText}`,
        });
      } else {
        res = await api.post('/visits', {
          preferredDate: formattedDate,
          address: customAddress,
          requirements: `Product: ${prefillProduct}\nCategory: ${prefillCategory}\nProductImage: ${prefillProductImage}\n${notes}${quickOrderText}`,
        });
      }

      if (res.success) {
        setShowSuccessModal(true);
        resetForm();
      } else {
        Alert.alert('Booking Failed', res.message || 'Unable to schedule booking.');
      }
    } catch (err) {
      console.error('Submit booking error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
        setSubmitting(false);
      }
    });
  };

  const resetForm = () => {
    setSelectedDate(null);
    setTimeSlot('');
    setNotes('');
    setCustomAddress('');
    setIsQuickOrder(false);
    setQuickOrderExpectedDate('');
    setQuickOrderReason('');
    setErrors({});
  };

  const renderExpectedDateCalendarModal = () => {
    if (!showExpectedDateCalendar) return null;
    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let year = calendarViewDate.getFullYear();
    let month = calendarViewDate.getMonth();

    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));

    const handlePrevMonth = () => {
      const newDate = new Date(year, month - 1, 1);
      if (newDate.getFullYear() > today.getFullYear() || (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() >= today.getMonth())) {
        setCalendarViewDate(newDate);
      }
    };
    const handleNextMonth = () => {
      setCalendarViewDate(new Date(year, month + 1, 1));
    };

    return (
      <Modal visible={showExpectedDateCalendar} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '85%', padding: 20, borderRadius: 24, backgroundColor: '#ffffff' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 8, marginBottom: 16 }}>
              <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
                <Text style={{ fontSize: 20, color: (year === today.getFullYear() && month === today.getMonth()) ? '#cbd5e1' : theme.brand[500], fontFamily: fonts.bold }}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 15, color: '#1e293b', fontFamily: fonts.bold }}>
                {monthNames[month]} {year}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
                <Text style={{ fontSize: 20, color: theme.brand[500], fontFamily: fonts.bold }}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 }}>
              {days.map((date, i) => {
                if (!date) return <View key={i} style={{ width: '14.28%', height: 36 }} />;
                const yearVal = date.getFullYear();
                const monthVal = String(date.getMonth() + 1).padStart(2, '0');
                const dayVal = String(date.getDate()).padStart(2, '0');
                const dateStr = `${yearVal}-${monthVal}-${dayVal}`;
                const isSelected = quickOrderExpectedDate === dateStr;
                const isPast = date < today;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[{ width: '14.28%', height: 36, alignItems: 'center', justifyContent: 'center' }, isSelected && { backgroundColor: theme.brand[500], borderRadius: 12 }]}
                    disabled={isPast}
                    onPress={() => {
                      setQuickOrderExpectedDate(dateStr);
                      setShowExpectedDateCalendar(false);
                    }}
                  >
                    <Text style={[{ fontSize: 13, color: isPast ? '#cbd5e1' : '#1e293b', fontFamily: fonts.bold }, isSelected && { color: '#ffffff' }]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={{ marginTop: 20, padding: 12, alignItems: 'center', justifyContent: 'center' }} onPress={() => setShowExpectedDateCalendar(false)}>
              <Text style={{ color: theme.brand[500], fontFamily: fonts.bold, fontSize: 14 }}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const handleAddressSelect = async (addrStr) => {
    setCustomAddress(addrStr);
    await AsyncStorage.setItem('active_delivery_address', addrStr);
    setShowAddressModal(false);
  };

  // Generate Date Buttons for Picker (Next 7 days)
  const getNext7Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {/* Header */}
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.backBtn, shadows.premium]} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary, fontFamily: fonts.bold }]}>
          Bespoke Consultation
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product Preview Card */}
        <View style={[styles.productCard, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <Image source={{ uri: prefillProductImage || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=300' }} style={styles.productImage} />
          <View style={styles.productInfo}>
            <Text style={[styles.productCategory, { fontFamily: fonts.medium, color: theme.brand[500] }]}>{prefillCategory}</Text>
            <Text style={[styles.productName, { fontFamily: fonts.bold, color: theme.text.primary }]} numberOfLines={2}>{prefillProduct}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Sparkles size={12} color={theme.text.muted} style={{ marginRight: 4 }} />
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: theme.text.secondary }}>Customized Stitching & Fitting</Text>
            </View>
          </View>
        </View>

        {/* Dropdown for Fitting Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Consultation Type
          </Text>
          <TouchableOpacity 
            style={[styles.dropdownBtn, { backgroundColor: theme.bg.card, borderColor: theme.border }]}
            onPress={() => setShowModeDropdown(v => !v)}
            activeOpacity={0.8}
          >
            <Sparkles size={16} color={theme.brand[500]} style={{ marginRight: 10 }} />
            <Text style={{ flex: 1, fontFamily: fonts.semiBold, fontSize: 14, color: theme.text.primary }}>
              {fittingMode === 'STUDIO' ? 'Studio Fitting (In-Store)' : 'Home Visit (Tailor at Home)'}
            </Text>
            <ChevronDown size={18} color={theme.text.muted} />
          </TouchableOpacity>

          {showModeDropdown && (
            <View style={[styles.dropdownList, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
              <TouchableOpacity 
                style={styles.dropdownItem}
                onPress={() => { setFittingMode('STUDIO'); setShowModeDropdown(false); }}
                activeOpacity={0.7}
              >
                <Text style={{ flex: 1, fontFamily: fonts.medium, color: theme.text.primary, fontSize: 13 }}>Studio Fitting (In-Store)</Text>
                {fittingMode === 'STUDIO' && <Check size={16} color={theme.brand[500]} />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dropdownItem, { borderTopWidth: 1, borderTopColor: theme.border }]}
                onPress={() => { setFittingMode('HOME'); setShowModeDropdown(false); }}
                activeOpacity={0.7}
              >
                <Text style={{ flex: 1, fontFamily: fonts.medium, color: theme.text.primary, fontSize: 13 }}>Home Visit (Tailor at Home)</Text>
                {fittingMode === 'HOME' && <Check size={16} color={theme.brand[500]} />}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Measurement & Visit Location Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Measurement & Visit Location
          </Text>
          <TouchableOpacity 
            style={[styles.addressSelector, { backgroundColor: theme.bg.card, borderColor: theme.border }]} 
            onPress={() => setShowAddressModal(true)}
            activeOpacity={0.8}
          >
            <MapPin size={18} color={theme.brand[500]} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: theme.text.primary }}>
                {customAddress ? 'Tailor Visit Location' : 'Choose Address'}
              </Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: theme.text.secondary, marginTop: 2 }} numberOfLines={1}>
                {customAddress || 'Select home address for measurement session'}
              </Text>
            </View>
            <ChevronDown size={16} color={theme.text.muted} />
          </TouchableOpacity>
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
        </View>

        {/* Date Selection Section (Custom Calendar) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Select Date (Full Month)
          </Text>
          
          <View style={[styles.calendarContainer, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
                <ChevronLeft size={16} color={theme.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.calendarMonthText, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                {currentCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
                <View style={{ transform: [{ rotate: '180deg' }] }}>
                  <ChevronLeft size={16} color={theme.text.primary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={styles.weekdaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                <Text key={i} style={[styles.weekdayText, { fontFamily: fonts.semiBold, color: theme.text.secondary }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {getDaysInMonth(currentCalendarMonth).map((date, idx) => {
                if (!date) {
                  return <View key={idx} style={styles.dayCellEmpty} />;
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPast = date < today;
                const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();

                return (
                  <TouchableOpacity
                    key={idx}
                    disabled={isPast}
                    onPress={() => setSelectedDate(date)}
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: theme.brand[500] },
                      isPast && { opacity: 0.25 }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        { fontFamily: fonts.medium, color: theme.text.primary },
                        isSelected && { color: '#3D2E3D', fontFamily: fonts.bold },
                        isPast && { color: theme.text.muted }
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Time Slots Section (Only for STUDIO mode) */}
        {fittingMode === 'STUDIO' && selectedDate && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
              Available In-Store Slots
            </Text>
            <View style={styles.slotsGrid}>
              {getFilteredAvailableSlots().map((slot, idx) => {
                const isSelected = timeSlot === slot;
                return (
                  <TouchableOpacity 
                    key={idx}
                    style={[
                      styles.slotBtn, 
                      { backgroundColor: theme.bg.card, borderColor: theme.border },
                      isSelected && { backgroundColor: theme.brand[500], borderColor: theme.brand[500] }
                    ]}
                    onPress={() => setTimeSlot(slot)}
                    activeOpacity={0.8}
                  >
                    <Clock size={12} color={isSelected ? '#3D2E3D' : theme.text.secondary} style={{ marginRight: 6 }} />
                    <Text style={[styles.slotText, { color: theme.text.primary, fontFamily: fonts.semiBold }, isSelected && { color: '#3D2E3D' }]}>
                      {slot.split(' ')[0]} {slot.split(' ')[1]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.timeSlot && <Text style={styles.errorText}>{errors.timeSlot}</Text>}
          </View>
        )}

        {/* Quick Order */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Quick Order Option
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdownBtn, 
              { backgroundColor: theme.bg.card, borderColor: theme.border },
              isQuickOrder && { backgroundColor: theme.brand[50], borderColor: theme.brand[200] }
            ]}
            onPress={() => setIsQuickOrder(!isQuickOrder)}
            activeOpacity={0.8}
          >
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: isQuickOrder ? theme.brand[500] : '#64748b', marginRight: 10, alignItems: 'center', justifyContent: 'center' }}>
              {isQuickOrder && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.brand[500] }} />}
            </View>
            <Text style={{ flex: 1, fontFamily: fonts.bold, color: theme.text.primary, fontSize: 13 }}>
              Request as Quick Order
            </Text>
          </TouchableOpacity>

          {isQuickOrder && (
            <View style={{ marginTop: 10, padding: 14, borderRadius: 16, borderHeight: 1, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.bg.card }}>
              <Text style={{ fontFamily: fonts.bold, color: theme.brand[500], fontSize: 12, marginBottom: 5 }}>Expected Delivery Date *</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 8, marginBottom: 12 }}
                onPress={() => setShowExpectedDateCalendar(true)}
                activeOpacity={0.8}
              >
                <CalendarIcon size={16} color={theme.brand[500]} style={{ marginRight: 8 }} />
                <Text style={{ fontFamily: fonts.bold, color: theme.text.primary, flex: 1, fontSize: 13 }}>
                  {quickOrderExpectedDate ? quickOrderExpectedDate : 'Select Expected Date'}
                </Text>
              </TouchableOpacity>
              {errors.quickDate && <Text style={{ color: '#ef4444', fontSize: 11, marginBottom: 8 }}>{errors.quickDate}</Text>}

              <Text style={{ fontFamily: fonts.bold, color: theme.brand[500], fontSize: 12, marginBottom: 5 }}>Reason for Quick Order *</Text>
              <TextInput
                style={{ fontFamily: fonts.regular, color: theme.text.primary, fontSize: 13, minHeight: 48 }}
                placeholder="Why do you need this order quick?"
                placeholderTextColor={theme.text.muted}
                value={quickOrderReason}
                onChangeText={setQuickOrderReason}
                multiline
              />
              {errors.quickReason && <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{errors.quickReason}</Text>}
            </View>
          )}
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Fitting Instructions / Notes
          </Text>
          <TextInput 
            style={[styles.notesInput, { backgroundColor: theme.bg.card, borderColor: theme.border, color: theme.text.primary, fontFamily: fonts.regular }]}
            placeholder="Add any specific requests (e.g. customized sleeve width, height modifications)"
            placeholderTextColor={theme.text.muted}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Guidelines / Rules Card */}
        <View style={[styles.rulesCard, { backgroundColor: theme.brand[50], borderColor: theme.brand[100] }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <ShieldCheck size={18} color="#6B4B6B" style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: '#3D2E3D' }}>MARCOS Consultation Rules & Guidelines</Text>
          </View>
          <View style={{ gap: 6 }}>
            <View style={styles.ruleRow}>
              <CheckCircle2 size={12} color="#6B4B6B" style={{ marginTop: 2, marginRight: 6 }} />
              <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 11, color: '#5C4A5C', lineHeight: 16 }}>
                {fittingMode === 'STUDIO' 
                  ? 'Please arrive at the MARCOS Studio 10 minutes prior to your scheduled time slot for master fitting.'
                  : 'Our master tailors will visit your fitting address at the scheduled date to take physical measurements.'}
              </Text>
            </View>
            <View style={styles.ruleRow}>
              <CheckCircle2 size={12} color="#6B4B6B" style={{ marginTop: 2, marginRight: 6 }} />
              <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 11, color: '#5C4A5C', lineHeight: 16 }}>
                Once measurements are complete, your custom order details will be updated in the system for admin manual checkout.
              </Text>
            </View>
            <View style={styles.ruleRow}>
              <CheckCircle2 size={12} color="#6B4B6B" style={{ marginTop: 2, marginRight: 6 }} />
              <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 11, color: '#5C4A5C', lineHeight: 16 }}>
                Offline payments can be cleared with administrators once the order has been generated.
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitBtn, { backgroundColor: theme.brand[500] }]}
          onPress={handleBookingSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#3D2E3D" />
          ) : (
            <Text style={[styles.submitBtnText, { fontFamily: fonts.bold, color: '#3D2E3D' }]}>
              {fittingMode === 'STUDIO' ? 'Schedule Studio Appointment' : 'Schedule Home Measurement'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Saved Addresses Selector Modal */}
      <Modal visible={showAddressModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowAddressModal(false)} />
          <View style={[styles.modalCard, { backgroundColor: theme.bg.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitleText, { color: theme.text.primary, fontFamily: fonts.bold }]}>
                Select Fitting Address
              </Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <X size={20} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {savedAddressesList.map((addr, idx) => (
                <TouchableOpacity 
                  key={idx}
                  style={[styles.addressItem, { borderColor: theme.border }]}
                  onPress={() => handleAddressSelect(addr.address)}
                  activeOpacity={0.7}
                >
                  <MapPin size={16} color={theme.brand[500]} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: theme.text.primary }}>{addr.name} ({addr.label})</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: theme.text.secondary, marginTop: 2 }}>{addr.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity 
                style={[styles.addressItem, { borderStyle: 'dashed', borderColor: theme.brand[300] }]}
                onPress={() => {
                  setShowAddressModal(false);
                  Alert.alert('New Address', 'To add a new address, please use the Address Manager on the Home Tab.');
                }}
                activeOpacity={0.7}
              >
                <Info size={16} color={theme.brand[500]} style={{ marginRight: 10 }} />
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: theme.brand[500] }}>Add new address via home settings</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {renderExpectedDateCalendarModal()}

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successModalOverlay}>
          <View style={[styles.successModalCard, { backgroundColor: theme.bg.card }]}>
            <LottieView
              source={require('../../../assets/tick.json')}
              autoPlay
              loop={false}
              style={{ width: 140, height: 140 }}
              onAnimationFinish={() => {
                setTimeout(() => {
                  setShowSuccessModal(false);
                  navigation.navigate('MainTabs', { screen: 'BookingsTab' });
                }, 1000);
              }}
            />
            <Text style={{ fontFamily: fonts.bold, color: theme.text.primary, fontSize: 18, marginTop: 15, textAlign: 'center' }}>
              Booking Completed!
            </Text>
            <Text style={{ fontFamily: fonts.medium, color: theme.text.secondary, fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 10 }}>
              Your bespoke appointment has been successfully scheduled.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 14,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productCategory: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  addressSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  datePill: {
    width: 60,
    height: 70,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePillDay: {
    fontSize: 11,
    marginBottom: 4,
  },
  datePillNum: {
    fontSize: 18,
  },
  calendarContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginTop: 6,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calNavBtn: {
    padding: 6,
  },
  calendarMonthText: {
    fontSize: 14,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  dayCellText: {
    fontSize: 13,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '48%',
  },
  slotText: {
    fontSize: 11,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  rulesCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  submitBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  submitBtnText: {
    fontSize: 14,
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitleText: {
    fontSize: 16,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalCard: {
    width: '80%',
    padding: 30,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
});
