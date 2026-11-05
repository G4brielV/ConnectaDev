import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius } from '@/shared/config/theme';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'soft' | 'danger';
  /** Ícone Feather exibido após o título */
  rightIcon?: keyof typeof Feather.glyphMap;
}

// Variantes com texto na cor primária (fundo claro ou transparente)
const LIGHT_VARIANTS: ReadonlyArray<ButtonProps['variant']> = ['outline', 'soft'];

export function Button({
  title,
  loading = false,
  variant = 'primary',
  rightIcon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isButtonDisabled = disabled || loading;
  const textColor = LIGHT_VARIANTS.includes(variant) ? colors.primary : colors.textOnPrimary;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        isButtonDisabled ? styles.disabled : null,
        style,
      ]}
      disabled={isButtonDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
          {rightIcon && <Feather name={rightIcon} size={20} color={textColor} />}
        </>
      )}
    </TouchableOpacity>
  );
};

// Variantes conforme Identidade_Visual.md §6.1
const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  soft: {
    backgroundColor: colors.creamSoft,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontFamily: fonts.sans.semiBold,
  },
});
