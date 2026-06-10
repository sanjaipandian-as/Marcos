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
      const formattedDate = selectedDate.toISOString();
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

  const renderCalendarModal = () => {
    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
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
            <View style={styles.daysGrid}>
              {days.map((date, i) => {
                if (!date) return <View key={i} style={styles.dayCell} />;
                const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
                const isPast = date < today;
                return (
                  <TouchableOpacity 
                    key={i} 
                    style={[styles.dayCell, isSelected && { backgroundColor: theme.brand[500], borderRadius: 12 }]}
                    disabled={isPast}
                    onPress={() => { setSelectedDate(date); setShowCalendarModal(false); }}
                  >
                    <Text style={[styles.dayText, { color: isPast ? '#cbd5e1' : '#1e293b', fontFamily: fonts.bold }, isSelected && { color: '#ffffff' }]}>{date.getDate()}</Text>
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

  const renderBookingItem = ({ item }) => {
    const isVisit = !!item.address;
    const date = new Date(isVisit ? item.preferredDate : item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    return (
      <View style={[styles.bookingCard, shadows.premium, { backgroundColor: '#ffffff' }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: isVisit ? '#f0fdf4' : '#eff6ff' }]}>
            {isVisit ? <Home size={12} color="#166534" /> : <Briefcase size={12} color="#1e40af" />}
            <Text style={[styles.typeBadgeText, { color: isVisit ? '#166534' : '#1e40af', fontFamily: fonts.bold }]}>
              {isVisit ? 'HOME VISIT' : 'STANDARD'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#f1f5f9' }]}><Text style={[styles.statusText, { color: '#64748b', fontFamily: fonts.bold }]}>{item.status}</Text></View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}><Calendar size={14} color="#64748b" /><Text style={[styles.infoText, { color: '#1e293b', fontFamily: fonts.medium }]}>{date}</Text></View>
          {!isVisit && <View style={styles.infoRow}><Clock size={14} color="#64748b" /><Text style={[styles.infoText, { color: '#1e293b', fontFamily: fonts.medium }]}>{item.timeSlot}</Text></View>}
          <View style={styles.infoRow}><MapPin size={14} color="#64748b" /><Text style={[styles.infoText, { color: '#1e293b', fontFamily: fonts.medium }]} numberOfLines={1}>{isVisit ? item.address : 'In-Store'}</Text></View>
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
          <TouchableOpacity style={[styles.mainBookBtn, { backgroundColor: theme.brand[500] }]} onPress={() => setBookingModalVisible(true)} activeOpacity={0.8}>
            <Text style={[styles.mainBookBtnText, { color: '#ffffff', fontFamily: fonts.bold }]}>
              BOOK {activeTab === 'SERVICE' ? 'STANDARD' : 'HOME VISIT'}
            </Text>
          </TouchableOpacity>
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

      <TouchableOpacity style={[styles.fab, shadows.premium, { backgroundColor: theme.brand[500] }]} onPress={() => setBookingModalVisible(true)} activeOpacity={0.8}>
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      <Modal visible={bookingModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#1e293b', fontFamily: fonts.bold }]}>NEW {activeTab === 'SERVICE' ? 'SERVICE' : 'HOME VISIT'}</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              
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

              <TextInput style={[styles.textInput, { height: 100, backgroundColor: theme.bg.input, borderColor: theme.border, color: theme.text.primary }]} placeholder="Notes / Requirements" placeholderTextColor={theme.text.muted} multiline value={notes} onChangeText={setNotes} />
              {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.brand[500] }]} onPress={handleBooking} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={[styles.submitBtnText, { color: '#ffffff', fontFamily: fonts.bold }]}>CONFIRM BOOKING</Text>}
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
  bookingCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  typeBadgeText: { fontSize: 10 },
  statusBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, color: '#64748b' },
  cardBody: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: '#1e293b' },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#006241', alignItems: 'center', justifyContent: 'center', elevation: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%', padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, color: '#1e293b' },
  modalScroll: { paddingBottom: 40 },
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
