import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Platform 
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import { 
  Ruler, 
  Calendar, 
  MapPin, 
  Crown, 
  HelpCircle, 
  ShoppingBag, 
  LogOut, 
  ChevronRight,
  Sparkles
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function MoreScreen({ navigation, onLogout }) {
  const { theme, fonts, shadows } = useTheme();

  const menuItems = [
    {
      label: 'Size Profile & Sizing',
      sublabel: 'View and edit custom measurements',
      icon: Ruler,
      route: 'Measurements',
    },
    {
      label: 'Book Consultation',
      sublabel: 'Reserve fitting sessions with tailor',
      icon: Calendar,
      route: 'Appointments',
    },
    {
      label: 'Request Home Visit',
      sublabel: 'Designer consultation at your doorstep',
      icon: 'StoreVisits', // Special route
    },
    {
      label: 'VIP Loyalty Dashboard',
      sublabel: 'Track points and unlock gold rewards',
      icon: Crown,
      route: 'Loyalty',
    },
    {
      label: 'Support Helpdesk',
      sublabel: 'Get help and resolve tickets 24/7',
      icon: HelpCircle,
      route: 'Support',
    },
  ];

  const handlePress = (item) => {
    if (item.route) {
      navigation.navigate(item.route);
    } else if (item.label === 'Request Home Visit') {
      navigation.navigate('StoreVisits');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold }]}>
          More Menu
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Menu Items List */}
        <View style={styles.menuGroup}>
          {menuItems.map((item, index) => {
            const Icon = item.icon === 'StoreVisits' ? MapPin : item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && { borderBottomWidth: 0 }
                ]}
                activeOpacity={0.75}
                onPress={() => handlePress(item)}
              >
                <View style={styles.iconWrapper}>
                  <Icon size={20} color="#006241" />
                </View>
                <View style={styles.itemTextWrapper}>
                  <Text style={[styles.itemLabel, { fontFamily: fonts.bold }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.itemSublabel, { fontFamily: fonts.regular }]}>
                    {item.sublabel}
                  </Text>
                </View>
                <ChevronRight size={18} color="#94a3b8" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loyalty Quick Sparkle Banner */}
        <View style={[styles.rewardsBanner, shadows.premium]}>
          <Sparkles size={16} color="#c5a880" style={{ marginRight: 8 }} />
          <Text style={[styles.rewardsText, { fontFamily: fonts.medium }]}>
            Refer a friend & earn 100 bonus VIP points!
          </Text>
        </View>

        {/* Logout Row */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity 
            style={[styles.logoutBtn, shadows.premium]} 
            activeOpacity={0.8}
            onPress={onLogout}
          >
            <LogOut size={18} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { fontFamily: fonts.bold }]}>
              Logout Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    paddingTop: Platform.OS === 'ios' ? 55 : 35,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0.8,
    borderColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 24,
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  menuGroup: {
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 0.8,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.8,
    borderColor: '#f1f5f9',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemTextWrapper: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: 15,
    color: '#1e293b',
  },
  itemSublabel: {
    fontSize: 11.5,
    color: '#64748b',
  },
  rewardsBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#0a1d17',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
    borderColor: '#c5a880',
  },
  rewardsText: {
    color: '#ffffff',
    fontSize: 11.5,
    letterSpacing: 0.2,
  },
  logoutContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 0.8,
    borderColor: '#fee2e2',
    paddingVertical: 15,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 14.5,
    color: '#ef4444',
  },
});
