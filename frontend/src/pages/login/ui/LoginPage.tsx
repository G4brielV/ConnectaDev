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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LoginForm } from '@/features/auth';
import { Logo } from '@/shared/ui/Logo';
import { colors, fonts, radius, shadow } from '@/shared/config/theme';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type LoginRouteProp = RouteProp<RootStackParamList, 'Login'>;

// Layout da tela "Login - ConnectaDev" do Stitch
export function LoginPage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoginRouteProp>();
  const insets = useSafeAreaInsets();
  const initialEmail = route.params?.initialEmail;
  const successMessage = route.params?.successMessage;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) + 16 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.regionPill}>
            <View style={styles.regionDot} />
            <Text style={styles.regionText}>PORTO DIGITAL • CONECTA</Text>
          </View>
          <Logo size={48} showWordmark={false} />
          <Text style={styles.title}>Seu portal de entrada para o ecossistema tech</Text>
          <Text style={styles.subtitle}>
            Acelere sua trajetória profissional com oportunidades reais em Pernambuco.
          </Text>
        </View>

        <View style={styles.card}>
          {successMessage ? (
            <View style={styles.successBanner}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          ) : null}

          <LoginForm initialEmail={initialEmail} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ainda não faz parte?{' '}
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="link"
            >
              Cadastre-se gratuitamente
            </Text>
          </Text>
          <View style={styles.locationPill}>
            <Feather name="map-pin" size={14} color={colors.accent} />
            <Text style={styles.locationText} numberOfLines={1}>
              Feito para o Recife & RMR • Porto Digital Ready
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 24,
    gap: 12,
  },
  regionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  regionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  regionText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textPrimary,
  },
  title: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    maxWidth: 280,
  },
  subtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 270,
    marginTop: -8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light,
    padding: 24,
    ...shadow.card,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F3EE',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    flex: 1,
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: colors.success,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
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
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  locationText: {
    fontFamily: fonts.mono.regular,
    fontSize: 10,
    color: colors.textMuted,
    flexShrink: 1,
  },
});
