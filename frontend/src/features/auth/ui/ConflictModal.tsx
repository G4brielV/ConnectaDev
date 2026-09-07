import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Button } from '@/shared/ui/Button/Button';

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
            <Text style={styles.iconText}>⚠️</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
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
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
