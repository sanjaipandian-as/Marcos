import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  Plus, 
  X, 
  ChevronLeft, 
  Trash2, 
  MapPin, 
  User, 
  Info,
  ChevronRight,
  Clock3,
  ArrowRight,
  Home,
  Briefcase,
  CheckCircle2,
  ChevronDown
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function AppointmentBookingScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const [appointments, setAppointments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Tab View Toggle: 'SERVICE' or 'VISIT'
  const [activeTab, setActiveTab] = useState('SERVICE');
  
  // Date Picker States
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Form states
  const [apptCategory, setApptCategory] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState('');
  
  // Validation states
  const [errors, setErrors] = useState({});

  // Rescheduling states
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [reschedulingItem, setReschedulingItem] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [calendarTarget, setCalendarTarget] = useState('BOOKING'); // 'BOOKING' or 'RESCHEDULE'

  const scrollY = React.useRef(new Animated.Value(0)).current;

  const availableSlots = [
    '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '14:00 - 15:00',
    '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00'
  ];

  const loadData = async () => {
    try {
      if (appointments.length === 0 && visits.length === 0) {
        setLoading(true);
      }
      const [apptsRes, visitsRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/visits')
      ]);
      if (apptsRes.success) setAppointments(apptsRes.data);
      if (visitsRes.success) setVisits(visitsRes.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, appointments, visits]);

  const validateForm = () => {
    const newErrors = {};
    if (!selectedDate) newErrors.date = 'Date is required';
    if (activeTab === 'SERVICE') {
      if (!apptCategory.trim()) newErrors.category = 'Category is required';
      if (!timeSlot) newErrors.timeSlot = 'Time slot is required';
      if (!productDetails.trim()) newErrors.product = 'Details are required';
    } else {
      if (!address.trim()) newErrors.address = 'Address is required';
      if (!notes.trim()) newErrors.notes = 'Requirements are required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBooking = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      // Use UTC date construction to avoid timezone-related off-by-one date issues.
      // getFullYear/getMonth/getDate return LOCAL calendar values (which match what
      // the user saw in the calendar picker), then we pin the time to noon UTC so
      // the stored UTC date stays on the same calendar day as the user's selection.
      const yearVal = selectedDate.getFullYear();
      const monthVal = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dayVal = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${yearVal}-${monthVal}-${dayVal}T12:00:00.000Z`;
      let res;
      if (activeTab === 'SERVICE') {
        res = await api.post('/appointments', {
          date: formattedDate,
          timeSlot,
          productType: productDetails,
          type: 'CONSULTATION',
          notes: `Category: ${apptCategory}\n${notes}`,
        });
      } else {
        res = await api.post('/visits', {
          preferredDate: formattedDate,
          address,
          requirements: notes,
        });
      }

      if (res.success) {
        Alert.alert('Success', `${activeTab === 'SERVICE' ? 'Service' : 'Home Visit'} booked successfully.`);
        setBookingModalVisible(false);
        resetForm();
        loadData();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Booking failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(null);
    setApptCategory('');
    setTimeSlot('');
    setProductDetails('');
    setNotes('');
    setAddress('');
    setErrors({});
  };

  const handleReschedulePress = (item) => {
    const isVisit = !!item.address;
    setReschedulingItem(item);
    
    const dateStr = isVisit ? item.preferredDate : item.date;
    const bDate = new Date(dateStr);
    const localDate = new Date(bDate.getUTCFullYear(), bDate.getUTCMonth(), bDate.getUTCDate());
    
    setRescheduleDate(localDate);
    setRescheduleTimeSlot(isVisit ? '' : (item.timeSlot || ''));
    
    let initialNotes = '';
    if (isVisit) {
      initialNotes = item.requirements || '';
    } else {
      initialNotes = item.notes || '';
    }
    setRescheduleNotes(initialNotes);
    setErrors({});
    setRescheduleModalVisible(true);
  };

  const handleCancelPress = (item) => {
    const isVisit = !!item.address;
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel this ${isVisit ? 'home visit' : 'standard'} booking?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const endpoint = isVisit ? `/visits/${item.id}` : `/appointments/${item.id}`;
              const res = await api.put(endpoint, { status: 'CANCELLED' });
              if (res.success) {
                Alert.alert('Success', 'Booking cancelled successfully.');
                loadData();
              } else {
                Alert.alert('Error', res.message || 'Failed to cancel booking.');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'An error occurred.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const submitReschedule = async () => {
    if (!rescheduleDate) {
      setErrors({ rescheduleDate: 'Date is required' });
      return;
    }
    const isVisit = !!reschedulingItem.address;
    if (!isVisit && !rescheduleTimeSlot) {
      setErrors({ rescheduleTimeSlot: 'Time slot is required' });
      return;
    }
    
    setSubmitting(true);
    try {
      const yearVal = rescheduleDate.getFullYear();
      const monthVal = String(rescheduleDate.getMonth() + 1).padStart(2, '0');
      const dayVal = String(rescheduleDate.getDate()).padStart(2, '0');
      const formattedDate = `${yearVal}-${monthVal}-${dayVal}T12:00:00.000Z`;
      
      const endpoint = isVisit ? `/visits/${reschedulingItem.id}` : `/appointments/${reschedulingItem.id}`;
      const payload = isVisit 
        ? { preferredDate: formattedDate, requirements: rescheduleNotes }
        : { date: formattedDate, timeSlot: rescheduleTimeSlot, notes: rescheduleNotes };
        
      const res = await api.put(endpoint, payload);
      if (res.success) {
        Alert.alert('Success', 'Booking rescheduled successfully.');
        setRescheduleModalVisible(false);
        loadData();
      } else {
        Alert.alert('Error', res.message || 'Failed to reschedule.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCalendarModal = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);

    return (
      <Modal visible={showCalendarModal} transparent animationType="fade">
        <View style={styles.calendarOverlay}>
          <View style={[styles.calendarCard, { backgroundColor: '#ffffff' }]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}><ChevronLeft size={24} color="#1e293b" /></TouchableOpacity>
              <Text style={[styles.calendarMonthText, { color: '#1e293b', fontFamily: fonts.bold }]}>{monthNames[month]} {year}</Text>
              <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}><ChevronRight size={24} color="#1e293b" /></TouchableOpacity>
            </View>
            <View style={styles.weekDaysRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <Text key={i} style={[styles.weekDayText, { color: theme.text.muted, fontFamily: fonts.bold }]}>{day}</Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {days.map((item, i) => {
                const targetDate = calendarTarget === 'RESCHEDULE' ? rescheduleDate : selectedDate;
                const isSelected = targetDate && targetDate.toDateString() === item.date.toDateString();
                const isPast = item.date < today;
                return (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.dayCell, isSelected && { backgroundColor: theme.brand[500], borderRadius: 12 }]}
                    disabled={isPast || !item.isCurrentMonth}
                    onPress={() => {
                      if (calendarTarget === 'RESCHEDULE') {
                        setRescheduleDate(item.date);
                      } else {
                        setSelectedDate(item.date);
                      }
                      setShowCalendarModal(false);
                    }}
                  >
                    <Text style={[
                      styles.dayText, 
                      { fontFamily: fonts.bold },
                      !item.isCurrentMonth ? { color: '#e2e8f0' } : (isPast ? { color: '#cbd5e1' } : { color: '#1e293b' }),
                      isSelected && { color: '#ffffff' }
                    ]}>
                      {item.date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.closeCalendarBtn} onPress={() => setShowCalendarModal(false)}>
              <Text style={[styles.closeCalendarBtnText, { color: theme.brand[500], fontFamily: fonts.bold }]}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const formatBookingDate = (dateString) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;
    const day = dateObj.getUTCDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[dateObj.getUTCMonth()];
    const year = dateObj.getUTCFullYear();
    return `${day} ${month} ${year}`;
  };

  const renderBookingItem = ({ item }) => {
    const isVisit = !!item.address;
    const date = formatBookingDate(isVisit ? item.preferredDate : item.date);
    const showActions = item.status !== 'CANCELLED' && item.status !== 'COMPLETED';
    
    // Status colors
    const getStatusColor = () => {
      switch (item.status) {
        case 'COMPLETED': return '#10b981';
        case 'CANCELLED': return '#ef4444';
        default: return theme.brand[500];
      }
    };
    const statusColor = getStatusColor();
    
    return (
      <View style={[styles.premiumBookingCard, shadows.premium, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.typeBadge, { backgroundColor: theme.brand[50] }]}>
              {isVisit ? <Home size={12} color={theme.brand[600]} /> : <Briefcase size={12} color={theme.brand[600]} />}
              <Text style={[styles.typeBadgeText, { color: theme.brand[700], fontFamily: fonts.bold }]}>
                {isVisit ? 'HOME VISIT' : 'STANDARD'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={[styles.statusText, { color: statusColor, fontFamily: fonts.bold }]}>
                {item.status}
              </Text>
            </View>
          </View>
          
          <View style={styles.cardBody}>
            <View style={styles.dateBlock}>
               <Text style={[styles.dateMonthText, { fontFamily: fonts.semiBold, color: theme.brand[500] }]}>
                 {date.split(' ')[1]} {date.split(' ')[2]}
               </Text>
               <Text style={[styles.dateDayText, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                 {date.split(' ')[0]}
               </Text>
               {!isVisit && (
                 <Text style={[styles.timeSlotText, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
                   {item.timeSlot}
                 </Text>
               )}
            </View>
            
            <View style={styles.detailsBlock}>
              <View style={styles.infoRowPremium}>
                <MapPin size={14} color={theme.text.muted} />
                <Text style={[styles.infoTextPremium, { color: theme.text.secondary, fontFamily: fonts.medium }]} numberOfLines={1}>
                  {isVisit ? item.address : 'MARCOS In-Store'}
                </Text>
              </View>
              
              {/* Show Product Details */}
              {!isVisit && item.productType ? (
                <View style={styles.infoRowPremium}>
                  <Sparkles size={14} color={theme.text.muted} />
                  <Text style={[styles.infoTextPremium, { color: theme.text.secondary, fontFamily: fonts.medium }]} numberOfLines={1}>
                    {item.productType}
                  </Text>
                </View>
              ) : null}
              {isVisit && item.requirements ? (
                <View style={styles.infoRowPremium}>
                  <Sparkles size={14} color={theme.text.muted} />
                  <Text style={[styles.infoTextPremium, { color: theme.text.secondary, fontFamily: fonts.medium }]} numberOfLines={1}>
                    {item.requirements}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {showActions && (
            <View style={[styles.cardActionsPremium, { borderTopColor: theme.border }]}>
              <TouchableOpacity 
                style={[styles.cardActionBtnPremium, { backgroundColor: theme.bg.main }]} 
                onPress={() => handleReschedulePress(item)}
                activeOpacity={0.7}
              >
                <Calendar size={14} color={theme.text.primary} />
                <Text style={[styles.cardActionBtnTextPremium, { color: theme.text.primary, fontFamily: fonts.semiBold }]}>
                  Reschedule
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.cardActionBtnPremium, { backgroundColor: '#fef2f2' }]} 
                onPress={() => handleCancelPress(item)}
                activeOpacity={0.7}
              >
                <Trash2 size={14} color="#ef4444" />
                <Text style={[styles.cardActionBtnTextPremium, { color: '#ef4444', fontFamily: fonts.semiBold }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const currentData = activeTab === 'SERVICE' ? appointments : visits;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      <StatusBar barStyle="dark-content" translucent={false} />
      {renderCalendarModal()}
      
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Bookings
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Booking Type Selector */}
      <View style={[styles.bookingTypeToggle, shadows.premium, { backgroundColor: theme.bg.card }]}>
        <TouchableOpacity 
          style={[styles.toggleBtn, activeTab === 'SERVICE' && { backgroundColor: theme.brand[500] }]}
          onPress={() => setActiveTab('SERVICE')}
          activeOpacity={0.8}
        >
          <Briefcase size={18} color={activeTab === 'SERVICE' ? '#ffffff' : theme.text.secondary} />
          <Text style={[styles.toggleText, activeTab === 'SERVICE' && { color: '#ffffff' }, { fontFamily: fonts.bold }]}>Standard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, activeTab === 'VISIT' && { backgroundColor: theme.brand[500] }]}
          onPress={() => setActiveTab('VISIT')}
          activeOpacity={0.8}
        >
          <Home size={18} color={activeTab === 'VISIT' ? '#ffffff' : theme.text.secondary} />
          <Text style={[styles.toggleText, activeTab === 'VISIT' && { color: '#ffffff' }, { fontFamily: fonts.bold }]}>Home Visit</Text>
        </TouchableOpacity>
      </View>

      {loading && currentData.length === 0 ? (
        <View style={styles.listPadding}>
          {[1, 2, 3].map(idx => (
            <View key={idx} style={[styles.skeletonCard, shadows.premium, { backgroundColor: theme.border }]} />
          ))}
        </View>
      ) : currentData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.bg.card }]}>
            <Calendar size={48} color={theme.brand[300]} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text.primary, fontFamily: fonts.bold }]}>
            No {activeTab === 'SERVICE' ? 'Standard' : 'Home Visit'} Bookings
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.secondary, fontFamily: fonts.medium }]}>
            Schedule a session to plan or fit your bespoke masterpieces.
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={bookingModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#1e293b', fontFamily: fonts.bold }]}>NEW {activeTab === 'SERVICE' ? 'SERVICE' : 'HOME VISIT'}</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              
              <TouchableOpacity style={[styles.inputField, { backgroundColor: theme.bg.input, borderColor: theme.border }]} onPress={() => setShowCalendarModal(true)}>
                <Calendar size={20} color={theme.brand[500]} />
                <Text style={[styles.inputText, { color: theme.text.primary, fontFamily: fonts.medium }]}>{selectedDate ? selectedDate.toDateString() : 'Select Date'}</Text>
                <ChevronDown size={20} color={theme.text.muted} />
              </TouchableOpacity>
              {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

              {activeTab === 'SERVICE' ? (
                <>
                  <TextInput style={[styles.textInput, { backgroundColor: theme.bg.input, borderColor: theme.border, color: theme.text.primary }]} placeholder="Category (e.g. Wedding)" placeholderTextColor={theme.text.muted} value={apptCategory} onChangeText={setApptCategory} />
                  {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
                  <View style={styles.slotsRow}>
                    {availableSlots.map(s => (
                      <TouchableOpacity key={s} style={[styles.slot, { borderColor: theme.border }, timeSlot === s && { backgroundColor: theme.brand[500], borderColor: theme.brand[500] }]} onPress={() => setTimeSlot(s)}>
                        <Text style={[styles.slotText, { color: theme.text.secondary }, timeSlot === s && { color: '#ffffff' }, { fontFamily: fonts.bold }]}>{s.split(' ')[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput style={[styles.textInput, { backgroundColor: theme.bg.input, borderColor: theme.border, color: theme.text.primary }]} placeholder="Product Details" placeholderTextColor={theme.text.muted} value={productDetails} onChangeText={setProductDetails} />
                </>
              ) : (
                <TextInput style={[styles.textInput, { height: 80, backgroundColor: theme.bg.input, borderColor: theme.border, color: theme.text.primary }]} placeholder="Full Address" placeholderTextColor={theme.text.muted} multiline value={address} onChangeText={setAddress} />
              )}
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

              <TextInput style={[styles.textInput, { height: 80, backgroundColor: theme.bg.input, borderColor: theme.border, color: theme.text.primary }]} placeholder="Notes / Requirements" placeholderTextColor={theme.text.muted} multiline value={notes} onChangeText={setNotes} />
              {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.brand[500] }]} onPress={handleBooking} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={[styles.submitBtnText, { color: '#ffffff', fontFamily: fonts.bold }]}>CONFIRM BOOKING</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={rescheduleModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#1e293b', fontFamily: fonts.bold }]}>
                RESCHEDULE {reschedulingItem?.address ? 'HOME VISIT' : 'STANDARD'}
              </Text>
              <TouchableOpacity onPress={() => setRescheduleModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              
              <TouchableOpacity 
                style={[styles.inputField, { backgroundColor: theme.bg.input, borderColor: theme.border }]} 
                onPress={() => {
                  setCalendarTarget('RESCHEDULE');
                  setShowCalendarModal(true);
                }}
              >
                <Calendar size={20} color={theme.brand[500]} />
                <Text style={[styles.inputText, { color: theme.text.primary, fontFamily: fonts.medium }]}>
                  {rescheduleDate ? rescheduleDate.toDateString() : 'Select Date'}
                </Text>
                <ChevronDown size={20} color={theme.text.muted} />
              </TouchableOpacity>
              {errors.rescheduleDate && <Text style={styles.errorText}>{errors.rescheduleDate}</Text>}

              {reschedulingItem && !reschedulingItem.address ? (
                <>
                  <View style={styles.slotsRow}>
                    {availableSlots.map(s => (
                      <TouchableOpacity 
                        key={s} 
                        style={[
                          styles.slot, 
                          { borderColor: theme.border }, 
                          rescheduleTimeSlot === s && { backgroundColor: theme.brand[500], borderColor: theme.brand[500] }
                        ]} 
                        onPress={() => setRescheduleTimeSlot(s)}
                      >
                        <Text style={[
                          styles.slotText, 
                          { color: theme.text.secondary }, 
                          rescheduleTimeSlot === s && { color: '#ffffff' }, 
                          { fontFamily: fonts.bold }
                        ]}>
                          {s.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.rescheduleTimeSlot && <Text style={styles.errorText}>{errors.rescheduleTimeSlot}</Text>}
                </>
              ) : null}

              <TextInput 
                style={[styles.textInput, { height: 100, backgroundColor: theme.bg.input, borderColor: theme.border, color: theme.text.primary }]} 
                placeholder="Notes / Requirements" 
                placeholderTextColor={theme.text.muted} 
                multiline 
                value={rescheduleNotes} 
                onChangeText={setRescheduleNotes} 
              />

              <TouchableOpacity 
                style={[styles.submitBtn, { backgroundColor: theme.brand[500] }]} 
                onPress={submitReschedule} 
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={[styles.submitBtnText, { color: '#ffffff', fontFamily: fonts.bold }]}>
                    CONFIRM RESCHEDULE
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfaf7' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  skeletonCard: {
    height: 120,
    borderRadius: 20,
    marginBottom: 16,
  },
  bookingTypeToggle: { flexDirection: 'row', marginHorizontal: 24, marginTop: 14, backgroundColor: '#ffffff', borderRadius: 16, padding: 6 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  activeToggle: { backgroundColor: '#e85c1c' },
  toggleText: { fontSize: 13, color: '#767676' },
  activeToggleText: { color: '#ffffff' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listPadding: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100 },
  premiumBookingCard: { 
    borderRadius: 24, 
    marginBottom: 16, 
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardAccentLeft: {
    width: 6,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  typeBadgeText: { fontSize: 10, letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 10, letterSpacing: 0.5 },
  cardBody: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  dateBlock: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  dateMonthText: { fontSize: 12, textTransform: 'uppercase' },
  dateDayText: { fontSize: 24, marginTop: 2, marginBottom: 2 },
  timeSlotText: { fontSize: 11 },
  detailsBlock: { flex: 1, gap: 8 },
  infoRowPremium: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTextPremium: { fontSize: 13, flex: 1 },
  cardActionsPremium: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  cardActionBtnPremium: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cardActionBtnTextPremium: {
    fontSize: 13,
  },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#006241', alignItems: 'center', justifyContent: 'center', elevation: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, color: '#1e293b' },
  modalScroll: { paddingBottom: 30 },
  inputField: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16 },
  inputText: { flex: 1, marginLeft: 12, fontSize: 15, color: '#1e293b' },
  textInput: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15, color: '#1e293b', marginBottom: 16, textAlignVertical: 'top' },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  slot: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  activeSlot: { backgroundColor: '#006241', borderColor: '#006241' },
  slotText: { fontSize: 12, color: '#64748b' },
  activeSlotText: { color: '#ffffff' },
  submitBtn: { backgroundColor: '#006241', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitBtnText: { color: '#ffffff', fontSize: 16 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: -12, marginBottom: 12, marginLeft: 4 },
  calendarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 },
  calendarCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calendarMonthText: { fontSize: 18, color: '#1e293b' },
  weekDaysRow: { flexDirection: 'row', marginBottom: 10 },
  weekDayText: { width: '14.28%', textAlign: 'center', fontSize: 12, textTransform: 'uppercase' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: 45, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 14 },
  closeCalendarBtn: { marginTop: 20, alignItems: 'center', padding: 12 },
  closeCalendarBtnText: { color: '#006241' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingBottom: 100 },
  emptyTitle: { fontSize: 18, color: '#64748b' },
  mainBookBtn: { backgroundColor: '#006241', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  mainBookBtnText: { color: '#ffffff', fontSize: 15 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerSubtitle: {
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 16,
  },
  bookBtnText: {
    fontSize: 13,
    letterSpacing: 1,
  },
  listContainer: {
    flex: 1,
  },
  apptCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  typeBadgeText: {
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusBadgeText: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  cancelBtnText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    letterSpacing: 2,
  },
  modalSubtitle: {
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 10,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  datePickerSelector: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSelectorText: {
    fontSize: 14,
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarMonthText: {
    fontSize: 16,
    letterSpacing: 1,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekDayText: {
    width: (width - 80) / 7,
    textAlign: 'center',
    fontSize: 10,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: (width - 80) / 7,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
  },
  closeCalendarBtn: {
    marginTop: 20,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeCalendarBtnText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  dateScroll: {
    gap: 12,
    paddingRight: 20,
  },
  dateOption: {
    width: 65,
    height: 85,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dateDay: {
    fontSize: 10,
    letterSpacing: 1,
  },
  dateNum: {
    fontSize: 20,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  slotText: {
    fontSize: 12,
  },
  submitBtn: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  submitBtnText: {
    fontSize: 16,
    letterSpacing: 1.5,
  },
});
