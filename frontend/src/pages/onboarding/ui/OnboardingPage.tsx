import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Logo } from '@/shared/ui/Logo';
import { Button } from '@/shared/ui/Button/Button';
import { onboardingStorage } from '@/shared/lib/storage/onboardingStorage';
import { colors, fonts, radius } from '@/shared/config/theme';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';
import { EcosystemHero } from './heroes/EcosystemHero';
import { PracticeHero } from './heroes/PracticeHero';
import { JobsHero } from './heroes/JobsHero';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

interface OnboardingStep {
  badge: string;
  badgeIcon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  align: 'center' | 'left';
  Hero: React.ComponentType;
}

// Conteúdo das telas "Boas-Vindas 1/2/3" do Stitch
const STEPS: OnboardingStep[] = [
  {
    badge: 'Boas-vindas ao ConnectaDev',
    title: 'O ecossistema tech de Pernambuco na palma da sua mão.',
    subtitle: 'Descubra vagas, desafios e mentorias conectadas diretamente ao Porto Digital.',
    align: 'center',
    Hero: EcosystemHero,
  },
  {
    badge: 'Aprenda na Prática',
    badgeIcon: 'zap',
    title: 'Do vestibular ao código do seu primeiro emprego.',
    subtitle: 'Exercícios rápidos, simulados para UFPE/UPE e trilhas alinhadas ao que as empresas exigem.',
    align: 'center',
    Hero: PracticeHero,
  },
  {
    badge: 'Vagas & Oportunidades',
    badgeIcon: 'briefcase',
    title: 'Vagas exclusivas e conexões com o mercado.',
    subtitle: 'Acesse processos seletivos em primeira mão para estágio e júnior nas empresas do ecossistema pernambucano.',
    align: 'left',
    Hero: JobsHero,
  },
];

export function OnboardingPage() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const isCentered = step.align === 'center';

  const finish = async (target: 'Login' | 'Register') => {
    await onboardingStorage.markSeen();
    navigation.replace(target);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Logo size={32} />
        <Pressable
          onPress={() => finish('Login')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Pular apresentação"
        >
          <Text style={styles.skip}>Pular</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrapper}>
          <step.Hero />
        </View>

        <View style={[styles.textBlock, isCentered && styles.textBlockCentered]}>
          <View style={styles.badge}>
            {step.badgeIcon && <Feather name={step.badgeIcon} size={14} color={colors.secondary} />}
            <Text style={styles.badgeText}>{step.badge.toUpperCase()}</Text>
          </View>
          <Text style={[styles.title, isCentered && styles.textCentered]}>{step.title}</Text>
          <Text style={[styles.subtitle, isCentered && styles.textCentered]}>{step.subtitle}</Text>
        </View>

        {stepIndex === 1 && (
          <View style={styles.trustRow}>
            <View style={styles.trustLeft}>
              <Feather name="share-2" size={18} color={colors.secondary} />
              <Text style={styles.trustText}>Metodologia Porto Digital</Text>
            </View>
            <Text style={styles.trustFree}>100% Grátis</Text>
          </View>
        )}

        <View style={[styles.dots, !isCentered && styles.dotsLeft]} accessibilityRole="progressbar">
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.actions}>
          {isLastStep ? (
            <>
              <Button
                title="Criar Conta Gratuita"
                rightIcon="arrow-right"
                onPress={() => finish('Register')}
              />
              <Button
                title="Já tenho uma conta • Entrar"
                variant="soft"
                onPress={() => finish('Login')}
              />
              <Text style={styles.disclaimer}>
                Ao ingressar você conecta seu perfil aos tech leads do Porto Digital.
              </Text>
            </>
          ) : (
            <>
              <Button
                title="Próximo"
                rightIcon="arrow-right"
                onPress={() => setStepIndex((i) => i + 1)}
              />
              <Pressable onPress={() => finish('Login')} style={styles.loginLink} hitSlop={8}>
                <Text style={styles.loginLinkText}>
                  Já tem uma conta? <Text style={styles.loginLinkStrong}>Entrar</Text>
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 16,
    color: colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroWrapper: {
    alignItems: 'center',
  },
  textBlock: {
    marginTop: 24,
    paddingHorizontal: 4,
    gap: 8,
  },
  textBlockCentered: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.secondary,
  },
  title: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.textPrimary,
    maxWidth: 340,
  },
  subtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    maxWidth: 320,
  },
  textCentered: {
    textAlign: 'center',
  },
  trustRow: {
    marginTop: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.light,
    borderRadius: radius.lg,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trustLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  trustFree: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.primary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 24,
    marginBottom: 24,
  },
  dotsLeft: {
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.light,
  },
  dotActive: {
    width: 32,
    backgroundColor: colors.primary,
  },
  actions: {
    gap: 8,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 12,
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
  disclaimer: {
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
