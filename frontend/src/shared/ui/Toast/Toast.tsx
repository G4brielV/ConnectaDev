import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors, fonts, radius } from '@/shared/config/theme';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'error' | 'info' | 'success';
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({
  visible,
  message,
  type = 'error',
  duration = 4000,
  onDismiss,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          hide();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      hide();
    }
  }, [visible, duration]);

  const hide = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  if (!visible) {
    return null;
  }

  const bgStyle =
    type === 'error'
      ? styles.errorBg
      : type === 'success'
      ? styles.successBg
      : styles.infoBg;

  return (
    <Animated.View style={[styles.container, bgStyle, { opacity }]}>
      <Text style={styles.messageText}>{message}</Text>
      <TouchableOpacity
        onPress={hide}
        style={styles.closeBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  errorBg: {
    backgroundColor: colors.danger,
  },
  infoBg: {
    backgroundColor: colors.dark,
  },
  successBg: {
    backgroundColor: colors.success,
  },
  messageText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontFamily: fonts.sans.medium,
    flex: 1,
    marginRight: 10,
    lineHeight: 20,
  },
  closeBtn: {
    padding: 2,
  },
  closeText: {
    color: colors.textOnDark,
    fontSize: 14,
    fontFamily: fonts.sans.bold,
    opacity: 0.8,
  },
});
