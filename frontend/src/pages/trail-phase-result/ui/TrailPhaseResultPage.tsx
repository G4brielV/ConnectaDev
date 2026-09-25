import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, chunky } from '@/shared/config/theme';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';
import { buildResultHeadline } from '@/pages/trail-phase/phaseExamState';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TrailPhaseResult'>;
type ResultRouteProp = RouteProp<RootStackParamList, 'TrailPhaseResult'>;

export function TrailPhaseResultPage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResultRouteProp>();
  const { result, phaseTitle } = route.params;

  const headline = buildResultHeadline(result.passed, result.stars);

  const backToTrail = () => navigation.navigate('Home', { tab: 'trail' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.badge, !result.passed && styles.badgeFailed]}>
          <Feather
            name={result.passed ? 'award' : 'refresh-cw'}
            size={34}
            color={result.passed ? colors.textOnPrimary : colors.textMuted}
          />
        </View>

        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.phaseTitle}>{phaseTitle}</Text>

        <View style={styles.stars}>
          {[1, 2, 3].map((position) => (
            <Feather
              key={position}
              name="star"
              size={30}
              color={position <= result.stars ? colors.accent : colors.light}
            />
          ))}
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Acertos</Text>
            <Text style={styles.scoreValue}>
              {result.correctCount} de {result.totalQuestions}
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Aproveitamento</Text>
            <Text style={styles.scoreValue}>
              {result.percentage}%{' '}
              <Text style={styles.scoreHint}>(corte {result.passingScore}%)</Text>
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>XP</Text>
            <Text style={styles.scoreValue}>
              {result.xpEarned > 0
                ? `+${result.xpEarned}`
                : result.alreadyRewarded
                  ? 'já resgatado'
                  : '0'}
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Ofensiva</Text>
            <Text style={styles.scoreValue}>🔥 {result.currentStreak} dias</Text>
          </View>
        </View>

        {result.leveledUp ? (
          <View style={styles.levelUp}>
            <Feather name="trending-up" size={16} color={colors.primary} />
            <Text style={styles.levelUpText}>
              Você chegou ao nível {result.currentLevel}!
            </Text>
          </View>
        ) : null}

        <Text style={styles.message}>
          {result.passed
            ? 'A próxima fase está liberada. Bora continuar?'
            : `Você precisa de ${result.passingScore}% para avançar. Revise o conteúdo e tente de novo — sem penalidade.`}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={backToTrail} style={styles.cta} accessibilityRole="button">
          <Text style={styles.ctaText}>
            {result.passed ? 'Ir para a próxima fase' : 'Voltar e revisar'}
          </Text>
          <Feather name="arrow-right" size={18} color={colors.textOnPrimary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 110, alignItems: 'center' },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeFailed: { backgroundColor: colors.light },
  headline: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 24,
    color: colors.textPrimary,
    marginTop: 16,
  },
  phaseTitle: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  stars: { flexDirection: 'row', gap: 8, marginTop: 16 },
  scoreCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 24,
    gap: 12,
    ...shadow.card,
  },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontFamily: fonts.sans.regular, fontSize: 13, color: colors.textMuted },
  scoreValue: { fontFamily: fonts.sans.bold, fontSize: 14, color: colors.textPrimary },
  scoreHint: { fontFamily: fonts.sans.regular, fontSize: 12, color: colors.textMuted },
  levelUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 16,
  },
  levelUpText: { fontFamily: fonts.sans.semiBold, fontSize: 13, color: colors.primary },
  message: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    maxWidth: 300,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.light,
  },
  cta: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    borderBottomWidth: chunky.ctaDepth,
    borderBottomColor: colors.primaryDeepest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { fontFamily: fonts.sans.extraBold, fontSize: 16, color: colors.textOnPrimary },
});
