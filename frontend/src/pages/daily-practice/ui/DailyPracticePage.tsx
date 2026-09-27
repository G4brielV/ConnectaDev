import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/entities/session';
import { useGamification } from '@/entities/gamification';
import {
  answerPracticeQuestion,
  completeDailyPractice,
  DailyPractice,
  DailyPracticeResult,
  PracticeAnswerResult,
  startDailyPractice,
} from '@/shared/api/practiceApi';
import { colors, fonts, radius, shadow, chunky } from '@/shared/config/theme';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';
import { optionLetter } from '@/pages/trail-phase/phaseExamState';
import {
  OptionTone,
  optionTone,
  practiceButtonLabel,
  practiceHeadline,
  practiceProgressPercentage,
  practiceRewardMessage,
  PracticeStage,
} from '../dailyPracticeState';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DailyPractice'>;

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// Prática do dia: 5 perguntas curtas, correção na hora, XP e ofensiva.
export function DailyPracticePage() {
  const navigation = useNavigation<NavigationProp>();
  const { token } = useAuth();
  const { applySummary } = useGamification();

  const [stage, setStage] = useState<PracticeStage>('loading');
  const [practice, setPractice] = useState<DailyPractice | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PracticeAnswerResult | null>(null);
  const [result, setResult] = useState<DailyPracticeResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setStage('loading');
    setPractice(null);
    setIndex(0);
    setSelected(null);
    setFeedback(null);
    setResult(null);
    setErrorMessage(null);

    try {
      setPractice(await startDailyPractice(token));
    } catch (error) {
      setErrorMessage(errorText(error, 'Não foi possível abrir a prática agora.'));
    } finally {
      setStage('question');
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [index]);

  const close = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home', { tab: 'trail' });
  };

  if (stage === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Separando suas perguntas…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!practice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Feather name="coffee" size={28} color={colors.textMuted} />
          <Text style={styles.blockedText}>
            {errorMessage ?? 'Não foi possível abrir a prática agora.'}
          </Text>
          <Pressable onPress={() => void load()} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Tentar de novo</Text>
          </Pressable>
          <Pressable onPress={close} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.linkText}>Voltar para a trilha</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (stage === 'summary' && result) {
    return <Summary result={result} onClose={close} onTrainMore={() => void load()} />;
  }

  const total = practice.questions.length;
  const question = practice.questions[index];
  const isLast = index === total - 1;

  const handlePrimary = async () => {
    if (!token || !question || isBusy) return;
    setErrorMessage(null);

    if (!feedback) {
      if (!selected) return;
      setIsBusy(true);
      try {
        setFeedback(
          await answerPracticeQuestion(token, practice.sessionId, question.id, selected),
        );
      } catch (error) {
        setErrorMessage(errorText(error, 'Não foi possível verificar sua resposta.'));
      } finally {
        setIsBusy(false);
      }
      return;
    }

    if (!isLast) {
      setIndex((current) => current + 1);
      setSelected(null);
      setFeedback(null);
      return;
    }

    setIsBusy(true);
    try {
      const completed = await completeDailyPractice(token, practice.sessionId);
      applySummary({ totalXp: completed.totalXp, currentLevel: completed.currentLevel });
      setResult(completed);
      setStage('summary');
    } catch (error) {
      setErrorMessage(errorText(error, 'Não foi possível finalizar a prática.'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          onPress={close}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Sair da prática"
          hitSlop={8}
        >
          <Feather name="x" size={20} color={colors.textPrimary} />
        </Pressable>
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityLabel={`Pergunta ${index + 1} de ${total}`}
        >
          <View
            style={[
              styles.progressFill,
              { width: `${practiceProgressPercentage(index, total, feedback !== null)}%` },
            ]}
          />
        </View>
        <View style={[styles.rewardChip, !practice.rewardAvailable && styles.rewardChipTraining]}>
          {practice.rewardAvailable ? (
            <>
              <MaterialCommunityIcons name="lightning-bolt" size={13} color={colors.accentInk} />
              <Text style={styles.rewardChipText}>+{practice.maxXp}</Text>
            </>
          ) : (
            <Text style={[styles.rewardChipText, styles.rewardChipTextTraining]}>TREINO</Text>
          )}
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>PRÁTICA DO DIA · {index + 1} DE {total}</Text>
        {question ? (
          <>
            <View style={[styles.sourceTag, question.isReview && styles.sourceTagReview]}>
              <Feather
                name={question.isReview ? 'rotate-ccw' : 'map-pin'}
                size={11}
                color={question.isReview ? colors.accentInk : colors.primary}
              />
              <Text
                style={[styles.sourceTagText, question.isReview && styles.sourceTagTextReview]}
                numberOfLines={1}
              >
                {question.isReview ? 'Revisão' : 'Fase atual'} · {question.phaseTitle}
              </Text>
            </View>

            <Text style={styles.statement}>{question.statement}</Text>

            {question.options.map((option, optionIndex) => (
              <OptionRow
                key={option.id}
                letter={optionLetter(optionIndex)}
                label={option.label}
                tone={optionTone(option.id, selected, feedback)}
                disabled={feedback !== null || isBusy}
                onPress={() => {
                  setSelected(option.id);
                  if (errorMessage) setErrorMessage(null);
                }}
              />
            ))}

            {feedback ? (
              <View style={[styles.feedback, feedback.isCorrect ? styles.feedbackRight : styles.feedbackWrong]}>
                <View style={styles.feedbackHeader}>
                  <Feather
                    name={feedback.isCorrect ? 'check-circle' : 'x-circle'}
                    size={18}
                    color={feedback.isCorrect ? colors.success : colors.danger}
                  />
                  <Text
                    style={[
                      styles.feedbackTitle,
                      { color: feedback.isCorrect ? colors.success : colors.danger },
                    ]}
                  >
                    {feedback.isCorrect ? 'Acertou!' : 'Não foi dessa vez'}
                  </Text>
                </View>
                {feedback.explanation ? (
                  <Text style={styles.feedbackText}>{feedback.explanation}</Text>
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}

        {errorMessage ? (
          <View style={styles.banner}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.bannerText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => void handlePrimary()}
          disabled={(!selected && !feedback) || isBusy}
          style={({ pressed }) => [
            styles.cta,
            feedback && !feedback.isCorrect && styles.ctaWrong,
            ((!selected && !feedback) || isBusy) && styles.ctaDisabled,
            pressed && styles.ctaPressed,
          ]}
          accessibilityRole="button"
        >
          {isBusy ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.ctaText}>
              {practiceButtonLabel({
                hasSelection: selected !== null,
                hasFeedback: feedback !== null,
                isLast,
              })}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

interface OptionRowProps {
  letter: string;
  label: string;
  tone: OptionTone;
  disabled: boolean;
  onPress: () => void;
}

function OptionRow({ letter, label, tone, disabled, onPress }: OptionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.option, OPTION_STYLE[tone]]}
      accessibilityRole="radio"
      accessibilityState={{ selected: tone === 'selected', disabled }}
    >
      <View style={[styles.optionBullet, BULLET_STYLE[tone]]}>
        {tone === 'correct' || tone === 'wrong' ? (
          <Feather name={tone === 'correct' ? 'check' : 'x'} size={14} color={colors.textOnPrimary} />
        ) : (
          <Text style={[styles.optionBulletText, tone === 'selected' && styles.optionBulletTextOn]}>
            {letter}
          </Text>
        )}
      </View>
      <Text style={[styles.optionLabel, tone === 'dimmed' && styles.optionLabelDimmed]}>{label}</Text>
    </Pressable>
  );
}

interface SummaryProps {
  result: DailyPracticeResult;
  onClose: () => void;
  onTrainMore: () => void;
}

function Summary({ result, onClose, onTrainMore }: SummaryProps) {
  const days = result.currentStreak === 1 ? 'dia' : 'dias';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.summary} showsVerticalScrollIndicator={false}>
        <View style={styles.flameCircle}>
          <MaterialCommunityIcons name="fire" size={48} color={colors.flame} />
        </View>
        <Text style={styles.streakCount}>
          {result.currentStreak} {days} de ofensiva
        </Text>
        <Text style={styles.summaryTitle}>
          {practiceHeadline(result.correctCount, result.totalQuestions)}
        </Text>
        <Text style={styles.summaryScore}>
          {result.correctCount} de {result.totalQuestions} acertos
        </Text>

        {result.xpEarned > 0 ? (
          <View style={styles.xpChip}>
            <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.accentInk} />
            <Text style={styles.xpChipText}>+{result.xpEarned} XP</Text>
          </View>
        ) : null}
        <Text style={styles.summaryMessage}>{practiceRewardMessage(result)}</Text>
        {result.leveledUp ? (
          <Text style={styles.levelUp}>Você subiu para o nível {result.currentLevel}!</Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Voltar para a trilha</Text>
        </Pressable>
        <Pressable onPress={onTrainMore} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.linkText}>Treinar mais</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontFamily: fonts.sans.regular, fontSize: 13, color: colors.textMuted },
  blockedText: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  linkText: { fontFamily: fonts.sans.semiBold, fontSize: 14, color: colors.primary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.light,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.accentFixed,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rewardChipTraining: { backgroundColor: colors.light },
  rewardChipText: { fontFamily: fonts.mono.medium, fontSize: 11, color: colors.accentInk },
  rewardChipTextTraining: { color: colors.textMuted },
  scroll: { paddingHorizontal: 20, paddingBottom: 120 },
  eyebrow: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMuted,
    marginTop: 12,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    maxWidth: '100%',
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  sourceTagReview: { backgroundColor: colors.accentSoft },
  sourceTagText: { fontFamily: fonts.sans.semiBold, fontSize: 11, color: colors.primary, flexShrink: 1 },
  sourceTagTextReview: { color: colors.accentInk },
  statement: {
    fontFamily: fonts.sans.bold,
    fontSize: 18,
    lineHeight: 25,
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.light,
    borderBottomWidth: 3,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.creamSoft },
  optionCorrect: { borderColor: colors.success, backgroundColor: '#EAF6EF' },
  optionWrong: { borderColor: colors.danger, backgroundColor: '#FDF3F2' },
  optionDimmed: { opacity: 0.55 },
  optionBullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBulletSelected: { backgroundColor: colors.primary },
  optionBulletCorrect: { backgroundColor: colors.success },
  optionBulletWrong: { backgroundColor: colors.danger },
  optionBulletText: { fontFamily: fonts.sans.bold, fontSize: 12, color: colors.textPrimary },
  optionBulletTextOn: { color: colors.textOnPrimary },
  optionLabel: {
    flex: 1,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textBody,
  },
  optionLabelDimmed: { color: colors.textMuted },
  feedback: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 14,
    marginTop: 6,
    gap: 6,
  },
  feedbackRight: { backgroundColor: '#EAF6EF', borderColor: colors.success },
  feedbackWrong: { backgroundColor: '#FDF3F2', borderColor: colors.danger },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackTitle: { fontFamily: fonts.sans.extraBold, fontSize: 15 },
  feedbackText: { fontFamily: fonts.sans.regular, fontSize: 13, lineHeight: 19, color: colors.textBody },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDF3F2',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 16,
  },
  bannerText: { flex: 1, fontFamily: fonts.sans.medium, fontSize: 13, color: colors.danger },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 4,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaWrong: { backgroundColor: colors.danger, borderBottomColor: '#8f2f2c' },
  ctaDisabled: { opacity: 0.5 },
  ctaPressed: { borderBottomWidth: chunky.pressedDepth, transform: [{ translateY: 2 }] },
  ctaText: { fontFamily: fonts.sans.extraBold, fontSize: 16, color: colors.textOnPrimary },
  secondary: { alignItems: 'center', paddingVertical: 12 },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: { fontFamily: fonts.sans.semiBold, fontSize: 14, color: colors.textOnPrimary },
  summary: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 160,
  },
  flameCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.flameSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  streakCount: { fontFamily: fonts.mono.medium, fontSize: 13, color: colors.flame, marginTop: 6 },
  summaryTitle: { fontFamily: fonts.sans.extraBold, fontSize: 26, color: colors.textPrimary },
  summaryScore: { fontFamily: fonts.sans.semiBold, fontSize: 15, color: colors.secondary },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentFixed,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 6,
  },
  xpChipText: { fontFamily: fonts.sans.extraBold, fontSize: 16, color: colors.accentInk },
  summaryMessage: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  levelUp: { fontFamily: fonts.sans.bold, fontSize: 14, color: colors.primary },
});

const OPTION_STYLE: Record<OptionTone, ViewStyle | null> = {
  idle: null,
  selected: styles.optionSelected,
  correct: styles.optionCorrect,
  wrong: styles.optionWrong,
  dimmed: styles.optionDimmed,
};

const BULLET_STYLE: Record<OptionTone, ViewStyle | null> = {
  idle: null,
  selected: styles.optionBulletSelected,
  correct: styles.optionBulletCorrect,
  wrong: styles.optionBulletWrong,
  dimmed: null,
};
