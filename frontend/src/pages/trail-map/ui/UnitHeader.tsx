import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { TrailMapUnit } from '@/shared/api/trailMapApi';
import { colors, fonts, radius, shadow } from '@/shared/config/theme';
import type { UnitState } from '../trailMapLayout';

const UNIT_BANNER = require('../../../../assets/trail/unit-banner.jpg');

/**
 * Cabeçalho da unidade em que a pessoa está: ilustração do Stitch com um
 * degradê teal por cima, para o texto branco ler bem sobre qualquer trecho.
 */
export function UnitHero({ unit }: { unit: TrailMapUnit }) {
  return (
    <View style={styles.hero}>
      <ImageBackground
        source={UNIT_BANNER}
        style={styles.heroImage}
        imageStyle={styles.heroImageInner}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      >
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id={`unit-fade-${unit.id}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity="0" />
              <Stop offset="0.45" stopColor={colors.primary} stopOpacity="0.45" />
              <Stop offset="1" stopColor={colors.primaryDeep} stopOpacity="0.96" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#unit-fade-${unit.id})`} />
        </Svg>

        <View style={styles.heroContent}>
          <View style={styles.heroRow}>
            <View style={styles.heroTexts}>
              <View style={styles.unitChip}>
                <MaterialCommunityIcons
                  name="book-open-page-variant"
                  size={12}
                  color={colors.accentInk}
                />
                <Text style={styles.unitChipText}>UNIDADE {unit.sequence}</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {unit.title}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroPercent}>{unit.progressPercentage}%</Text>
              <Text style={styles.heroCount}>
                {unit.completedPhases}/{unit.totalPhases} fases
              </Text>
            </View>
          </View>
          <View
            style={styles.heroTrack}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: unit.progressPercentage }}
          >
            <View style={[styles.heroFill, { width: `${unit.progressPercentage}%` }]} />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

interface UnitBannerProps {
  unit: TrailMapUnit;
  state: UnitState;
  expanded: boolean;
  onToggle: () => void;
}

const STATE_COPY: Record<UnitState, string> = {
  done: 'CONCLUÍDA',
  active: 'EM ANDAMENTO',
  locked: 'BLOQUEADA',
};

/** Unidades fora de foco: compactas, e as concluídas recolhem as fases. */
export function UnitBanner({ unit, state, expanded, onToggle }: UnitBannerProps) {
  const done = state === 'done';
  const locked = state === 'locked';

  return (
    <Pressable
      onPress={onToggle}
      style={[styles.banner, locked && styles.bannerLocked]}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`Unidade ${unit.sequence}: ${unit.title}. ${STATE_COPY[state].toLowerCase()}, ${unit.completedPhases} de ${unit.totalPhases} fases.`}
    >
      <View style={[styles.bannerIcon, done && styles.bannerIconDone, locked && styles.bannerIconLocked]}>
        {done ? (
          <Feather name="check" size={18} color={colors.textOnPrimary} />
        ) : locked ? (
          <Feather name="lock" size={16} color={colors.textMuted} />
        ) : (
          <MaterialCommunityIcons name="play" size={20} color={colors.primary} />
        )}
      </View>
      <View style={styles.bannerTexts}>
        <Text style={[styles.bannerEyebrow, locked && styles.bannerEyebrowLocked]}>
          UNIDADE {unit.sequence} · {STATE_COPY[state]}
        </Text>
        <Text style={[styles.bannerTitle, locked && styles.bannerTitleLocked]} numberOfLines={1}>
          {unit.title}
        </Text>
      </View>
      <Text style={[styles.bannerCount, locked && styles.bannerEyebrowLocked]}>
        {unit.completedPhases}/{unit.totalPhases}
      </Text>
      <Feather
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={locked ? colors.lockedNode : colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    ...shadow.card,
  },
  heroImage: { height: 172, justifyContent: 'flex-end' },
  heroImageInner: { borderRadius: 20 },
  heroContent: { padding: 16, gap: 10 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  heroTexts: { flex: 1, gap: 6 },
  unitChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentFixed,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  unitChipText: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.accentInk,
  },
  heroTitle: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 21,
    lineHeight: 26,
    color: colors.textOnPrimary,
  },
  heroStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroPercent: { fontFamily: fonts.sans.extraBold, fontSize: 20, color: colors.accentFixed },
  heroCount: { fontFamily: fonts.mono.medium, fontSize: 10, color: 'rgba(255, 255, 255, 0.85)' },
  heroTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    padding: 2,
  },
  heroFill: { height: '100%', minWidth: 6, borderRadius: radius.pill, backgroundColor: colors.primaryTint },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadow.card,
  },
  bannerLocked: {
    backgroundColor: colors.creamSoft,
    borderColor: colors.creamSoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primaryTint}80`,
  },
  bannerIconDone: { backgroundColor: colors.primary },
  bannerIconLocked: { backgroundColor: colors.lockedSurface },
  bannerTexts: { flex: 1, gap: 2 },
  bannerEyebrow: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.primary,
  },
  bannerEyebrowLocked: { color: colors.textMuted },
  bannerTitle: { fontFamily: fonts.sans.bold, fontSize: 15, color: colors.textPrimary },
  bannerTitleLocked: { color: colors.textMuted },
  bannerCount: { fontFamily: fonts.mono.medium, fontSize: 12, color: colors.textMuted },
});
