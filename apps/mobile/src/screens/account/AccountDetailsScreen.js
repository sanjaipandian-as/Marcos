import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Award,
  Calendar
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AccountDetailsScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  
  // Data States
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');

  const fetchProfile = async () => {
    try {
      if (!profile) {
        setLoading(true);
      }
      const res = await api.get('/auth/profile');
      if (res.success && res.data) {
        setProfile(res.data);
        setFullName(res.data.fullName || '');
        setGender(res.data.gender || '');
        setAddress(res.data.address || '');
      }
    } catch (err) {
      console.error('Error fetching profile detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    setUpdating(true);
    try {
      const res = await api.put('/auth/profile', {
        fullName: fullName.trim(),
        gender: gender.trim() || null,
        address: address.trim() || null
      });

      if (res.success) {
        Alert.alert('Success', 'Profile details updated successfully!');
        // Refresh details
        fetchProfile();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update profile details.');
    } finally {
      setUpdating(false);
    }
  };

  // Format Date Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading && !profile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
        {/* Header Skeleton */}
        <View style={styles.headerBar}>
          <View style={[styles.skeletonBtn, { backgroundColor: theme.border }]} />
          <View style={[styles.skeletonTitle, { backgroundColor: theme.border }]} />
          <View style={[styles.skeletonBtn, { backgroundColor: theme.border }]} />
        </View>

        <View style={styles.scrollContent}>
          {/* Card Skeletons */}
          <View style={[styles.skeletonCard, shadows.premium, { backgroundColor: theme.bg.card }]} />
          <View style={[styles.skeletonCard, shadows.premium, { backgroundColor: theme.bg.card, height: 180 }]} />
          <View style={[styles.skeletonCard, shadows.premium, { backgroundColor: theme.bg.card }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Account Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Loyalty & Join Date Summary Card */}
        <View style={[styles.summaryCard, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <View style={styles.summaryItem}>
            <View style={[styles.iconBg, { backgroundColor: theme.brand[50] }]}>
              <Award size={20} color={theme.brand[500]} />
            </View>
            <View>
              <Text style={[styles.summaryLabel, { fontFamily: fonts.medium, color: theme.text.secondary }]}>Loyalty Points</Text>
              <Text style={[styles.summaryValue, { fontFamily: fonts.bold, color: theme.brand[500] }]}>
                {profile?.pointsBalance || 0} pts
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <View style={[styles.iconBg, { backgroundColor: theme.brand[50] }]}>
              <Calendar size={20} color={theme.brand[500]} />
            </View>
            <View>
              <Text style={[styles.summaryLabel, { fontFamily: fonts.medium, color: theme.text.secondary }]}>Member Since</Text>
              <Text style={[styles.summaryValue, { fontFamily: fonts.bold, color: theme.text.primary }]}>
                {formatDate(profile?.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* User Info Form */}
        <View style={[styles.formCard, shadows.premium, { backgroundColor: theme.bg.card }]}>
          <Text style={[styles.sectionTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
            Personal Details
          </Text>

          {/* Full Name */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { fontFamily: fonts.semiBold, color: theme.text.secondary }]}>FULL NAME</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.bg.input }]}>
              <User size={18} color={theme.text.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontFamily: fonts.medium, color: theme.text.primary }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor={theme.text.muted}
              />
            </View>
          </View>

          {/* Email (Read-Only) */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { fontFamily: fonts.semiBold, color: theme.text.secondary }]}>EMAIL ADDRESS (READ-ONLY)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: '#f0f0f2' }]}>
              <Mail size={18} color={theme.text.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontFamily: fonts.medium, color: theme.text.secondary }]}
                value={profile?.email}
                editable={false}
              />
            </View>
          </View>

          {/* Phone (Read-Only) */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { fontFamily: fonts.semiBold, color: theme.text.secondary }]}>PHONE NUMBER (READ-ONLY)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: '#f0f0f2' }]}>
              <Phone size={18} color={theme.text.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontFamily: fonts.medium, color: theme.text.secondary }]}
                value={profile?.phoneNumber}
                editable={false}
              />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { fontFamily: fonts.semiBold, color: theme.text.secondary }]}>GENDER</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.bg.input }]}>
              <User size={18} color={theme.text.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontFamily: fonts.medium, color: theme.text.primary }]}
                value={gender}
                onChangeText={setGender}
                placeholder="e.g. Male, Female, Other"
                placeholderTextColor={theme.text.muted}
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { fontFamily: fonts.semiBold, color: theme.text.secondary }]}>SHIPPING ADDRESS</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.bg.input, height: 90, alignItems: 'flex-start', paddingTop: 12 }]}>
              <MapPin size={18} color={theme.text.muted} style={[styles.inputIcon, { marginTop: 2 }]} />
              <TextInput
                style={[styles.input, { fontFamily: fonts.medium, color: theme.text.primary, height: '100%', textAlignVertical: 'top' }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter complete shipping address"
                placeholderTextColor={theme.text.muted}
                multiline
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.brand[500] }]}
          onPress={handleUpdate}
          disabled={updating}
          activeOpacity={0.8}
        >
          {updating ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Save size={18} color="#ffffff" />
              <Text style={[styles.saveBtnText, { fontFamily: fonts.bold }]}>SAVE DETAILS</Text>
            </>
          )}
        </TouchableOpacity>

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
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
  },
  summaryValue: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#f0f0f2',
    marginHorizontal: 12,
  },
  formCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 13.5,
  },
  saveBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
  },
  // Skeleton Styles
  skeletonBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  skeletonTitle: {
    width: 120,
    height: 20,
    borderRadius: 6,
  },
  skeletonCard: {
    height: 80,
    borderRadius: 24,
    marginBottom: 20,
  },
});
