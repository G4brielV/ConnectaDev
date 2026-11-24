import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import type { StreakShieldStatus } from '@/shared/api/streakApi';
import { chunky, colors, fonts, radius, shadow } from '@/shared/config/theme';

export interface StreakShieldCardProps {
  shield: StreakShieldStatus;
  feedbackMessage: string | null;
  errorMessage: string | null;
  isPurchasing: boolean;
  onPressPurchase: () => void;
}

export function StreakShieldCard({
  shield,
  feedbackMessage,
  errorMessage,
  isPurchasing,
  onPressPurchase,
}: StreakShieldCardProps) {
  const isFull = shield.count >= shield.max;
  const missingXp = Math.max(0, shield.cost - shield.availableXp);
  const canAfford = missingXp === 0;
  const xpProgress = Math.min(100, Math.round((shield.availableXp / Math.max(shield.cost, 1)) * 100));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.emblem}>
            <Feather name="shield" size={20} color={colors.secondary} />
          </View>
          <View style={styles.headerTexts}>
            <Text style={styles.title}>Escudo de ofensiva</Text>
            <Text style={styles.subtitle}>
              Protege sua ofensiva se você faltar 1 dia.
            </Text>
          </View>
        </View>
        <View style={[styles.stockPill, shield.count > 0 && styles.stockPillActive]}>
          <Text style={[styles.stockText, shield.count > 0 && styles.stockTextActive]}>
            {shield.count}/{shield.max}
          </Text>
        </View>
      </View>

      <View style={styles.slotsRow}>
        {Array.from({ length: shield.max }, (_, index) => {
          const active = index < shield.count;
          return (
            <View
              key={index}
              style={[styles.slot, active ? styles.slotActive : styles.slotEmpty]}
              accessibilityLabel={`Escudo ${index + 1}: ${active ? 'ativo' : 'vazio'}`}
            >
              <Feather
                name="shield"
                size={15}
                color={active ? '#E5F2F6' : colors.lockedNode}
              />
              <Text style={[styles.slotText, active && styles.slotTextActive]}>
                {active ? `Escudo ${index + 1} · Ativo` : 'Espaço livre'}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.balanceBox}>
        <View style={styles.balanceRow}>
          <View style={styles.balanceLabelRow}>
            <MaterialCommunityIcons name="lightning-bolt" size={15} color={colors.primary} />
            <Text style={styles.balanceLabel}>XP disponível para troca</Text>
          </View>
          <Text style={styles.balanceValue}>{shield.availableXp} XP</Text>
        </View>

        {!isFull && !canAfford ? (
          <View style={styles.progressWrap}>
            <View
              style={styles.progressTrack}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: shield.cost, now: Math.min(shield.availableXp, shield.cost) }}
            >
              <View style={[styles.progressFill, { width: `${xpProgress}%` }]} />
            </View>
            <Text style={styles.progressCaption}>
              {shield.availableXp}/{shield.cost} XP
            </Text>
          </View>
        ) : null}
      </View>

      {feedbackMessage ? (
        <View style={styles.successBanner}>
          <Feather name="check-circle" size={15} color={colors.primary} />
          <Text style={styles.successText}>{feedbackMessage}</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={15} color={colors.danger} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {isFull ? (
        <View style={styles.fullBanner}>
          <Feather name="check-circle" size={16} color={colors.secondary} />
          <Text style={styles.fullBannerText}>
            Proteção máxima ativa ({shield.count}/{shield.max})
          </Text>
        </View>
      ) : canAfford ? (
        <Pressable
          onPress={onPressPurchase}
          disabled={isPurchasing}
          style={({ pressed }) => [
            styles.purchaseCta,
            isPurchasing && styles.purchaseCtaDisabled,
            pressed && !isPurchasing && styles.purchaseCtaPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Resgatar escudo de ofensiva por ${shield.cost} XP`}
        >
          <Feather name="shield" size={17} color={colors.textOnPrimary} />
          <Text style={styles.purchaseCtaText}>Resgatar escudo</Text>
          <View style={styles.costChip}>
            <MaterialCommunityIcons name="lightning-bolt" size={12} color={colors.accentInk} />
            <Text style={styles.costChipText}>{shield.cost} XP</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.lockedAction}>
          <Feather name="lock" size={14} color={colors.textMuted} />
          <Text style={styles.lockedActionText}>
            Faltam {missingXp} XP para resgatar
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light,
    padding: 16,
    gap: 12,
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emblem: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E5F2F6',
    borderWidth: 1,
    borderColor: '#C5E1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  stockPill: {
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stockPillActive: {
    backgroundColor: '#E5F2F6',
  },
  stockText: {
    fontFamily: fonts.mono.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  stockTextActive: {
    color: colors.secondary,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slot: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  slotActive: {
    backgroundColor: colors.secondary,
  },
  slotEmpty: {
    backgroundColor: colors.canvas,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.light,
  },
  slotText: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  slotTextActive: {
    color: colors.textOnPrimary,
  },
  balanceBox: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  balanceLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  balanceValue: {
    fontFamily: fonts.mono.medium,
    fontSize: 13,
    color: colors.primary,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.light,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  progressCaption: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    color: colors.textMuted,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.primaryTint}45`,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  successText: {
    flex: 1,
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.primary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDF3F2',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.danger,
  },
  fullBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#E5F2F6',
    borderRadius: 12,
    paddingVertical: 12,
  },
  fullBannerText: {
    fontFamily: fonts.sans.bold,
    fontSize: 13,
    color: colors.secondary,
  },
  purchaseCta: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    borderBottomWidth: chunky.ctaDepth,
    borderBottomColor: colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  purchaseCtaDisabled: {
    opacity: 0.6,
  },
  purchaseCtaPressed: {
    borderBottomWidth: chunky.pressedDepth,
    transform: [{ translateY: 2 }],
  },
  purchaseCtaText: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 14,
    color: colors.textOnPrimary,
  },
  costChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.accentFixed,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  costChipText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.accentInk,
  },
  lockedAction: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.light,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockedActionText: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
});
