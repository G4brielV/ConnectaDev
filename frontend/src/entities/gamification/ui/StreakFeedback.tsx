import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { StreakStatus, XpBreakdownItem } from '@/shared/api/gamificationApi';
import { colors, fonts, radius } from '@/shared/config/theme';
import { streakFeedback } from '../model/bonusFeedback';

interface StreakFeedbackProps {
  status: StreakStatus;
  currentStreak: number;
  items: XpBreakdownItem[];
}

// Como ficou a ofensiva depois da atividade; a chama "acende" quando ela muda hoje.
export function StreakFeedback({ status, currentStreak, items }: StreakFeedbackProps) {
  const lit = status !== 'KEPT';
  const scale = useRef(new Animated.Value(lit ? 0.4 : 1)).current;

  useEffect(() => {
    if (!lit) return;
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [lit, scale]);

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.flame, { transform: [{ scale }] }]}>
        <MaterialCommunityIcons name="fire" size={22} color={colors.flame} />
      </Animated.View>
      <Text style={styles.message}>{streakFeedback(status, currentStreak, items)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.flameSoft,
    borderRadius: radius.lg,
    padding: 12,
  },
  flame: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontFamily: fonts.sans.semiBold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
});
