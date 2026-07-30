import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { Megaphone, X } from 'lucide-react-native';
import { getSocket } from '../utils/socket';

export default function BroadcastAlertListener() {
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const socket = getSocket();
      if (socket) {
        clearInterval(interval);

        const handleBroadcast = (data) => {
          console.log('[Mobile] Broadcast Alert Received:', data);
          setActiveAlert({
            title: data.title || 'Special Announcement',
            body: data.body || '',
            date: data.createdAt ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          });
        };

        const handleNotification = (data) => {
          console.log('[Mobile] Notification Received:', data);
          setActiveAlert({
            title: data.title || 'Notification',
            body: data.body || '',
            date: 'Just now',
          });
        };

        socket.on('broadcast:alert', handleBroadcast);
        socket.on('notification:received', handleNotification);

        return () => {
          socket.off('broadcast:alert', handleBroadcast);
          socket.off('notification:received', handleNotification);
        };
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!activeAlert) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={!!activeAlert}
      onRequestClose={() => setActiveAlert(null)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Megaphone size={20} color="#f55900" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.badgeText}>ANNOUNCEMENT</Text>
              <Text style={styles.timeText}>{activeAlert.date}</Text>
            </View>
            <TouchableOpacity onPress={() => setActiveAlert(null)} style={styles.closeBtn}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.bodyContainer}>
            <Text style={styles.title}>{activeAlert.title}</Text>
            <Text style={styles.body}>{activeAlert.body}</Text>
          </View>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.85}
            onPress={() => setActiveAlert(null)}
          >
            <Text style={styles.actionBtnText}>Acknowledge & Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 99999,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#fff3eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f55900',
    letterSpacing: 0.8,
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  bodyContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 22,
  },
  body: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  actionBtn: {
    backgroundColor: '#f55900',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
