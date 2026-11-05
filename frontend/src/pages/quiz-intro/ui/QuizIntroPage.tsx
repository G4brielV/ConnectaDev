import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Logo } from '@/shared/ui/Logo';
import { Button } from '@/shared/ui/Button/Button';
import { colors, fonts, radius, shadow } from '@/shared/config/theme';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuizIntro'>;

interface IntroChip {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  accent?: boolean;
}

// Conteúdo das telas "Quiz Onboarding 1/2" do Stitch
const STEPS = [
  {
    image: require('../../../../assets/quiz/compass.jpg'),
    badge: 'Descubra seu caminho • 3 minutos',
    title: 'Qual área da tecnologia combina com você?',
    subtitle: 'Responda poucas perguntas interativas e descubra seus pontos fortes na prática.',
    chips: [
      { icon: 'zap', label: 'Rápido' },
      { icon: 'target', label: 'Personalizado' },
      { icon: 'cpu', label: 'Análise por IA', accent: true },
    ] as IntroChip[],
  },
  {
    image: require('../../../../assets/quiz/student.jpg'),
    badge: 'Recomendação inteligente',
    title: 'Cursos certos e vagas reais para seu perfil',
    subtitle: 'Nosso algoritmo seleciona os melhores cursos gratuitos e oportunidades no ecossistema de Recife.',
    chips: [
      { icon: 'book-open', label: 'Cursos Gratuitos' },
      { icon: 'briefcase', label: 'Vagas Locais' },
      { icon: 'award', label: 'Certificado' },
    ] as IntroChip[],
  },
];

export function QuizIntroPage() {
  const navigation = useNavigation<NavigationProp>();
  const [stepIndex, setStepIndex] = useState(0);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  // replace: ao terminar o quiz o usuário cai na Home (base da pilha), não na introdução
  const startQuiz = () => navigation.replace('Quiz');
  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={goBack}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </Pressable>
          <Logo size={28} showWordmark={false} />
          <Text style={styles.headerTitle}>Quiz Vocacional</Text>
        </View>
        <Pressable onPress={startQuiz} hitSlop={8} accessibilityRole="button" accessibilityLabel="Pular introdução">
          <Text style={styles.skip}>Pular</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {stepIndex === 0 && (
          <View style={styles.topBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.topBadgeText}>{step.badge.toUpperCase()}</Text>
          </View>
        )}

        <View style={styles.imageCard}>
          <Image source={step.image} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
          {isLastStep && (
            <View style={styles.matchChip}>
              <View style={styles.matchDot} />
              <Text style={styles.matchText}>MATCH::PORTO_DIGITAL</Text>
            </View>
          )}
        </View>

        <View style={styles.textBlock}>
          {isLastStep && (
            <View style={styles.inlineBadge}>
              <Feather name="star" size={14} color={colors.primary} />
              <Text style={styles.inlineBadgeText}>{step.badge.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
        </View>

        <View style={styles.chips}>
          {step.chips.map((chip) => (
            <View key={chip.label} style={[styles.chip, chip.accent && styles.chipAccent]}>
              <Feather name={chip.icon} size={14} color={chip.accent ? colors.dark : colors.secondary} />
              <Text style={[styles.chipText, chip.accent && styles.chipTextAccent]}>{chip.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.dots} accessibilityRole="progressbar">
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === stepIndex && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.actions}>
          {isLastStep ? (
            <>
              <Button title="Começar o Quiz Agora" rightIcon="arrow-right" onPress={startQuiz} />
              <Pressable onPress={() => setStepIndex(0)} style={styles.link} hitSlop={8}>
                <Text style={styles.linkText}>Voltar à etapa anterior</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Button title="Continuar" rightIcon="arrow-right" onPress={() => setStepIndex(1)} />
              <Pressable onPress={startQuiz} style={styles.link} hitSlop={8}>
                <Text style={styles.linkTextMono}>Pular introdução</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  skip: {
    fontFamily: fonts.mono.medium,
    fontSize: 13,
    color: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  topBadgeText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.secondary,
  },
  imageCard: {
    width: '100%',
    maxWidth: 340,
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.creamSoft,
    ...shadow.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  matchChip: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(3, 22, 52, 0.9)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#87d4d2',
  },
  matchText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.surface,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  inlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inlineBadgeText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  subtitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 340,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipAccent: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoft,
  },
  chipText: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 12,
    color: colors.secondary,
  },
  chipTextAccent: {
    color: colors.dark,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 24,
    marginBottom: 20,
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
    width: '100%',
    gap: 4,
  },
  link: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  linkTextMono: {
    fontFamily: fonts.mono.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
});
