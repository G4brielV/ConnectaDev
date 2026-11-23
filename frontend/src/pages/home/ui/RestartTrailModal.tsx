import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/shared/ui/Button/Button';
import { colors, fonts, radius, shadow, spacing } from '@/shared/config/theme';

export interface RestartTrailModalProps {
  visible: boolean;
  currentArea?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RestartTrailModal({
  visible,
  currentArea,
  onConfirm,
  onCancel,
}: RestartTrailModalProps) {
  const trailReference = currentArea
    ? `na sua trilha atual (${currentArea})`
    : 'na sua trilha atual';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        style={styles.overlay}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Fechar aviso de recomeçar trilha"
      >
        <Pressable
          style={styles.content}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.iconContainer}>
            <Feather name="alert-triangle" size={26} color={colors.danger} />
          </View>

          <Text style={styles.title}>Recomeçar trilha?</Text>
          <Text style={styles.description}>
            Ao refazer o teste vocacional, você perderá todo o progresso {trailReference}.
          </Text>

          <View style={styles.reassuranceBox}>
            <Feather name="shield" size={16} color={colors.primary} />
            <Text style={styles.reassuranceText}>
              Seu XP, nível e ofensiva continuam salvos na sua conta.
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title="Refazer teste vocacional"
              onPress={onConfirm}
              variant="danger"
              accessibilityLabel="Confirmar e ir para o teste vocacional"
            />
            <Button
              title="Cancelar"
              onPress={onCancel}
              variant="soft"
              accessibilityLabel="Cancelar e manter trilha atual"
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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.card,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.sans.bold,
    fontSize: 20,
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
