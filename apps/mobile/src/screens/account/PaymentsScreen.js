import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import {
  ChevronLeft,
  CreditCard,
  PlusCircle,
  ShieldCheck,
  Trash2,
  Settings
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function PaymentsScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();

  // Mock payment methods matching the mockup styling
  const [paymentMethods, setPaymentMethods] = useState([
    { id: '1', type: 'VISA', last4: '4242', expiry: '12/28', name: 'ALEX RICHARDS', brand: 'Visa', isDefault: true, gradient: ['#1e1e24', '#2c3e50'] },
    { id: '2', type: 'MASTERCARD', last4: '8899', expiry: '08/27', name: 'ALEX RICHARDS', brand: 'Mastercard', isDefault: false, gradient: [theme.brand[500], theme.brand[800]] }
  ]);

  const handleDeleteCard = (id) => {
    Alert.alert(
      'Remove Card',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(c => c.id !== id));
            Alert.alert('Success', 'Card removed successfully.');
          }
        }
      ]
    );
  };

  const handleAddNew = () => {
    Alert.alert('Add Payment Method', 'Secure Card Entry and gateway connection is opening soon.');
  };

  const renderPaymentCard = (card) => {
    return (
      <View key={card.id} style={[styles.cardContainer, shadows.premium]}>
        <LinearGradient
          colors={card.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.creditCardVisual}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardType, { fontFamily: fonts.bold }]}>{card.type}</Text>
            {card.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={[styles.defaultBadgeText, { fontFamily: fonts.bold }]}>DEFAULT</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.cardNumber, { fontFamily: fonts.medium }]}>
            ••••  ••••  ••••  {card.last4}
          </Text>

          <View style={styles.cardFooter}>
            <View>
              <Text style={[styles.cardLabel, { fontFamily: fonts.medium }]}>CARD HOLDER</Text>
              <Text style={[styles.cardValue, { fontFamily: fonts.bold }]}>{card.name}</Text>
            </View>
            <View>
              <Text style={[styles.cardLabel, { fontFamily: fonts.medium }]}>EXPIRES</Text>
              <Text style={[styles.cardValue, { fontFamily: fonts.bold }]}>{card.expiry}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.cardActionsRow, { backgroundColor: theme.bg.card }]}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleAddNew} activeOpacity={0.7}>
            <Settings size={18} color={theme.text.secondary} />
            <Text style={[styles.actionBtnText, { fontFamily: fonts.bold, color: theme.text.secondary }]}>SETTINGS</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteCard(card.id)} activeOpacity={0.7}>
            <Trash2 size={18} color="#ef4444" />
            <Text style={[styles.actionBtnText, { fontFamily: fonts.bold, color: '#ef4444' }]}>REMOVE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Payments
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.paymentHeader}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            SAVED CARDS
          </Text>
          <TouchableOpacity 
            style={styles.addCardBtn}
            onPress={handleAddNew}
            activeOpacity={0.7}
          >
            <PlusCircle size={18} color={theme.brand[500]} />
            <Text style={[styles.addCardBtnText, { fontFamily: fonts.bold, color: theme.brand[500] }]}>ADD NEW</Text>
          </TouchableOpacity>
        </View>

        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard size={60} color={theme.text.muted} />
            <Text style={[styles.emptyTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>No Saved Cards</Text>
            <Text style={[styles.emptyText, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
              Add a payment method for faster checkout of your premium orders.
            </Text>
          </View>
        ) : (
          paymentMethods.map(renderPaymentCard)
        )}

        <View style={styles.securityNote}>
          <ShieldCheck size={16} color={theme.text.secondary} />
          <Text style={[styles.securityNoteText, { fontFamily: fonts.medium, color: theme.text.secondary }]}>
            Your payment credentials are fully encrypted and secure.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1.5,
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addCardBtnText: {
    fontSize: 12,
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
  },
  creditCardVisual: {
    padding: 24,
    height: 200,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    color: '#ffffff',
    fontSize: 18,
    letterSpacing: 1.5,
  },
  defaultBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    letterSpacing: 1,
  },
  cardNumber: {
    color: '#ffffff',
    fontSize: 20,
    letterSpacing: 3,
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 8,
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardValue: {
    color: '#ffffff',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  cardActionsRow: {
    flexDirection: 'row',
    height: 48,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f2',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  actionDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#f0f0f2',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 30,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  securityNoteText: {
    fontSize: 11,
  },
});
