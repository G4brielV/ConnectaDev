import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, chunky } from '@/shared/config/theme';
import type { TrailMapPhase } from '@/shared/api/trailMapApi';

interface PhaseNodeProps {
  phase: TrailMapPhase;
  onPress: (phase: TrailMapPhase) => void;
}

const ICON_BY_KIND: Record<string, keyof typeof Feather.glyphMap> = {
  BONUS: 'gift',
  BOSS: 'award',
  STANDARD: 'terminal',
};

/**
 * Nó do mapa de fases. O relevo vem de uma View de base deslocada atrás do
 * círculo — o `box-shadow: 0 6px 0` do Stitch não existe no React Native.
 */
export function PhaseNode({ phase, onPress }: PhaseNodeProps) {
  const [pressed, setPressed] = React.useState(false);

  const isLocked = phase.status === 'locked';
  const isCompleted = phase.status === 'completed';
  const isBonus = phase.kind === 'BONUS';

  const surface = isLocked
    ? colors.lockedNode
    : isCompleted
      ? colors.primarySoft
      : isBonus
        ? colors.accent
        : colors.primary;

  const depthColor = isLocked
    ? colors.light
    : isCompleted
      ? colors.primaryDeep
      : isBonus
        ? colors.accentDeep
        : colors.primaryDeepest;

  const iconColor = isLocked
    ? colors.textMuted
    : isCompleted
      ? colors.primaryDeep
      : isBonus
        ? colors.textPrimary
        : colors.textOnPrimary;

  const icon: keyof typeof Feather.glyphMap = isLocked
    ? 'lock'
    : isCompleted
      ? 'check'
      : ICON_BY_KIND[phase.kind] ?? 'terminal';

  const depth = pressed ? chunky.pressedDepth : chunky.nodeDepth;
  const label = isBonus ? 'Baú Bônus' : phase.kind === 'BOSS' ? 'CHEFÃO' : `${phase.sequence}. ${phase.title}`;

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => onPress(phase)}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={
          isLocked
            ? `${phase.title}. Bloqueada. Conclua a fase anterior para liberar.`
            : isCompleted
              ? `${phase.title}. Concluída com ${phase.stars} de 3 estrelas.`
              : phase.status === 'available'
                ? `${phase.title}. Opcional: não bloqueia a trilha.`
                : `${phase.title}. Disponível para começar.`
        }
        accessibilityState={{ disabled: isLocked }}
        style={styles.nodeArea}
      >
        <View style={[styles.depth, { backgroundColor: depthColor, top: depth }]} />
        <View style={[styles.node, { backgroundColor: surface, transform: [{ translateY: pressed ? depth - chunky.nodeDepth : 0 }] }]}>
          <Feather name={icon} size={phase.status === 'current' ? 30 : 26} color={iconColor} />
        </View>
      </Pressable>

      {isCompleted ? (
        <View style={styles.stars}>
          {[1, 2, 3].map((position) => (
            <Feather
              key={position}
              name="star"
              size={13}
              color={position <= phase.stars ? colors.accent : colors.light}
            />
          ))}
        </View>
      ) : null}

      {phase.status === 'current' ? (
        <View style={styles.startPill}>
          <Text style={styles.startPillText}>COMEÇAR!</Text>
        </View>
      ) : null}

      <Text style={[styles.label, isLocked && styles.labelLocked]} numberOfLines={2}>
        {label}
      </Text>
      {!isLocked && !isCompleted ? (
        <Text style={styles.xpHint}>
          +{phase.xpReward} XP{isBonus ? ' · opcional' : ''}
        </Text>
      ) : null}
    </View>
  );
}

const NODE_SIZE = 72;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: 150,
    gap: 4,
  },
  nodeArea: {
    width: NODE_SIZE,
    height: NODE_SIZE + chunky.nodeDepth,
    justifyContent: 'flex-start',
  },
  depth: {
    position: 'absolute',
    left: 0,
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  startPill: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  startPillText: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.primary,
  },
  label: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  labelLocked: {
    color: colors.textMuted,
    fontFamily: fonts.sans.regular,
  },
  xpHint: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    color: colors.textMuted,
  },
});
