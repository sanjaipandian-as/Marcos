import React, { createContext, useState, useContext, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Dimensions, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react-native';
import { useTheme } from '../styles/ThemeContext';

const ToastContext = createContext(null);

const { width } = Dimensions.get('window');

export const ToastProvider = ({ children }) => {
  const { theme, fonts, shadows } = useTheme();
  const [toast, setToast] = useState(null);
  const [customDialog, setCustomDialog] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const timeoutRef = useRef(null);
  const insets = useSafeAreaInsets();

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [fadeAnim, slideAnim]);

  const showToast = useCallback((
    message,
    type = 'success',
    actionLabel = null,
    onActionPress = null,
    duration = 3500
  ) => {
    // Clear any active timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set layout variables
    setToast({ message, type, actionLabel, onActionPress });

    // Reset animation values
    fadeAnim.setValue(0);
    slideAnim.setValue(20);

    // Slide/Fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, duration);
  }, [fadeAnim, slideAnim, hideToast]);

  React.useEffect(() => {
    const originalAlert = Alert.alert;

    Alert.alert = (title, message, buttons, options) => {
      // If there are multiple buttons (other than a single default OK button), run our custom premium dialog
      if (buttons && buttons.length > 1) {
        setCustomDialog({
          title: title || 'Alert',
          message: message || '',
          buttons: buttons,
        });
        return;
      }

      let msg = message || title;
      if (!msg) return;

      // Translate out of stock/inventory errors to a professional premium phrase
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes('insufficient inventory') || lowerMsg.includes('remaining in stock') || lowerMsg.includes('out of stock') || lowerMsg.includes('stock is empty')) {
        msg = 'This masterpiece is currently out of stock.';
        title = 'Out of Stock';
      }

      const lowerMsgUpdated = msg.toLowerCase();
      
      // Determine toast type based on title/content
      let type = 'info';
      const lowerTitle = (title || '').toLowerCase();
      if (lowerTitle.includes('error') || lowerTitle.includes('failed') || lowerTitle.includes('invalid') || lowerTitle.includes('required') || lowerTitle.includes('out of stock')) {
        type = 'error';
      } else if (
        lowerTitle.includes('success') || 
        lowerTitle.includes('welcome') || 
        lowerTitle.includes('completed') || 
        lowerTitle.includes('applied') || 
        lowerTitle.includes('raised') || 
        lowerTitle.includes('submitted') ||
        lowerTitle.includes('sent')
      ) {
        type = 'success';
      } else if (lowerTitle.includes('warn') || lowerTitle.includes('attention')) {
        type = 'warning';
      }

      // Check if this is an "added to cart" or "added to wishlist" alert to display the special dark toast
      if (lowerMsgUpdated.includes('added to cart') || lowerTitle.includes('added to cart')) {
        showToast(
          msg,
          'cart',
          'GO TO CART',
          () => {
            const { navigationRef } = require('../navigation/NavigationRef');
            if (navigationRef.isReady()) {
              navigationRef.navigate('MainTabs', { screen: 'Cart' });
            }
          }
        );
        return;
      }
      if (lowerMsg.includes('wishlist') || lowerMsg.includes('favorite')) {
        showToast(
          msg,
          'wishlist',
          'VIEW WISHLIST',
          () => {
            const { navigationRef } = require('../navigation/NavigationRef');
            if (navigationRef.isReady()) {
              navigationRef.navigate('Wishlist');
            }
          }
        );
        return;
      }

      // Check for single action buttons
      const hasOnPress = buttons && buttons[0] && typeof buttons[0].onPress === 'function';
      const actionLabel = hasOnPress ? (buttons[0].text || 'OK') : null;
      const onActionPress = hasOnPress ? buttons[0].onPress : null;

      showToast(msg, type, actionLabel, onActionPress);
    };

    return () => {
      Alert.alert = originalAlert;
    };
  }, [showToast]);

  const handleActionPress = () => {
    if (toast?.onActionPress) {
      toast.onActionPress();
    }
    hideToast();
  };

  const handleDialogButtonPress = (btn) => {
    setCustomDialog(null);
    if (btn && typeof btn.onPress === 'function') {
      btn.onPress();
    }
  };

  const renderIcon = () => {
    if (!toast) return null;
    const size = 18;
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={size} color="#10b981" />;
      case 'error':
        return <XCircle size={size} color="#f43f5e" />;
      case 'info':
        return <Info size={size} color="#3b82f6" />;
      case 'warning':
        return <AlertTriangle size={size} color="#f59e0b" />;
      default:
        return null;
    }
  };

  const getToastStyle = () => {
    if (!toast) return null;
    if (toast.type === 'cart' || toast.type === 'wishlist') {
      return styles.darkToast;
    }
    return styles.cardToast;
  };

  const getTextStyle = () => {
    if (!toast) return null;
    if (toast.type === 'cart' || toast.type === 'wishlist') {
      return styles.darkToastText;
    }
    return styles.cardToastText;
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Sleek bottom toast notifications */}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            getToastStyle(),
            {
              bottom: insets.bottom + 16,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.toastContent}>
            <View style={styles.toastMain}>
              {toast.type !== 'cart' && toast.type !== 'wishlist' && (
                <View style={styles.iconWrapper}>{renderIcon()}</View>
              )}
              <Text style={getTextStyle()} numberOfLines={1} ellipsizeMode="tail">
                {toast.message}
              </Text>
            </View>

            {toast.actionLabel && (
              <TouchableOpacity
                onPress={handleActionPress}
                activeOpacity={0.7}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>{toast.actionLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Premium custom confirmation modals */}
      {customDialog && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!customDialog}
          onRequestClose={() => setCustomDialog(null)}
        >
          <View style={styles.dialogOverlay}>
            <View style={[styles.dialogCard, shadows.premium]}>
              <Text style={[styles.dialogTitle, { fontFamily: fonts.bold }]}>
                {customDialog.title}
              </Text>
              {customDialog.message ? (
                <Text style={[styles.dialogMessage, { fontFamily: fonts.medium }]}>
                  {customDialog.message}
                </Text>
              ) : null}
              <View style={styles.dialogButtonsContainer}>
                {customDialog.buttons.map((btn, index) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  
                  let buttonTextColor = '#00b4d8'; // Vibrant teal/blue from screenshot
                  if (isDestructive) {
                    buttonTextColor = '#ff453a'; // System red
                  } else if (isCancel) {
                    buttonTextColor = '#98989f'; // System gray
                  }
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleDialogButtonPress(btn)}
                      style={styles.dialogButton}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dialogButtonText, { color: buttonTextColor, fontFamily: fonts.bold }]}>
                        {(btn.text || 'OK').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  // Sleek Dark Banner style for Cart / Wishlist (matching mockup exactly)
  darkToast: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  darkToastText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    flex: 1,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    color: '#e85c1c', // Brand orange action label
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.5,
  },
  // Premium Card layout for other success/error messages
  cardToast: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#0d0d0d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f4f4f5',
  },
  cardToastText: {
    color: '#1e1e1e',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginLeft: 10,
    flex: 1,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  toastMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    backgroundColor: '#2c2c2e', // Slate gray / charcoal matching screenshot
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  dialogTitle: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 10,
  },
  dialogMessage: {
    color: '#ebebf5',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
  },
  dialogButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  dialogButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dialogButtonText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

