import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { StreakMilestoneReward } from '@/shared/api/gamificationApi';
import { chunky, colors, fonts, radius } from '@/shared/config/theme';
import { milestoneHeadline, milestoneMessage } from '../model/bonusFeedback';

interface StreakMilestoneModalProps {
  milestone: StreakMilestoneReward | null;
}

// Comemoração do marco da ofensiva (3, 7, 14 ou 30 dias), por cima do resultado.
export function StreakMilestoneModal({ milestone }: StreakMilestoneModalProps) {
  const [visible, setVisible] = useState(milestone !== null);

  useEffect(() => {
    setVisible(milestone !== null);
  }, [milestone]);

  if (!milestone) return null;

  const close = () => setVisible(false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.flameCircle}>
            <MaterialCommunityIcons name="fire" size={48} color={colors.flame} />
          </View>
          <Text style={styles.eyebrow}>
            {milestone.days} DIAS · {milestone.title.toUpperCase()}
          </Text>
          <Text style={styles.title}>{milestoneHeadline(milestone)}</Text>
          <Text style={styles.message}>{milestoneMessage(milestone)}</Text>
          <View style={styles.xpChip}>
            <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.accentInk} />
            <Text style={styles.xpChipText}>+{milestone.xp} XP</Text>
          </View>
          <Pressable
            onPress={close}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Continuar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 22, 52, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  flameCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.flameSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.flame,
    marginTop: 4,
  },
  title: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
    textAlign: 'center',
  },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentFixed,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  xpChipText: { fontFamily: fonts.sans.extraBold, fontSize: 16, color: colors.accentInk },
  cta: {
    alignSelf: 'stretch',
    height: 48,
    marginTop: 8,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    borderBottomWidth: chunky.ctaDepth,
    borderBottomColor: colors.primaryDeepest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: { borderBottomWidth: chunky.pressedDepth, transform: [{ translateY: 2 }] },
  ctaText: { fontFamily: fonts.sans.extraBold, fontSize: 16, color: colors.textOnPrimary },
});
