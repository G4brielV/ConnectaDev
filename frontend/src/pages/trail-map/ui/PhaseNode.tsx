import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, radius } from '@/shared/config/theme';
import type { TrailMapPhase } from '@/shared/api/trailMapApi';
import { BUBBLE_SLOT, LABEL_SLOT, NODE_SLOT, phaseLabel } from '../trailMapLayout';

interface PhaseNodeProps {
  phase: TrailMapPhase;
  indexInUnit: number;
  onPress: (phase: TrailMapPhase) => void;
}

interface NodeLook {
  size: number;
  square: boolean;
  face: string;
  depthColor: string;
  depth: number;
  icon: React.ReactNode;
}

/** Loop 0→1 para halo e balão; desligado quando o sistema pede menos movimento. */
function useLoop(active: boolean, duration: number): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    let loop: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled || reduced) return;
        loop = Animated.loop(
          Animated.timing(value, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        );
        loop.start();
      })
      .catch(() => {
        // sem a preferência de acessibilidade, o nó só fica parado
      });

    return () => {
      cancelled = true;
      loop?.stop();
      value.setValue(0);
    };
  }, [active, duration, value]);

  return value;
}

function nodeLook(phase: TrailMapPhase): NodeLook {
  const isBonus = phase.kind === 'BONUS';
  const isBoss = phase.kind === 'BOSS';
  const locked = phase.status === 'locked';
  const current = phase.status === 'current';

  if (isBonus) {
    return {
      size: 64,
      square: true,
      face: locked ? colors.lockedSurface : colors.accentFixed,
      depthColor: locked ? colors.lockedNode : colors.accentDeep,
      depth: 5,
      icon: (
        <MaterialCommunityIcons
          name={phase.status === 'completed' ? 'treasure-chest-outline' : 'treasure-chest'}
          size={36}
          color={locked ? colors.textMuted : colors.accentInk}
        />
      ),
    };
  }

  if (locked) {
    return {
      size: isBoss ? 74 : 66,
      square: isBoss,
      face: colors.lockedSurface,
      depthColor: colors.lockedNode,
      depth: 6,
      icon: isBoss ? (
        <MaterialCommunityIcons name="crown" size={34} color={colors.accentDeep} />
      ) : (
        <Feather name="lock" size={26} color={colors.textMuted} />
      ),
    };
  }

  if (phase.status === 'completed') {
    return {
      size: isBoss ? 74 : 68,
      square: isBoss,
      face: colors.primary,
      depthColor: colors.primaryDeep,
      depth: 6,
      icon: isBoss ? (
        <MaterialCommunityIcons name="crown" size={36} color={colors.accentFixed} />
      ) : (
        <Feather name="check" size={32} color={colors.textOnPrimary} />
      ),
    };
  }

  return {
    size: isBoss ? 78 : 76,
    square: isBoss,
    face: colors.primary,
    depthColor: colors.primaryDeepest,
    depth: current ? 8 : 6,
    icon: isBoss ? (
      <MaterialCommunityIcons name="crown" size={40} color={colors.accentFixed} />
    ) : (
      <MaterialCommunityIcons name="play" size={42} color={colors.primaryTint} />
    ),
  };
}

function accessibilityText(phase: TrailMapPhase, label: string): string {
  switch (phase.status) {
    case 'locked':
      return `${label}. Bloqueada. Conclua a fase anterior para liberar.`;
    case 'completed':
      return `${label}. Concluída com ${phase.stars} de 3 estrelas.`;
    case 'available':
      return `${label}. Baú bônus opcional, vale ${phase.xpReward} XP.`;
    default:
      return `${label}. Fase atual, vale ${phase.xpReward} XP.`;
  }
}

/**
 * Nó do mapa de fases. O relevo "3D" vem de uma View de base deslocada atrás
 * da face — o `box-shadow: 0 6px 0` do Stitch não existe no React Native.
 */
