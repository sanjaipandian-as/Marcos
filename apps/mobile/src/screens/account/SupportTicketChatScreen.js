import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import { 
  ChevronLeft, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  HelpCircle,
  MessageCircle,
  ShieldAlert
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function SupportTicketChatScreen({ route, navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const { ticketId, subject, description, status: initialStatus, imageUrl } = route.params;

  const [ticketStatus, setTicketStatus] = useState(initialStatus);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  
  const scrollViewRef = useRef();

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // Fetch customer messages thread
      const res = await api.get(`/tickets/${ticketId}/messages`);
      if (res.success) {
        setMessages(res.data || []);
      }
      
      // Also refresh the ticket status from the tickets list to stay synced
      const ticketsRes = await api.get('/tickets');
      if (ticketsRes.success && ticketsRes.data) {
        const currentTicket = ticketsRes.data.find(t => t.id === ticketId);
        if (currentTicket) {
          setTicketStatus(currentTicket.status);
        }
      }
    } catch (err) {
      console.error('Error loading chat messages:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      loadMessages(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [ticketId]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/tickets/${ticketId}/messages`, { text: text.trim() });
      if (res.success) {
        setText('');
        // Append message locally for immediate feedback
        setMessages(prev => [...prev, res.data]);
        // Set status to OPEN if it was resolved/closed since user reopened it
        if (ticketStatus === 'RESOLVED' || ticketStatus === 'CLOSED') {
          setTicketStatus('OPEN');
        }
        Alert.alert('Success', 'Message sent successfully.');
      }
    } catch (err) {
      Alert.alert('Send Failed', err.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
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

  const statusConfig = getStatusConfig(ticketStatus);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg.main }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Custom Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.bg.main }]}>
        <TouchableOpacity 
          style={[styles.headerBtn, shadows.premium, { backgroundColor: theme.bg.card }]} 
          onPress={() => navigation.goBack()} 
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={theme.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]} numberOfLines={1}>
            {subject}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.color + '20' }]}>
            {statusConfig.icon}
            <Text style={[styles.statusText, { color: statusConfig.color, fontFamily: fonts.bold }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.brand[500]} />
          </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {/* Ticket Description Card */}
            <View style={[styles.originalInquiryCard, shadows.premium, { backgroundColor: theme.bg.card, borderColor: theme.border }]}>
              <View style={styles.inquiryHeader}>
                <ShieldAlert size={16} color={theme.brand[500]} />
                <Text style={[styles.inquiryHeaderText, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                  Original Request Details
                </Text>
              </View>
              <Text style={[styles.inquiryDesc, { fontFamily: fonts.regular, color: theme.text.secondary }]}>
                {description}
              </Text>
            </View>

            {/* Chat Thread Messages */}
            <View style={styles.threadContainer}>
              {messages.length === 0 ? (
                <View style={styles.emptyChatContainer}>
                  <MessageCircle size={32} color={theme.text.muted} />
                  <Text style={[styles.emptyChatText, { fontFamily: fonts.medium, color: theme.text.muted }]}>
                    No messages in this ticket yet. Write a response below.
                  </Text>
                </View>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender === 'CUSTOMER';
                  const msgTime = new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <View 
                      key={msg.id} 
                      style={[
                        styles.messageRow, 
                        isUser ? styles.userRow : styles.adminRow
                      ]}
                    >
                      <View style={[
                        styles.messageBubble,
                        isUser 
                          ? [styles.userBubble, { backgroundColor: theme.brand[500] }] 
                          : [styles.adminBubble, { backgroundColor: theme.bg.card, borderColor: theme.border }]
                      ]}>
                        {!isUser && (
                          <Text style={[styles.senderLabel, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                            {msg.senderName}
                          </Text>
                        )}
                        <Text style={[
                          styles.messageText, 
                          { fontFamily: fonts.regular },
                          isUser ? { color: '#ffffff' } : { color: theme.text.primary }
                        ]}>
                          {msg.text}
                        </Text>
                        <Text style={[
                          styles.timeText,
                          { fontFamily: fonts.medium },
                          isUser ? { color: 'rgba(255,255,255,0.7)' } : { color: theme.text.muted }
                        ]}>
                          {msgTime}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}

        {/* Message Composer Footer */}
        <View style={[styles.composerContainer, shadows.premium, { backgroundColor: theme.bg.card, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.composerInput, { fontFamily: fonts.regular, color: theme.text.primary, backgroundColor: theme.bg.input }]}
            placeholder={ticketStatus === 'CLOSED' ? 'Ticket is closed.' : 'Type your message response...'}
            placeholderTextColor={theme.text.muted}
            value={text}
            onChangeText={setText}
            editable={ticketStatus !== 'CLOSED'}
            multiline
          />
          <TouchableOpacity 
            style={[
              styles.sendBtn, 
              { backgroundColor: theme.brand[500] },
              (sending || !text.trim() || ticketStatus === 'CLOSED') && { opacity: 0.5 }
            ]} 
            onPress={handleSend}
            disabled={sending || !text.trim() || ticketStatus === 'CLOSED'}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Send size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 15,
    borderBottomWidth: 0.8,
    borderColor: '#f1f5f9',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
    gap: 3,
  },
  headerTitle: {
    fontSize: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    gap: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 8.5,
    textTransform: 'uppercase',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  originalInquiryCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  inquiryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inquiryHeaderText: {
    fontSize: 12.5,
  },
  inquiryDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  threadContainer: {
    gap: 16,
  },
  emptyChatContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyChatText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  adminRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  adminBubble: {
    borderBottomLeftRadius: 2,
    borderWidth: 1,
  },
  senderLabel: {
    fontSize: 9.5,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13.5,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 8.5,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  composerContainer: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    gap: 10,
  },
  composerInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    maxHeight: 80,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
