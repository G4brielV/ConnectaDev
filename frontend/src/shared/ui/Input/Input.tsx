import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Platform,
  TextStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius } from '@/shared/config/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Ícone Feather exibido à esquerda do campo */
  leftIcon?: keyof typeof Feather.glyphMap;
  /** Elemento exibido à direita do campo (ex.: botão de mostrar senha) */
  rightAccessory?: React.ReactNode;
  /** Elemento exibido à direita do label (ex.: link "Esqueci minha senha") */
  labelAccessory?: React.ReactNode;
}

export function Input({
  label,
  error,
  leftIcon,
  rightAccessory,
  labelAccessory,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {(label || labelAccessory) && (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {labelAccessory}
        </View>
      )}
      <View style={styles.field}>
        {leftIcon && (
          <Feather name={leftIcon} size={20} color={colors.primary} style={styles.leftIcon} />
        )}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightAccessory ? styles.inputWithRightAccessory : null,
            isFocused ? styles.inputFocused : null,
            error ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightAccessory && <View style={styles.rightAccessory}>{rightAccessory}</View>}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.sans.semiBold,
    color: colors.secondary,
  },
  field: {
    width: '100%',
    justifyContent: 'center',
  },
  leftIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  rightAccessory: {
    position: 'absolute',
    right: 10,
    zIndex: 1,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.light,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: fonts.sans.regular,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    // Remove o anel de foco padrão do navegador; o foco é indicado pela borda.
    // 'none' é válido no react-native-web, mas não está na tipagem do RN.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null),
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputWithLeftIcon: {
    paddingLeft: 44,
  },
  inputWithRightAccessory: {
    paddingRight: 44,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FDF3F2',
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.danger,
    marginTop: 4,
  },
});
