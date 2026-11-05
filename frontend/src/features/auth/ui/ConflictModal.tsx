import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/shared/ui/Button/Button';
import { colors, fonts, radius } from '@/shared/config/theme';

export interface ConflictModalProps {
  visible: boolean;
  onGoToLogin: () => void;
  onClose: () => void;
}

export function ConflictModal({
  visible,
  onGoToLogin,
  onClose,
}: ConflictModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Feather name="alert-triangle" size={24} color={colors.accent} />
          </View>

          <Text style={styles.title}>Este e-mail já está em uso</Text>
          <Text style={styles.description}>
            Já existe uma conta cadastrada com este endereço de e-mail. Faça login para acessar sua conta ou use outro e-mail.
          </Text>

          <Button
            title="Ir para o Login"
            onPress={onGoToLogin}
            variant="primary"
            style={styles.primaryButton}
          />

          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Tentar outro e-mail</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 22, 52, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.sans.bold,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    marginBottom: 10,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
});
