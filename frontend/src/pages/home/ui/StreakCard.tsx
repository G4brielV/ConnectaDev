import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, shadow } from '@/shared/config/theme';

const MASCOT = require('../../../../assets/streak/streak-mascot.jpg');

interface StreakCardProps {
  /** null enquanto o resumo carrega */
  currentStreak: number | null;
  longestStreak: number | null;
  onPress: () => void;
}

/** Atalho do Perfil para a tela "Minha ofensiva". */
export function StreakCard({ currentStreak, longestStreak, onPress }: StreakCardProps) {
  const streak = currentStreak ?? 0;
  const lit = streak > 0;
  const title =
    currentStreak === null ? 'Sua ofensiva' : streak === 1 ? '1 dia de ofensiva' : `${streak} dias de ofensiva`;
  const subtitle = lit
    ? `Recorde: ${longestStreak ?? streak} ${longestStreak === 1 ? 'dia' : 'dias'}`
    : 'Estude hoje para acender sua ofensiva';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}. Ver minha ofensiva`}
    >
      <View style={[styles.mascotRing, !lit && styles.mascotRingOff]}>
        <Image
          source={MASCOT}
          style={[styles.mascot, !lit && styles.mascotOff]}
          accessibilityIgnoresInvertColors
        />
      </View>
      <View style={styles.texts}>
        <Text style={styles.eyebrow}>OFENSIVA</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.action}>
        <Text style={styles.actionText}>Ver</Text>
        <Feather name="chevron-right" size={16} color={colors.flame} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.flameSoft,
    borderRadius: radius.lg,
    padding: 12,
    marginTop: 12,
    ...shadow.card,
  },
  cardPressed: { opacity: 0.85 },
  mascotRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    borderWidth: 2,
    borderColor: colors.flame,
    backgroundColor: colors.flameSoft,
  },
  mascotRingOff: { borderColor: colors.lockedNode, backgroundColor: colors.lockedSurface },
  mascot: { width: '100%', height: '100%', borderRadius: 26 },
  mascotOff: { opacity: 0.45 },
  texts: { flex: 1, gap: 1 },
  eyebrow: { fontFamily: fonts.mono.medium, fontSize: 10, letterSpacing: 0.8, color: colors.flame },
  title: { fontFamily: fonts.sans.extraBold, fontSize: 16, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.sans.regular, fontSize: 12, color: colors.textMuted },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.flameSoft,
    borderRadius: radius.pill,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
  },
  actionText: { fontFamily: fonts.sans.bold, fontSize: 12, color: colors.flame },
});
