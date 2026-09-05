import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

export function checkPasswordComplexity(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    isValid,
  };
}

interface PasswordRequirementsProps {
  validation: PasswordValidationResult;
  showWhenEmpty?: boolean;
  passwordLength: number;
}

export function PasswordRequirements({
  validation,
  showWhenEmpty = false,
  passwordLength,
}: PasswordRequirementsProps) {
  if (!showWhenEmpty && passwordLength === 0) {
    return null;
  }

  const items = [
    { key: 'min', label: 'No mínimo 8 caracteres', met: validation.hasMinLength },
    { key: 'upper', label: 'Uma letra maiúscula', met: validation.hasUppercase },
    { key: 'lower', label: 'Uma letra minúscula', met: validation.hasLowercase },
    { key: 'num', label: 'Um número', met: validation.hasNumber },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Requisitos da senha:</Text>
      {items.map((item) => (
        <View key={item.key} style={styles.requirementRow}>
          <Text style={[styles.icon, item.met ? styles.metIcon : styles.unmetIcon]}>
            {item.met ? '✓' : '•'}
          </Text>
          <Text style={[styles.label, item.met ? styles.metLabel : styles.unmetLabel]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: -8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  icon: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 18,
  },
  metIcon: {
    color: '#10B981',
  },
  unmetIcon: {
    color: '#9CA3AF',
  },
  label: {
    fontSize: 12,
  },
  metLabel: {
    color: '#065F46',
    fontWeight: '500',
  },
  unmetLabel: {
    color: '#6B7280',
  },
});
