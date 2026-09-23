import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/entities/session';
import { checkPasswordComplexity, PasswordRequirements } from '@/features/auth';
import { Input } from '@/shared/ui/Input/Input';
import { Button } from '@/shared/ui/Button/Button';
import { Logo } from '@/shared/ui/Logo';
import { colors, fonts, radius, shadow } from '@/shared/config/theme';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecoveryPassword'>;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LENGTH = 6;

type FieldErrors = {
  email?: string;
  token?: string;
  password?: string;
  secondPassword?: string;
};

// Layout alinhado às telas de Login/Cadastro do Stitch: fluxo em duas etapas com stepper
export default function RecoveryPasswordPage() {
  const navigation = useNavigation<NavigationProp>();
  const { recoveryPassword, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [secondPassword, setSecondPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showSecondPassword, setShowSecondPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  // false = etapa e-mail | true = etapa token + nova senha
  const [isTokenStep, setIsTokenStep] = useState(false);

  const validateEmailStep = (): boolean => {
    const newErrors: FieldErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Informe o seu e-mail';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Informe um e-mail válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTokenStep = (): boolean => {
    const newErrors: FieldErrors = {};

    if (!token.trim()) {
      newErrors.token = 'Informe o token recebido por e-mail';
    }

    if (!password) {
      newErrors.password = 'Informe a nova senha';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = `A senha deve conter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`;
    }

    if (!secondPassword) {
      newErrors.secondPassword = 'Confirme a nova senha';
    } else if (secondPassword !== password) {
      newErrors.secondPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const passwordValidation = useMemo(() => checkPasswordComplexity(password), [password]);

  // ---------- Handlers ----------
  const handleSendInstructions = async () => {
    setErrorMessage('');
    if (!validateEmailStep()) return;

    setIsLoading(true);
    try {
      const message = await recoveryPassword(email.trim());
      Alert.alert('Verifique seu e-mail', message);
      setErrors({});
      setIsTokenStep(true);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar as instruções. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage('');
    if (!validateTokenStep()) return;
    if (!passwordValidation.isValid) return;

    setIsLoading(true);
    try {
      const message = await resetPassword(token.trim(), password);
      navigation.navigate('Login', {
        successMessage: message || 'Senha alterada com sucesso.',
      });
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Token inválido ou expirado. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendToken = () => {
    setToken('');
    setPassword('');
    setSecondPassword('');
    setErrors({});
    setErrorMessage('');
    setIsTokenStep(false);
  };

  const handleBack = () => {
    if (isTokenStep) {
      handleResendToken();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Login');
    }
  };

  const isPasswordStepReady = passwordValidation.isValid;

  // ---------- UI ----------
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel={
                isTokenStep ? 'Voltar para a etapa de e-mail' : 'Voltar para a tela anterior'
              }
              hitSlop={8}
            >
              <Feather name="arrow-left" size={20} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.stepPill}>
              <View style={styles.stepDot} />
              <Text style={styles.stepPillText}>RECUPERAR ACESSO</Text>
            </View>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.header}>
            <Logo size={48} showWordmark={false} />
            <Text style={styles.title}>Recuperar senha</Text>
            <Text style={styles.subtitle}>
              {isTokenStep
                ? 'Enviamos um token para o seu e-mail. Use-o para definir a nova senha.'
                : 'Informe o e-mail cadastrado e enviaremos as instruções de redefinição.'}
            </Text>
          </View>

          <View style={styles.stepper} accessibilityLabel="Progresso da recuperação de senha">
            <View style={styles.stepTrack}>
              <View style={[styles.stepNode, styles.stepNodeActive]}>
                {isTokenStep ? (
                  <Feather name="check" size={13} color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.stepNodeText}>1</Text>
                )}
              </View>
              <View style={[styles.stepLine, isTokenStep && styles.stepLineActive]} />
              <View style={[styles.stepNode, isTokenStep && styles.stepNodeActive]}>
                <Text style={[styles.stepNodeText, !isTokenStep && styles.stepNodeTextPending]}>
                  2
                </Text>
              </View>
            </View>
            <View style={styles.stepLabels}>
              <Text style={[styles.stepLabel, !isTokenStep && styles.stepLabelActive]}>E-mail</Text>
              <Text style={[styles.stepLabel, isTokenStep && styles.stepLabelActive]}>
                Nova senha
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {isTokenStep ? (
              <>
                {/* -------- Etapa 2: Token + Nova senha -------- */}
                <Input
                  label="Token"
                  leftIcon="key"
                  placeholder="Cole o token recebido"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={token}
                  onChangeText={(text) => {
                    setToken(text);
                    if (errors.token) setErrors((prev) => ({ ...prev, token: undefined }));
                    if (errorMessage) setErrorMessage('');
                  }}
                  editable={!isLoading}
                  error={errors.token}
                />

                <Input
                  label="Nova senha"
                  leftIcon="lock"
                  placeholder="Digite a nova senha"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    if (errors.secondPassword)
                      setErrors((prev) => ({ ...prev, secondPassword: undefined }));
                    if (errorMessage) setErrorMessage('');
                  }}
                  editable={!isLoading}
                  error={errors.password}
                  rightAccessory={
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}
                      style={styles.toggleButton}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      <Feather
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  }
                />

                <PasswordRequirements
                  validation={passwordValidation}
                  passwordLength={password.length}
                  showWhenEmpty={false}
                />

                <Input
                  label="Confirmar nova senha"
                  leftIcon="lock"
                  placeholder="Repita a nova senha"
                  secureTextEntry={!showSecondPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={secondPassword}
                  onChangeText={(text) => {
                    setSecondPassword(text);
                    if (errors.secondPassword)
                      setErrors((prev) => ({ ...prev, secondPassword: undefined }));
                    if (errorMessage) setErrorMessage('');
                  }}
                  editable={!isLoading}
                  error={errors.secondPassword}
                  rightAccessory={
                    <Pressable
                      onPress={() => setShowSecondPassword((v) => !v)}
                      hitSlop={8}
                      style={styles.toggleButton}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showSecondPassword ? 'Ocultar confirmação' : 'Mostrar confirmação'
                      }
                    >
                      <Feather
                        name={showSecondPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  }
                />

                <Button
                  title={isPasswordStepReady ? 'Alterar senha' : 'Digite uma senha válida'}
                  rightIcon={isPasswordStepReady ? 'arrow-right' : undefined}
                  onPress={handleResetPassword}
                  loading={isLoading}
                  disabled={!isPasswordStepReady}
                />

                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Não recebeu o token?{' '}
                    <Text
                      style={styles.footerLink}
                      onPress={isLoading ? undefined : handleResendToken}
                      accessibilityRole="link"
                    >
                      Enviar novamente
                    </Text>
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* -------- Etapa 1: E-mail -------- */}
                <Input
                  label="E-mail"
                  leftIcon="mail"
                  placeholder="seuemail@dominio.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    if (errorMessage) setErrorMessage('');
                  }}
                  editable={!isLoading}
                  error={errors.email}
                />

                <Button
                  title="Enviar instruções"
                  rightIcon="send"
                  onPress={handleSendInstructions}
                  loading={isLoading}
                />

                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Lembrou da senha?{' '}
                    <Text
                      style={styles.footerLink}
                      onPress={() => navigation.navigate('Login')}
                      accessibilityRole="link"
                    >
                      Voltar para o login
                    </Text>
                  </Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.helperPill}>
            <Feather name="shield" size={14} color={colors.accent} />
            <Text style={styles.helperText} numberOfLines={2}>
              O token expira em poucos minutos por segurança.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
  },
  topBarSpacer: {
    width: 40,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  stepPillText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textPrimary,
  },
  header: {
    alignItems: 'center',
    gap: 10,
    paddingBottom: 20,
  },
  title: {
    fontFamily: fonts.sans.bold,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 290,
    marginTop: -4,
  },
  stepper: {
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  stepTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light,
  },
  stepNodeActive: {
    backgroundColor: colors.primary,
  },
  stepNodeText: {
    fontFamily: fonts.mono.medium,
    fontSize: 12,
    color: colors.textOnPrimary,
  },
  stepNodeTextPending: {
    color: colors.textMuted,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    backgroundColor: colors.light,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  stepLabel: {
    fontFamily: fonts.sans.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  stepLabelActive: {
    fontFamily: fonts.sans.semiBold,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light,
    padding: 24,
    ...shadow.card,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDF3F2',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: fonts.sans.medium,
    fontSize: 13,
    color: colors.danger,
  },
  toggleButton: {
    padding: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  footerLink: {
    fontFamily: fonts.sans.bold,
    color: colors.primary,
  },
  helperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 24,
  },
  helperText: {
    fontFamily: fonts.mono.regular,
    fontSize: 10,
    color: colors.textMuted,
    flexShrink: 1,
  },
});
