import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/entities/session';
import { Input } from '@/shared/ui/Input/Input';
import { Button } from '@/shared/ui/Button/Button';
import { AuthError } from '../api/authService';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Erros de validação de campo
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  // Erro geral retornado pela API (ex: 401)
  const [apiError, setApiError] = useState<string | null>(null);

  // TT-52: Validação de campos
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Informe o seu e-mail';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Informe um e-mail válido';
    }

    if (!password) {
      newErrors.password = 'Informe sua senha';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve conter no mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      // TT-54: Tratar erro 401 com mensagem amigável
      if (error instanceof AuthError) {
        setApiError(error.message);
      } else {
        setApiError('Não foi possível conectar. Tente novamente mais tarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      {apiError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{apiError}</Text>
        </View>
      )}

      <Input
        label="E-mail"
        placeholder="seu.email@exemplo.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.email}
      />

      <Input
        label="Senha"
        placeholder="Sua senha secreta"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
        }}
        secureTextEntry
        autoCapitalize="none"
        error={errors.password}
      />

      <Button
        title="Entrar"
        onPress={handleLogin}
        loading={isSubmitting}
        style={styles.submitButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 8,
  },
});
