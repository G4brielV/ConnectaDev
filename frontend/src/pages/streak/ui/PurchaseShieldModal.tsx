import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/shared/ui/Button/Button';
import { colors, fonts, radius, shadow, spacing } from '@/shared/config/theme';

export interface PurchaseShieldModalProps {
  visible: boolean;
  cost: number;
  availableXp: number;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PurchaseShieldModal({
  visible,
  cost,
  availableXp,
  isLoading,
  onConfirm,
  onCancel,
}: PurchaseShieldModalProps) {
  const remainingAfterPurchase = Math.max(0, availableXp - cost);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isLoading ? undefined : onCancel}
    >
      <Pressable
        style={styles.overlay}
        onPress={isLoading ? undefined : onCancel}
        accessibilityRole="button"
        accessibilityLabel="Fechar confirmação de resgate"
      >
        <Pressable
          style={styles.content}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.iconContainer}>
            <Feather name="shield" size={26} color={colors.secondary} />
          </View>

          <Text style={styles.title}>Resgatar Escudo de Ofensiva?</Text>
          <Text style={styles.description}>
            O escudo entra em ação automaticamente para manter sua ofensiva viva se você ficar 1 dia sem estudar.
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.primary} />
              <Text style={styles.summaryValue}>{cost} XP</Text>
            </View>
            <Feather name="arrow-right" size={16} color={colors.textMuted} />
            <View style={[styles.summaryPill, styles.summaryPillShield]}>
              <Feather name="shield" size={14} color={colors.secondary} />
              <Text style={[styles.summaryValue, styles.summaryValueShield]}>+1 Escudo</Text>
            </View>
          </View>

          <Text style={styles.balanceHint}>
            Saldo disponível após o resgate: {remainingAfterPurchase} XP
          </Text>

          <View style={styles.reassuranceBox}>
            <Feather name="award" size={15} color={colors.primary} />
            <Text style={styles.reassuranceText}>
              Seu XP total e seu nível atual não diminuem com a troca.
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title={`Resgatar por ${cost} XP`}
              variant="secondary"
              loading={isLoading}
              onPress={onConfirm}
              accessibilityLabel={`Confirmar resgate de escudo por ${cost} XP`}
            />
            <Button
              title="Cancelar"
              variant="soft"
              disabled={isLoading}
              onPress={onCancel}
              accessibilityLabel="Cancelar resgate"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 22, 52, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.card,
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E5F2F6',
    borderWidth: 1,
    borderColor: '#C5E1EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 19,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${colors.primaryTint}55`,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  summaryPillShield: {
    backgroundColor: '#E5F2F6',
  },
  summaryValue: {
    fontFamily: fonts.mono.medium,
    fontSize: 12,
    color: colors.primary,
  },
  summaryValueShield: {
    color: colors.secondary,
  },
  balanceHint: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  reassuranceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    backgroundColor: colors.creamSoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: spacing.lg,
  },
  reassuranceText: {
    flex: 1,
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.secondary,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
});
