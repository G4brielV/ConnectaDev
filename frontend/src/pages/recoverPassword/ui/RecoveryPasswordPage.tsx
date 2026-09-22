import { RootStackParamList } from "@/app/navigation/RootNavigator";
import { useAuth } from "@/entities/session";
import { checkPasswordComplexity, PasswordRequirements, resetPasswordRequest } from "@/features/auth";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RecoveryPassword'>;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LENGTH = 6;

type FieldErrors = {
  email?: string;
  token?: string;
  password?: string;
  secondPassword?: string;
};

export default function RecoveryPasswordPage() {
  const navigation = useNavigation<NavigationProp>();
  const { recoveryPassword,resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [secondPassword, setSecondPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  // false = etapa e-mail | true = etapa token + nova senha
  const [isTokenStep, setIsTokenStep] = useState(false);

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

  // ---------- Handlers ----------
const handleSendInstructions = async () => {
  console.log('[1] antes de chamar recoveryPassword');
  setIsLoading(true);
  try {
    const message = await recoveryPassword(email.trim());
    console.log('[2] retornou:', message);
    Alert.alert('Sucesso', message);
    setErrors({});
    setIsTokenStep(true);
    console.log('[3] setIsTokenStep(true) executado');
  } catch (e) {
    console.log('[4] caiu no catch:', e);
  } finally {
    setIsLoading(false);
  }
};

  const handleResetPassword = async () => {
    setErrorMessage('');
    if (!validateTokenStep()) return;
    if (!passwordValidation.isValid) return

    setIsLoading(true);
    try {
      const message = await resetPassword(token.trim(), password);

      Alert.alert('Sucesso', message || 'Senha alterada com sucesso.');
      navigation.navigate('Login', {
        successMessage: message || 'Senha alterada com sucesso.',
      });
    } catch (error: any) {
      setErrorMessage(
        error?.message || 'Token inválido ou expirado. Tente novamente.'
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
  const passwordValidation = useMemo(
      () => checkPasswordComplexity(password),
      [password]
  );

  // ---------- UI ----------
  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logoTitle}>ConnectaDev</Text>
          <Text style={styles.subtitle}>
            {isTokenStep
              ? 'Insira o token e a nova senha'
              : 'Insira o e-mail cadastrado para receber as instruções de redefinição de senha'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recuperar Senha</Text>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {isTokenStep ? (
            <>
              {/* -------- Etapa: Token + Nova senha -------- */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Token</Text>
                <TextInput
                  style={[styles.input, errors.token && styles.inputError]}
                  placeholder="Digite o token"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={token}
                  onChangeText={(text) => {
                    setToken(text);
                    if (errors.token) setErrors((prev) => ({ ...prev, token: undefined }));
                    if (errorMessage) setErrorMessage('');
                  }}
                  editable={!isLoading}
                />
                {errors.token ? <Text style={styles.errorText}>{errors.token}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nova senha</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Digite a nova senha"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
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
                />
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
              </View>
              <PasswordRequirements
                validation={passwordValidation}
                passwordLength={password.length}
                showWhenEmpty={false}
              />

              <View style={styles.formGroup}>
                <Text style={styles.label}>Confirmar nova senha</Text>
                <TextInput
                  style={[styles.input, errors.secondPassword && styles.inputError]}
                  placeholder="Repita a nova senha"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
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
                />
                {errors.secondPassword ? (
                  <Text style={styles.errorText}>{errors.secondPassword}</Text>
                ) : null}
              </View>

              {isLoading ? (
                // 1º Estado: Botão de Carregamento (Desabilitado)
                <TouchableOpacity
                  style={[styles.button, styles.buttonDisabled]}
                  disabled={true}
                  activeOpacity={1}
                >
                  <ActivityIndicator color="#FFFFFF" />
                </TouchableOpacity>
              ) : !passwordValidation.isValid ? (
                // 2º Estado: Botão de Erro (Fica vermelho e pode ter clique desabilitado se quiser)
                <TouchableOpacity
                  style={[styles.button, styles.buttonDisabled]}
                  disabled={true} // Mantém desabilitado até a senha ser válida
                  activeOpacity={1}
                >
                  <Text style={styles.buttonTextError}>Digite uma senha válida</Text>
                </TouchableOpacity>
              ) : (
                // 3º Estado: Botão Padrão/Ativo
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleResetPassword}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Alterar senha</Text>
                </TouchableOpacity>
              )}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Não recebeu o token? </Text>
                <TouchableOpacity onPress={handleResendToken} disabled={isLoading}>
                  <Text style={styles.footerLink}>Envie novamente</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* -------- Etapa: E-mail -------- */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="seuemail@dominio.com"
                  placeholderTextColor="#9CA3AF"
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
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendInstructions}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Enviar Instruções</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Lembrou da senha? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Voltar para o Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#9B1C1C',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor:'#f22b2b',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextError: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284C7',
  },
});