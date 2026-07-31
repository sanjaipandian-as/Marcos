import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { Wrench, Clock, X, ChevronRight, Sparkles } from 'lucide-react-native';
import api from '../utils/api';
import { navigationRef } from '../navigation/NavigationRef';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AppAlertsOverlay() {
  const [saleAlert, setSaleAlert] = useState(null);
  const [maintenanceAlert, setMaintenanceAlert] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await api.getPublicAlerts();
      if (!res?.data) return;

      const now = new Date();

      // 1. Check Maintenance Alert
      if (res.data.maintenanceAlert && res.data.maintenanceAlert.isActive) {
        const m = res.data.maintenanceAlert;
        const start = m.startTime ? new Date(m.startTime) : null;
        const end = m.endTime ? new Date(m.endTime) : null;

        const isMultiDay = start && end && (start.toDateString() !== end.toDateString());
        const formatScheduleTime = (d) => {
          if (!d) return null;
          if (isMultiDay) {
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        const isTimeActive = (!start || now >= start) && (!end || now <= end);
        if (isTimeActive) {
          setMaintenanceAlert({
            title: m.title || 'System Maintenance',
            message: m.message || 'We are currently conducting scheduled system maintenance.',
            startTime: formatScheduleTime(start),
            endTime: formatScheduleTime(end),
            durationStr: calculateDuration(start, end),
          });
          setShowMaintenanceModal(true);
          return; // Maintenance takes precedence over promo popup
        }
      }

      // 2. Check Flash Sale Promo Alert
      if (res.data.saleAlert && res.data.saleAlert.isActive && res.data.saleAlert.imageUrl) {
        const s = res.data.saleAlert;
        const start = s.startTime ? new Date(s.startTime) : null;
        const end = s.endTime ? new Date(s.endTime) : null;

        const isTimeActive = (!start || now >= start) && (!end || now <= end);
        if (isTimeActive) {
          setSaleAlert(s);
          setShowSaleModal(true);

          // Animate Fade In
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();

          // Auto dismiss after 3 seconds (or specified durationSec)
          const duration = (s.durationSec || 3) * 1000;
          timerRef.current = setTimeout(() => {
            closeSaleModal();
          }, duration);
        }
      }
    } catch (err) {
      console.log('Failed to fetch public app alerts:', err.message);
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return null;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return null;
    const mins = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    const remHrs = hrs % 24;
    const remMins = mins % 60;
    
    if (days > 0) {
      let result = `${days} day${days > 1 ? 's' : ''}`;
      if (remHrs > 0) result += ` ${remHrs} hr${remHrs > 1 ? 's' : ''}`;
      if (remMins > 0) result += ` ${remMins} min${remMins > 1 ? 's' : ''}`;
      return result;
    }
    if (hrs > 0 && remMins > 0) return `${hrs} hr ${remMins} mins`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  const closeSaleModal = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowSaleModal(false);
    });
  };

  const handleSaleTap = () => {
    closeSaleModal();
    if (!saleAlert) return;

    if (navigationRef.isReady()) {
      if (saleAlert.target === 'PRODUCT' && saleAlert.productId) {
        navigationRef.navigate('ProductDetails', { productId: saleAlert.productId });
      } else if (saleAlert.target === 'TRENDING') {
        navigationRef.navigate('MainTabs', { screen: 'SearchTab', params: { initialFilter: 'TRENDING' } });
      } else {
        // NEW_ARRIVALS or default
        navigationRef.navigate('MainTabs', { screen: 'SearchTab', params: { initialFilter: 'NEW_ARRIVALS' } });
      }
    }
  };

  return (
    <>
      {/* ── 1. Flash Sale Alert (3 Seconds Image Popup) ── */}
      {showSaleModal && saleAlert && (
        <Modal
          animationType="none"
          transparent={true}
          visible={showSaleModal}
          onRequestClose={closeSaleModal}
        >
          <Animated.View style={[styles.saleOverlay, { opacity: fadeAnim }]}>
            <View style={styles.saleContainer}>
              {/* Image Only Display */}
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={handleSaleTap}
                style={styles.imageCard}
              >
                <Image
                  source={{ uri: saleAlert.imageUrl }}
                  style={styles.saleImage}
                  resizeMode="cover"
                />
                
                {/* Subtle top indicator timer badge */}
                <View style={styles.timerBadge}>
                  <Sparkles size={12} color="#ffffff" />
                  <Text style={styles.timerBadgeText}>3s Flash Deal</Text>
                </View>

                {/* Close Button */}
                <TouchableOpacity onPress={closeSaleModal} style={styles.closeBtn}>
                  <X size={16} color="#ffffff" />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Modal>
      )}

      {/* ── 2. System Maintenance Alert ── */}
      {showMaintenanceModal && maintenanceAlert && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showMaintenanceModal}
          onRequestClose={() => {}}
        >
          <View style={styles.maintOverlay}>
            <View style={styles.maintCard}>
              <View style={styles.maintIconWrapper}>
                <Wrench size={28} color="#f55900" />
              </View>

              <Text style={styles.maintTitle}>{maintenanceAlert.title}</Text>
              <Text style={styles.maintMessage}>{maintenanceAlert.message}</Text>

              <View style={styles.timeBox}>
                <Clock size={16} color="#f55900" />
                <View style={styles.timeDetails}>
                  {maintenanceAlert.startTime && maintenanceAlert.endTime ? (
                    <Text style={styles.timeRangeText}>
                      {maintenanceAlert.startTime} - {maintenanceAlert.endTime}
                    </Text>
                  ) : (
                    <Text style={styles.timeRangeText}>Maintenance in progress</Text>
                  )}
                  {maintenanceAlert.durationStr && (
                    <Text style={styles.durationText}>
                      Est. Duration: {maintenanceAlert.durationStr}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.maintDismissBtn}
                onPress={() => setShowMaintenanceModal(false)}
              >
                <Text style={styles.maintDismissText}>Acknowledge & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  saleOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 99999,
  },
  saleContainer: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  imageCard: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.58,
    maxHeight: 480,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1c1c1e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 15,
  },
  saleImage: {
    width: '100%',
    height: '100%',
  },
  timerBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maintOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 99999,
  },
  maintCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  maintIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#fff3eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  maintTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  maintMessage: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  timeBox: {
    width: '100%',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  timeDetails: {
    flex: 1,
  },
  timeRangeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#c2410c',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ea580c',
    marginTop: 2,
  },
  maintDismissBtn: {
    width: '100%',
    backgroundColor: '#0f172a',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  maintDismissText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
