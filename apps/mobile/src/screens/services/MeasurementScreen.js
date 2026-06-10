import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput, 
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { useTheme } from '../../styles/ThemeContext';
import api from '../../utils/api';
import { 
  Ruler, 
  Plus, 
  Info, 
  ChevronLeft, 
  Edit3, 
  Save, 
  X,
  User,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function MeasurementScreen({ navigation }) {
  const { theme, fonts, shadows } = useTheme();
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  
  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const canEditSizing = userRole === 'ADMIN' || userRole === 'OWNER' || userRole === 'STAFF';

  const loadData = async () => {
    try {
      if (profiles.length === 0) {
        setLoading(true);
      }
      const [profRes, authRes] = await Promise.all([
        api.get('/measurements'),
        api.get('/auth/profile')
      ]);

      if (profRes.success) {
        setProfiles(profRes.data);
        if (profRes.data.length > 0) {
          setSelectedProfile(prev => {
            if (prev) {
              const match = profRes.data.find(p => p.id === prev.id);
              if (match) return match;
            }
            return profRes.data[0];
          });
        }
      }
      
      if (authRes.success) {
        setUserRole(authRes.data.role);
      }
    } catch (err) {
      console.error('Error loading measurement data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, profiles]);

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      Alert.alert('Required', 'Please enter a name for the profile.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/measurements', { profileName: newProfileName });
      if (res.success) {
        setNewProfileName('');
        setShowCreateModal(false);
        loadData();
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create profile.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!selectedProfile) return;
    setEditValues({
      fullLength: selectedProfile.fullLength?.toString() || '',
      shoulderWidth: selectedProfile.shoulderWidth?.toString() || '',
      upperChest: selectedProfile.upperChest?.toString() || '',
      bust: selectedProfile.bust?.toString() || '',
      waist: selectedProfile.waist?.toString() || '',
      hip: selectedProfile.hip?.toString() || '',
      armLength: selectedProfile.armLength?.toString() || '',
      sleeveLength: selectedProfile.sleeveLength?.toString() || '',
      neck: selectedProfile.neck?.toString() || '',
      seat: selectedProfile.seat?.toString() || '',
      skirtLength: selectedProfile.skirtLength?.toString() || '',
      pantLength: selectedProfile.pantLength?.toString() || '',
      tailorNotes: selectedProfile.tailorNotes || '',
    });
    setIsEditing(true);
  };

  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;
    
    setIsSaving(true);
    try {
      // Convert string values back to numbers for the API
      const numericUpdates = {};
      Object.keys(editValues).forEach(key => {
        if (key === 'tailorNotes') {
          numericUpdates[key] = editValues[key];
        } else {
          numericUpdates[key] = editValues[key] === '' ? null : Number(editValues[key]);
        }
      });

      const res = await api.put(`/measurements/${selectedProfile.id}`, numericUpdates);
      if (res.success) {
        Alert.alert('Success', 'Measurement profile updated successfully.');
        setIsEditing(false);
        loadData();
      }
    } catch (err) {
      Alert.alert('Update Failed', err.message || 'Failed to update measurements.');
    } finally {
      setIsSaving(false);
    }
  };

  const measurementFields = [
    { label: 'Full Length', key: 'fullLength' },
    { label: 'Shoulder Width', key: 'shoulderWidth' },
    { label: 'Upper Chest', key: 'upperChest' },
    { label: 'Bust / Chest', key: 'bust' },
    { label: 'Waist', key: 'waist' },
    { label: 'Hip', key: 'hip' },
    { label: 'Arm Length', key: 'armLength' },
    { label: 'Sleeve Length', key: 'sleeveLength' },
    { label: 'Neck', key: 'neck' },
    { label: 'Seat', key: 'seat' },
    { label: 'Skirt Length', key: 'skirtLength' },
    { label: 'Pant Length', key: 'pantLength' },
  ];

  const renderMeasurementGrid = () => {
    if (!selectedProfile) return null;

    return (
      <View style={styles.gridContainer}>
        {measurementFields.map((field) => (
          <View key={field.key} style={[styles.gridItem, { backgroundColor: theme.bg.card }, shadows.premium]}>
            <Text style={[styles.fieldLabel, { color: theme.text.secondary, fontFamily: fonts.bold }]}>
              {field.label.toUpperCase()}
            </Text>
            {isEditing && canEditSizing ? (
              <TextInput
                style={[styles.fieldInput, { color: theme.brand[500], fontFamily: fonts.extraBold }]}
                value={editValues[field.key]}
                onChangeText={(val) => setEditValues(prev => ({ ...prev, [field.key]: val }))}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={theme.text.muted}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: theme.brand[500], fontFamily: fonts.extraBold }]}>
                {selectedProfile[field.key] ? `${selectedProfile[field.key]}"` : '--'}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.main }]}>
      {/* Premium Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={[styles.headerBtn, shadows.premium]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#1e1e1e" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: fonts.bold, color: theme.text.primary }]}>
          Sizing Profiles
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && profiles.length === 0 ? (
        <View style={styles.scrollContent}>
          {/* Sizing Tabs Skeletons */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            {[1, 2, 3].map((idx) => (
              <View key={idx} style={[styles.skeletonTab, { backgroundColor: theme.border }]} />
            ))}
          </View>
          {/* Action Bar Skeleton */}
          <View style={[styles.skeletonAction, { backgroundColor: theme.border }]} />
          {/* Grid Skeletons */}
          <View style={styles.gridContainer}>
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <View key={idx} style={[styles.skeletonGridItem, { backgroundColor: theme.border }]} />
            ))}
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary, fontFamily: fonts.extraBold }]}>
              SELECT PROFILE
            </Text>
            <TouchableOpacity 
              style={[styles.addProfileBtn, { backgroundColor: theme.brand[50] }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={16} color={theme.brand[500]} />
              <Text style={[styles.addProfileText, { color: theme.brand[500], fontFamily: fonts.bold }]}>NEW</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profilesScroll}>
            {profiles.map((prof) => (
              <TouchableOpacity
                key={prof.id}
                style={[
                  styles.profileTab,
                  { borderColor: theme.border, backgroundColor: theme.bg.card },
                  selectedProfile?.id === prof.id && { borderColor: theme.brand[500], backgroundColor: theme.brand[50] }
                ]}
                onPress={() => {
                  setSelectedProfile(prof);
                  setIsEditing(false);
                }}
              >
                <User size={14} color={selectedProfile?.id === prof.id ? theme.brand[500] : theme.text.muted} />
                <Text style={[
                  styles.profileTabText,
                  { color: theme.text.primary, fontFamily: fonts.bold },
                  selectedProfile?.id === prof.id && { color: theme.brand[500] }
                ]}>
                  {prof.profileName.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {profiles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.bg.card }]}>
                <Ruler size={48} color={theme.brand[200]} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text.primary, fontFamily: fonts.bold }]}>
                No Profiles Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.text.secondary, fontFamily: fonts.medium }]}>
                Create your first sizing profile to store your bespoke measurements securely.
              </Text>
            </View>
          ) : (
            <>
              {/* Permission Banner */}
              <View style={[styles.noticeBanner, { backgroundColor: canEditSizing ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)' }]}>
                {canEditSizing ? (
                  <ShieldCheck size={18} color="#10b981" />
                ) : (
                  <Info size={18} color="#f59e0b" />
                )}
                <Text style={[styles.noticeText, { color: canEditSizing ? '#065f46' : '#92400e', fontFamily: fonts.medium }]}>
                  {canEditSizing 
                    ? "Master Tailor Access: You have permissions to modify sizing data." 
                    : "Read-Only: Sizing can only be updated by the MARCOS Master Tailor."}
                </Text>
              </View>

              {/* Action Bar for Admins */}
              {canEditSizing && (
                <View style={styles.actionBar}>
                  {!isEditing ? (
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: theme.brand[500] }]}
                      onPress={startEditing}
                    >
                      <Edit3 size={18} color="#ffffff" />
                      <Text style={[styles.actionBtnText, { color: '#ffffff', fontFamily: fonts.bold }]}>EDIT SIZING</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.editActions}>
                      <TouchableOpacity 
                        style={[styles.cancelBtn, { borderColor: theme.border }]}
                        onPress={() => setIsEditing(false)}
                      >
                        <X size={18} color={theme.text.primary} />
                        <Text style={[styles.cancelBtnText, { color: theme.text.primary, fontFamily: fonts.bold }]}>CANCEL</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: '#10b981' }]}
                        onPress={handleUpdateProfile}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <>
                            <Save size={18} color="#ffffff" />
                            <Text style={[styles.actionBtnText, { color: '#ffffff', fontFamily: fonts.bold }]}>SAVE DATA</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Measurements Grid */}
              {renderMeasurementGrid()}

              {/* Tailor Notes Section */}
              <View style={styles.notesSection}>
                <Text style={[styles.notesTitle, { color: theme.text.primary, fontFamily: fonts.extraBold }]}>
                  TAILOR NOTES
                </Text>
                <View style={[styles.notesCard, { backgroundColor: theme.bg.card }, shadows.premium]}>
                  {isEditing && canEditSizing ? (
                    <TextInput
                      style={[styles.notesInput, { color: theme.text.primary, fontFamily: fonts.regular }]}
                      value={editValues.tailorNotes}
                      onChangeText={(val) => setEditValues(prev => ({ ...prev, tailorNotes: val }))}
                      multiline
                      placeholder="Enter special tailoring requirements or fabric preferences..."
                      placeholderTextColor={theme.text.muted}
                    />
                  ) : (
                    <Text style={[styles.notesTextContent, { color: theme.text.secondary, fontFamily: fonts.regular }]}>
                      {selectedProfile.tailorNotes || "No specific tailoring notes recorded for this profile."}
                    </Text>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Create Profile Modal */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text.primary, fontFamily: fonts.extraBold }]}>NEW PROFILE</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: theme.text.secondary, fontFamily: fonts.bold }]}>PROFILE NAME</Text>
              <TextInput
                style={[styles.modalInput, { borderColor: theme.border, color: theme.text.primary, fontFamily: fonts.medium }]}
                value={newProfileName}
                onChangeText={setNewProfileName}
                placeholder="e.g. My Wedding Suit"
                placeholderTextColor={theme.text.muted}
                autoFocus
              />
            </View>

            <TouchableOpacity 
              style={[styles.createBtn, { backgroundColor: theme.brand[500] }]}
              onPress={handleCreateProfile}
            >
              <CheckCircle2 size={18} color="#ffffff" />
              <Text style={[styles.createBtnText, { color: '#ffffff', fontFamily: fonts.bold }]}>CREATE PROFILE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  skeletonTab: {
    width: 90,
    height: 38,
    borderRadius: 14,
  },
  skeletonAction: {
    height: 54,
    borderRadius: 16,
    marginBottom: 24,
  },
  skeletonGridItem: {
    width: (width - 52) / 2,
    height: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    letterSpacing: 1,
  },
  addProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  addProfileText: {
    fontSize: 11,
  },
  profilesScroll: {
    gap: 12,
    paddingBottom: 24,
  },
  profileTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  profileTabText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
  },
  noticeText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  actionBar: {
    marginBottom: 24,
  },
  actionBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionBtnText: {
    fontSize: 14,
    letterSpacing: 1,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtn: {
    flex: 2,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
  },
  gridItem: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 4,
  },
  fieldLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 22,
  },
  fieldInput: {
    fontSize: 22,
    padding: 0,
    textAlign: 'center',
    minWidth: 60,
  },
  notesSection: {
    marginBottom: 40,
  },
  notesTitle: {
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 16,
  },
  notesCard: {
    borderRadius: 20,
    padding: 16,
    minHeight: 100,
  },
  notesTextContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  notesInput: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  modalCard: {
    width: '100%',
    borderRadius: 28,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    letterSpacing: 1,
  },
  modalBody: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 10,
  },
  modalInput: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  createBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  createBtnText: {
    fontSize: 14,
    letterSpacing: 1,
  },
});