export function PhaseNode({ phase, indexInUnit, onPress }: PhaseNodeProps) {
  const [pressed, setPressed] = useState(false);
  const isCurrent = phase.status === 'current';
  const isLocked = phase.status === 'locked';
  const isBonus = phase.kind === 'BONUS';
  const isBoss = phase.kind === 'BOSS';

  const look = nodeLook(phase);
  const label = phaseLabel(phase.title, phase.kind, indexInUnit);
  const halo = useLoop(isCurrent, 1600);
  const bounce = useLoop(isCurrent, 1400);

  const pressDepth = pressed ? 2 : look.depth;
  const faceRadius = look.square ? 20 : look.size / 2;

  return (
    <View style={styles.wrapper}>
      {isCurrent ? (
        <Animated.View
          style={[
            styles.bubbleSlot,
            {
              transform: [
                { translateY: bounce.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -5, 0] }) },
              ],
            },
          ]}
        >
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>COMEÇAR!</Text>
            <View style={styles.bubbleXp}>
              <Text style={styles.bubbleXpText}>+{phase.xpReward} XP</Text>
            </View>
          </View>
          <View style={styles.bubbleArrow} />
        </Animated.View>
      ) : null}

      <View style={styles.nodeSlot}>
        {isCurrent ? (
          <Animated.View
            style={[
              styles.halo,
              {
                width: look.size + 18,
                height: look.size + 18,
                borderRadius: look.square ? 26 : (look.size + 18) / 2,
                opacity: halo.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 0.12, 0] }),
                transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.3] }) }],
              },
            ]}
          />
        ) : null}

        <Pressable
          onPress={() => onPress(phase)}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          accessibilityRole="button"
          accessibilityLabel={accessibilityText(phase, label)}
          accessibilityState={{ disabled: isLocked }}
          hitSlop={6}
          style={{ width: look.size, height: look.size + look.depth }}
        >
          <View
            style={[
              styles.depth,
              {
                width: look.size,
                height: look.size,
                borderRadius: faceRadius,
                top: look.depth,
                backgroundColor: look.depthColor,
              },
            ]}
          />
          <View
            style={[
              styles.face,
              {
                width: look.size,
                height: look.size,
                borderRadius: faceRadius,
                backgroundColor: look.face,
                transform: [{ translateY: look.depth - pressDepth }],
              },
            ]}
          >
            {look.icon}
          </View>

          {phase.status === 'completed' ? (
            <View style={styles.starsBadge}>
              {[1, 2, 3].map((position) => (
                <MaterialCommunityIcons
                  key={position}
                  name={position <= phase.stars ? 'star' : 'star-outline'}
                  size={12}
                  color={colors.accentInk}
                />
              ))}
            </View>
          ) : isBonus ? (
            <View style={[styles.cornerBadge, isLocked ? styles.cornerBadgeMuted : styles.cornerBadgeXp]}>
              <Text style={[styles.cornerBadgeText, !isLocked && styles.cornerBadgeTextXp]}>
                +{phase.xpReward} XP
              </Text>
            </View>
          ) : isBoss ? (
            <View style={[styles.cornerBadge, isLocked ? styles.cornerBadgeMuted : styles.cornerBadgeGold]}>
              <Text style={[styles.cornerBadgeText, !isLocked && styles.cornerBadgeTextGold]}>
                CHEFÃO
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.labelSlot}>
        <View
          style={[
            styles.labelPill,
            isCurrent && styles.labelPillCurrent,
            isLocked && styles.labelPillLocked,
            isBonus && !isLocked && styles.labelPillBonus,
          ]}
        >
          <Text
            style={[
              styles.labelText,
              isCurrent && styles.labelTextCurrent,
              isLocked && styles.labelTextLocked,
              isBonus && !isLocked && styles.labelTextBonus,
            ]}
            numberOfLines={isBonus ? 1 : 2}
          >
            {label}
          </Text>
        </View>
        {isBonus ? <Text style={styles.bonusCaption}>BAÚ BÔNUS · OPCIONAL</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 196, alignItems: 'center' },
  bubbleSlot: {
    height: BUBBLE_SLOT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    pointerEvents: 'none',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5,
  },
  bubbleText: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: colors.textOnPrimary,
  },
  bubbleXp: {
    backgroundColor: colors.primaryTint,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bubbleXpText: { fontFamily: fonts.mono.medium, fontSize: 10, color: colors.primaryDeepest },
  bubbleArrow: {
    width: 10,
    height: 10,
    backgroundColor: colors.primary,
    transform: [{ rotate: '45deg' }],
    marginTop: -6,
    marginBottom: 2,
  },
  nodeSlot: { height: NODE_SLOT, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', backgroundColor: colors.primaryTint, pointerEvents: 'none' },
  depth: { position: 'absolute', left: 0 },
  face: { alignItems: 'center', justifyContent: 'center' },
  starsBadge: {
    position: 'absolute',
    top: -12,
    right: -14,
    flexDirection: 'row',
    gap: 1,
    backgroundColor: colors.accentFixed,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  cornerBadge: {
    position: 'absolute',
    top: -10,
    right: -18,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  cornerBadgeXp: { backgroundColor: colors.primary },
  cornerBadgeGold: { backgroundColor: colors.accentFixed },
  cornerBadgeMuted: { backgroundColor: colors.lockedSurface },
  cornerBadgeText: {
    fontFamily: fonts.mono.medium,
    fontSize: 9,
    letterSpacing: 0.4,
    color: colors.textMuted,
  },
  cornerBadgeTextXp: { color: colors.textOnPrimary },
  cornerBadgeTextGold: { color: colors.accentInk },
  labelSlot: { height: LABEL_SLOT, alignItems: 'center', paddingTop: 2, gap: 3 },
  labelPill: {
    maxWidth: 196,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.light,
  },
  labelPillCurrent: { backgroundColor: `${colors.primaryTint}66`, borderColor: `${colors.primaryTint}` },
  labelPillLocked: { backgroundColor: colors.lockedSurface, borderColor: colors.lockedSurface },
  labelPillBonus: { backgroundColor: colors.accentSoft, borderColor: colors.accentFixed },
  labelText: {
    fontFamily: fonts.sans.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  labelTextCurrent: { fontFamily: fonts.sans.extraBold, color: colors.primary },
  labelTextLocked: { fontFamily: fonts.sans.semiBold, color: colors.textMuted },
  labelTextBonus: { color: colors.accentInk },
  // Fundo da tela atrás da legenda: o trilho passa por baixo e cortaria o texto.
  bonusCaption: {
    fontFamily: fonts.mono.medium,
    fontSize: 9,
    letterSpacing: 0.6,
    color: colors.accentInk,
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
});
