import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RegisterForm } from '@/features/auth';
import { colors, fonts, radius, shadow } from '@/shared/config/theme';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

// Layout da tela "Cadastro Onboarding - ConnectaDev" do Stitch
export function RegisterPage() {
  const navigation = useNavigation<NavigationProp>();

  const handleNavigateToLogin = (initialEmail?: string, successMessage?: string) => {
    navigation.navigate('Login', initialEmail ? { initialEmail, successMessage } : undefined);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Login');
    }
  };

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
              accessibilityLabel="Voltar para a tela anterior"
            >
              <Feather name="arrow-left" size={20} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.stepPill}>
              <View style={styles.stepDot} />
              <Text style={styles.stepText}>PERFIL INICIAL</Text>
            </View>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.title}>Criar Perfil Dev</Text>
            <View style={styles.peTag}>
              <Text style={styles.peTagText}>PE</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Personalize sua jornada para vestibulares e vagas tech na RMR.
          </Text>

          <View style={styles.hubCard}>
            <View style={styles.hubIcon}>
              <Feather name="share-2" size={20} color={colors.secondary} />
            </View>
            <View style={styles.hubTexts}>
              <Text style={styles.hubTitle} numberOfLines={1}>Hub Porto Digital & Polo TI</Text>
              <Text style={styles.hubSubtitle} numberOfLines={1}>
                Conectando você a mais de 350 tech empresas locais
              </Text>
            </View>
          </View>

          <RegisterForm onNavigateToLogin={handleNavigateToLogin} />

          <Text style={styles.legal}>
            Ao continuar, você concorda com as diretrizes e termos colaborativos do ecossistema{' '}
            <Text style={styles.legalStrong}>ConnectaDev PE</Text>.
          </Text>

          <Pressable onPress={() => handleNavigateToLogin()} style={styles.loginLink} hitSlop={8}>
            <Text style={styles.loginLinkText}>
              Já tem uma conta? <Text style={styles.loginLinkStrong}>Entrar</Text>
            </Text>
          </Pressable>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
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
    backgroundColor: colors.primary,
  },
  stepText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.secondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  title: {
    fontFamily: fonts.sans.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  peTag: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  peTagText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: '#6c582d',
  },
  subtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 4,
  },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.lg,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  hubIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubTexts: {
    flex: 1,
  },
  hubTitle: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  hubSubtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  legal: {
    fontFamily: fonts.sans.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginTop: 12,
  },
  legalStrong: {
    fontFamily: fonts.sans.semiBold,
    color: colors.textPrimary,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  loginLinkText: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  loginLinkStrong: {
    fontFamily: fonts.sans.semiBold,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
