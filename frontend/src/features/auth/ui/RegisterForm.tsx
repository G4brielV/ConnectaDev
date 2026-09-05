import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/entities/session';
import { Input } from '@/shared/ui/Input/Input';
import { Button } from '@/shared/ui/Button/Button';
import { Toast } from '@/shared/ui/Toast/Toast';
import { AuthError } from '../api/authService';
import { PasswordRequirements, checkPasswordComplexity } from './PasswordRequirements';
import { ConflictModal } from './ConflictModal';

export interface RegisterFormProps {
  onNavigateToLogin?: (initialEmail?: string) => void;
}

// Regex estrita para validação de e-mail (TT-58 / Cenário 3)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function RegisterForm({ onNavigateToLogin }: RegisterFormProps) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Erros de validação inline por campo
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  // Estado do Modal de Conflito 409 (TT-59 / Cenário 4)
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Estado do Toast de Erro de Rede (TT-61 / Cenário 6)
  const [networkToast, setNetworkToast] = useState<{
    visible: boolean;
    message: string;
  }>({
    visible: false,
    message: '',
  });

  // Validação dinâmica da complexidade da senha (TT-60 / Cenário 5)
  const passwordValidation = useMemo(
    () => checkPasswordComplexity(password),
    [password]
  );

  // Cenário 3: Validação de e-mail em tempo real
  const isEmailFormatValid = useMemo(() => {
    if (!email.trim()) return true; // Vazio é tratado por obrigatoriedade
    return EMAIL_REGEX.test(email.trim());
  }, [email]);

  // Cenário 2 & 3 & 5: Validação completa do formulário antes do envio
  const validateForm = (): boolean => {
    const newErrors: { name?: string; email?: string; password?: string } = {};

    // Validação de Nome (Cenário 2)
    if (!name.trim()) {
      newErrors.name = 'Preenchimento obrigatório';
    }

    // Validação de E-mail (Cenários 2 e 3)
    if (!email.trim()) {
      newErrors.email = 'Preenchimento obrigatório';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Informe um e-mail válido';
    }

    // Validação de Senha (Cenários 2 e 5)
    if (!password) {
      newErrors.password = 'Preenchimento obrigatório';
    } else if (!passwordValidation.isValid) {
      newErrors.password = 'A senha não cumpre todos os requisitos de segurança';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    // Cenário 2: Se houver campos vazios ou inválidos, NÃO dispara requisição de rede
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Cenário 1: Sanitizar campos (trim nos espaços)
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      // Sucesso: authContext atualiza isAuthenticated, resetando a navegação
    } catch (error) {
      if (error instanceof AuthError) {
        // Cenário 4: Conflito 409 (e-mail já cadastrado)
        if (error.statusCode === 409 || error.code === 'EMAIL_ALREADY_EXISTS') {
          setShowConflictModal(true);
          return;
        }

        // Cenário 6: Falha de conexão de rede
        if (error.code === 'NETWORK_ERROR' || error.statusCode === 0) {
          setNetworkToast({
            visible: true,
            message: error.message,
          });
          return;
        }

        // Outros erros da API
        setNetworkToast({
          visible: true,
          message: error.message,
        });
      } else {
        setNetworkToast({
          visible: true,
          message: 'Sem conexão com a internet. Verifique sua rede e tente novamente',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Botão desabilitado se e-mail estiver com formato inválido ou senha não cumprir requisitos (Cenários 3 e 5)
  const isSubmitDisabled =
    (email.trim().length > 0 && !isEmailFormatValid) ||
    (password.length > 0 && !passwordValidation.isValid);

  return (
    <View style={styles.formContainer}>
      {/* Campo: Nome Completo */}
      <Input
        label="Nome completo"
        placeholder="Seu nome completo"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
        }}
        autoCapitalize="words"
        autoCorrect={false}
        error={errors.name}
      />

      {/* Campo: E-mail */}
      <Input
        label="E-mail"
        placeholder="seu.email@exemplo.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) {
            setErrors((prev) => ({ ...prev, email: undefined }));
          }
          // Validação visual inline de e-mail ao digitar
          if (text.trim().length > 0 && !EMAIL_REGEX.test(text.trim())) {
            setErrors((prev) => ({ ...prev, email: 'Informe um e-mail válido' }));
          }
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.email}
      />

      {/* Campo: Senha */}
      <Input
        label="Senha"
        placeholder="Crie uma senha forte"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) {
            setErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        secureTextEntry
        autoCapitalize="none"
        error={errors.password}
      />

      {/* Indicadores visuais de requisitos da senha (TT-60 / Cenário 5) */}
      <PasswordRequirements
        validation={passwordValidation}
        passwordLength={password.length}
        showWhenEmpty={false}
      />

      {/* Botão de Criação de Conta (TT-56) */}
      <Button
        title="Criar Conta"
        onPress={handleRegister}
        loading={isSubmitting}
        disabled={isSubmitDisabled}
        style={styles.submitButton}
      />

      {/* Modal de Conflito 409 com atalho para Login (TT-59 / Cenário 4) */}
      <ConflictModal
        visible={showConflictModal}
        onGoToLogin={() => {
          setShowConflictModal(false);
          onNavigateToLogin?.(email.trim());
        }}
        onClose={() => setShowConflictModal(false)}
      />

      {/* Toast flutuante de erro de rede (TT-61 / Cenário 6) */}
      <Toast
        visible={networkToast.visible}
        message={networkToast.message}
        type="error"
        onDismiss={() => setNetworkToast((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  submitButton: {
    marginTop: 8,
  },
});
