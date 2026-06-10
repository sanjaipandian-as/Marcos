import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  TextInput,
  Linking,
  ScrollView,
  Modal,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { APP_CONFIG } from '../../config/app.config';
import api from '../../utils/api';
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  HelpCircle, 
  FileText, 
  Send, 
  Plus, 
  X, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Headphones,
  Paperclip,
  MessageCircle
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SupportTicketScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets');
      if (res.success) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTickets();
    });
    return unsubscribe;
  }, [navigation]);

  const handleRaiseTicket = async () => {
    if (!subject || !description) {
      Alert.alert('Required', 'Please enter a subject and details.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/tickets', {
        subject,
        description,
      });

      if (res.success) {
        Alert.alert('Ticket Raised', 'Support ticket opened successfully. We will contact you soon.');
        setSubject('');
        setDescription('');
        setCreateModalVisible(false);
        loadTickets();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to raise ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${APP_CONFIG.CONTACT_PHONE}`);
  };

  const handleWhatsApp = () => {
    const text = `Hello ${APP_CONFIG.STORE_NAME}, I need assistance with my measurements/orders.`;
    Linking.openURL(`whatsapp://send?phone=${APP_CONFIG.CONTACT_WHATSAPP}&text=${encodeURIComponent(text)}`).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed on this device.');
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${APP_CONFIG.CONTACT_EMAIL}?subject=Support Assistance`);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'OPEN': return { color: '#ef4444', bg: '#fef2f2', icon: <AlertCircle size={12} color="#ef4444" />, label: 'Open' };
      case 'IN_PROGRESS': return { color: '#f59e0b', bg: '#fffbeb', icon: <Clock size={12} color="#f59e0b" />, label: 'In Progress' };
      case 'RESOLVED': return { color: '#10b981', bg: '#f0fdf4', icon: <CheckCircle2 size={12} color="#10b981" />, label: 'Resolved' };
      case 'CLOSED': return { color: '#64748b', bg: '#f8fafc', icon: <X size={12} color="#64748b" />, label: 'Closed' };
      default: return { color: '#64748b', bg: '#f8fafc', icon: <HelpCircle size={12} color="#64748b" />, label: status };
    }
  };

  const renderTicket = ({ item }) => {
    const config = getStatusConfig(item.status);
    const ticketDate = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return (
      <TouchableOpacity 
        style={[styles.ticketCard, shadows.premium]}
        activeOpacity={0.8}
        onPress={() => Alert.alert('Ticket Chat', 'The real-time chat feature for this ticket is currently being initialized by our support team.')}
      >
        <View style={styles.cardHeader}>
          <View style={styles.subjectRow}>
            <Text style={[styles.ticketSubject, { fontFamily: fonts.bold }]} numberOfLines={1}>
              {item.subject}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.color + '20' }]}>
              {config.icon}
              <Text style={[styles.statusText, { color: config.color, fontFamily: fonts.bold }]}>
                {config.label}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.ticketDesc, { fontFamily: fonts.medium }]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.dateWrapper}>
            <Clock size={12} color="#94a3b8" />
            <Text style={[styles.ticketDateText, { fontFamily: fonts.medium }]}>
              {ticketDate}
            </Text>
          </View>
          <View style={styles.chatIndicator}>
            <MessageCircle size={14} color="#006241" />
            <Text style={[styles.chatIndicatorText, { fontFamily: fonts.bold }]}>OPEN CHAT</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={['#0a1d17', '#006241']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>Concierge Support</Text>
          <Text style={[styles.headerSub, { fontFamily: fonts.medium }]}>Premium assistance for your bespoke journey</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Support Channels */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold }]}>DIRECT CHANNELS</Text>
        </View>
        
        <View style={styles.channelsGrid}>
          <TouchableOpacity style={[styles.channelCard, shadows.premium]} onPress={handleWhatsApp}>
            <LinearGradient colors={['#25d366', '#128c7e']} style={styles.channelIconBg}>
              <MessageSquare size={20} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.channelName, { fontFamily: fonts.bold }]}>WhatsApp</Text>
            <Text style={[styles.channelSub, { fontFamily: fonts.medium }]}>Instant Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.channelCard, shadows.premium]} onPress={handleCall}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.channelIconBg}>
              <Phone size={20} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.channelName, { fontFamily: fonts.bold }]}>Call Desk</Text>
            <Text style={[styles.channelSub, { fontFamily: fonts.medium }]}>Expert Help</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.channelCard, shadows.premium]} onPress={handleEmail}>
            <LinearGradient colors={['#64748b', '#475569']} style={styles.channelIconBg}>
              <Mail size={20} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.channelName, { fontFamily: fonts.bold }]}>Email Us</Text>
            <Text style={[styles.channelSub, { fontFamily: fonts.medium }]}>Inquiries</Text>
          </TouchableOpacity>
        </View>

        {/* Tickets Section */}
        <View style={styles.ticketsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { fontFamily: fonts.bold }]}>ACTIVE TICKETS ({tickets.length})</Text>
            <TouchableOpacity style={styles.addTicketBtn} onPress={() => setCreateModalVisible(true)}>
              <Plus size={16} color="#006241" />
              <Text style={[styles.addTicketBtnText, { fontFamily: fonts.bold }]}>NEW TICKET</Text>
            </TouchableOpacity>
          </View>

          {loading && tickets.length === 0 ? (
            <View style={styles.loaderSmall}>
              <ActivityIndicator size="small" color="#006241" />
            </View>
          ) : tickets.length === 0 ? (
            <View style={styles.emptyTickets}>
              <View style={styles.emptyIconWrapper}>
                <Headphones size={40} color="#cbd5e1" />
              </View>
              <Text style={[styles.emptyTitle, { fontFamily: fonts.bold }]}>No support tickets</Text>
              <Text style={[styles.emptyText, { fontFamily: fonts.medium }]}>
                If you have any issues with your order or measurements, please raise a ticket.
              </Text>
            </View>
          ) : (
            <FlatList
              data={tickets}
              renderItem={renderTicket}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.ticketsList}
            />
          )}
        </View>
      </ScrollView>

      {/* New Ticket Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, shadows.premium]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { fontFamily: fonts.bold }]}>RAISE SUPPORT TICKET</Text>
                <Text style={[styles.modalSub, { fontFamily: fonts.medium }]}>Describe your issue for priority resolution</Text>
              </View>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setCreateModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { fontFamily: fonts.bold }]}>SUBJECT</Text>
                <TextInput
                  style={[styles.input, { fontFamily: fonts.medium }]}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="What can we help you with?"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { fontFamily: fonts.bold }]}>DESCRIPTION</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { fontFamily: fonts.regular }]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  placeholder="Provide comprehensive details for our team..."
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity style={styles.attachBtn}>
                <Paperclip size={18} color="#64748b" />
                <Text style={[styles.attachBtnText, { fontFamily: fonts.bold }]}>ATTACH FILE / PHOTO</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.submitBtnPremium, { backgroundColor: '#006241' }]}
                onPress={handleRaiseTicket}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={[styles.submitBtnText, { fontFamily: fonts.bold }]}>SUBMIT TICKET</Text>
                    <Send size={18} color="#ffffff" />
                  </>
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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  channelsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  channelCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  channelIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 13,
    color: '#1e293b',
  },
  channelSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  ticketsSection: {
    paddingHorizontal: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addTicketBtnText: {
    fontSize: 11,
    color: '#006241',
  },
  loaderSmall: {
    paddingVertical: 40,
  },
  emptyTickets: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    color: '#1e293b',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  ticketsList: {
    gap: 16,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    marginBottom: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  ticketSubject: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  statusText: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  ticketDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketDateText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  chatIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatIndicatorText: {
    fontSize: 11,
    color: '#006241',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    color: '#1e293b',
    letterSpacing: 1,
  },
  modalSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    color: '#1e293b',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#1e293b',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    gap: 10,
    marginBottom: 24,
  },
  attachBtnText: {
    fontSize: 12,
    color: '#64748b',
  },
  submitBtnPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 12,
  },
  submitBtnText: {
    fontSize: 15,
    color: '#ffffff',
  },
});
