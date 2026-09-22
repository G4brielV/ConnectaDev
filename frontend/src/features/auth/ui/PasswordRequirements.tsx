import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius } from '@/shared/config/theme';

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

// Pills de feedback em grade 2x2, como na tela "Cadastro Onboarding" do Stitch
export function PasswordRequirements({
  validation,
  showWhenEmpty = false,
  passwordLength,
}: PasswordRequirementsProps) {
  if (!showWhenEmpty && passwordLength === 0) {
    return null;
  }

  const items = [
    { key: 'min', label: '8+ caracteres', met: validation.hasMinLength },
    { key: 'upper', label: 'Maiúscula', met: validation.hasUppercase },
    { key: 'lower', label: 'Minúscula', met: validation.hasLowercase },
    { key: 'num', label: 'Número', met: validation.hasNumber },
  ];

  return (
    <View style={styles.grid} accessibilityLabel="Requisitos da senha">
      {items.map((item) => (
        <View key={item.key} style={[styles.pill, item.met ? styles.pillMet : styles.pillUnmet]}>
          <Feather
            name={item.met ? 'check' : 'circle'}
            size={item.met ? 14 : 8}
            color={item.met ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.label, item.met ? styles.labelMet : styles.labelUnmet]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: -8,
    marginBottom: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48.5%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  pillMet: {
    backgroundColor: '#DDF1F0',
  },
  pillUnmet: {
    backgroundColor: colors.creamSoft,
  },
  label: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
  },
  labelMet: {
    color: colors.primary,
  },
  labelUnmet: {
    color: colors.textMuted,
  },
});
