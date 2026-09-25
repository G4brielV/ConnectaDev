import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/entities/session';
import { useGamification } from '@/entities/gamification';
import { fetchTrailPhase, TrailPhase } from '@/shared/api/trailMapApi';
import { scoreLesson } from '@/shared/api/gamificationApi';
import { colors, fonts, radius, shadow, chunky } from '@/shared/config/theme';
import type { RootStackParamList } from '@/app/navigation/RootNavigator';
import {
  canSubmitExam,
  examProgressPercentage,
  firstUnansweredIndex,
  getExamButtonLabel,
  isLastQuestion,
  PhaseStage,
} from '../phaseExamState';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TrailPhase'>;
type PhaseRouteProp = RouteProp<RootStackParamList, 'TrailPhase'>;

const KIND_LABEL: Record<string, string> = {
  BONUS: 'BAÚ BÔNUS',
  BOSS: 'CHEFÃO',
  STANDARD: 'FASE',
};

export function TrailPhasePage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PhaseRouteProp>();
  const { token } = useAuth();
  const { applySummary } = useGamification();

  const [phase, setPhase] = useState<TrailPhase | null>(null);
  const [stage, setStage] = useState<PhaseStage>('study');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // A prova avança uma pergunta por vez; voltar preserva o que já foi marcado.
  const [questionIndex, setQuestionIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lessonId = route.params.lessonId;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [questionIndex]);

  useEffect(() => {
    if (!token) return;
    let active = true;

    setIsLoading(true);
    fetchTrailPhase(token, lessonId)
      .then((loaded) => {
        if (active) setPhase(loaded);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Não foi possível abrir esta fase.',
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lessonId, token]);

  const submit = useCallback(async () => {
    if (!token || !phase || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await scoreLesson(token, phase.id, answers);
      applySummary({ totalXp: result.totalXp, currentLevel: result.currentLevel });
      navigation.replace('TrailPhaseResult', { result, phaseTitle: phase.title });
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar suas respostas. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, applySummary, isSubmitting, navigation, phase, token]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Preparando a fase…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!phase) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Feather name="lock" size={28} color={colors.textMuted} />
          <Text style={styles.blockedText}>
            {errorMessage ?? 'Não foi possível abrir esta fase.'}
          </Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Voltar para a trilha</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = phase.questions[questionIndex];
  const hasAnswer = Boolean(currentQuestion && answers[currentQuestion.id]);

  const handleAdvance = () => {
    if (!hasAnswer) return;

    if (!isLastQuestion(questionIndex, phase.questions.length)) {
      setQuestionIndex((index) => index + 1);
      return;
    }

    // Na última: se o usuário voltou e deixou alguma em branco, leva até ela
    // em vez de enviar uma prova incompleta.
    if (!canSubmitExam(phase.questions, answers)) {
      const pending = firstUnansweredIndex(phase.questions, answers);
      setQuestionIndex(pending);
      setErrorMessage('Responda todas as perguntas antes de finalizar.');
      return;
    }

    void submit();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (stage !== 'exam') return navigation.goBack();
            if (questionIndex > 0) return setQuestionIndex((index) => index - 1);
            setStage('study');
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={stage === 'exam' ? 'Voltar para o conteúdo' : 'Voltar para a trilha'}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.kindPill}>
          <Text style={styles.kindPillText}>{KIND_LABEL[phase.kind] ?? 'FASE'}</Text>
        </View>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.unit}>{phase.unitTitle}</Text>
        <Text style={styles.title}>{phase.title}</Text>
        {phase.description ? <Text style={styles.description}>{phase.description}</Text> : null}

        {errorMessage ? (
          <View style={styles.banner}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.bannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {stage === 'study' ? (
          <>
            <Text style={styles.sectionTitle}>Conteúdo para estudar</Text>
            {phase.resources.map((resource) => (
              <Pressable
                key={resource.id}
                onPress={() => Linking.openURL(resource.url).catch(() => {
                  setErrorMessage('Não foi possível abrir este conteúdo.');
                })}
                style={styles.resourceCard}
                accessibilityRole="link"
                accessibilityLabel={`Abrir ${resource.title}`}
              >
                {resource.thumbnail ? (
                  <Image source={{ uri: resource.thumbnail }} style={styles.thumbnail} />
                ) : (
                  <View style={[styles.thumbnail, styles.thumbnailFallback]}>
                    <Feather name="play-circle" size={22} color={colors.primary} />
                  </View>
                )}
                <View style={styles.resourceTexts}>
                  <Text style={styles.resourceTitle} numberOfLines={2}>
                    {resource.title}
                  </Text>
                  <Text style={styles.resourceMeta}>{resource.provider ?? resource.kind}</Text>
                </View>
                <Feather name="external-link" size={18} color={colors.textMuted} />
              </Pressable>
            ))}

            <View style={styles.examIntro}>
              <Text style={styles.examIntroTitle}>Prova da fase</Text>
              <Text style={styles.examIntroText}>
                {phase.questions.length} perguntas. Acerte ao menos {phase.passingScore}% para
                liberar a próxima fase e ganhar até {phase.xpReward} XP.
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.examProgress}>
              <Text style={styles.examProgressText}>
                Pergunta {questionIndex + 1} de {phase.questions.length}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${examProgressPercentage(questionIndex, phase.questions.length)}%` },
                  ]}
                />
              </View>
            </View>

            {currentQuestion ? (
              <View style={styles.questionCard}>
                <Text style={styles.questionSequence}>PERGUNTA {currentQuestion.sequence}</Text>
                <Text style={styles.questionStatement}>{currentQuestion.statement}</Text>
                {currentQuestion.options.map((option) => {
                  const selected = answers[currentQuestion.id] === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => {
                        setAnswers((previous) => ({
                          ...previous,
                          [currentQuestion.id]: option.id,
                        }));
                        if (errorMessage) setErrorMessage(null);
                      }}
                      style={[styles.option, selected && styles.optionSelected]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <View style={[styles.optionBullet, selected && styles.optionBulletSelected]}>
                        <Text
                          style={[styles.optionBulletText, selected && styles.optionBulletTextSelected]}
                        >
                          {option.id}
                        </Text>
                      </View>
                      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {stage === 'study' ? (
          <Pressable onPress={() => setStage('exam')} style={styles.cta} accessibilityRole="button">
            <Text style={styles.ctaText}>Fazer a prova</Text>
            <Feather name="arrow-right" size={18} color={colors.textOnPrimary} />
          </Pressable>
        ) : (
          <View style={styles.examFooter}>
            {questionIndex > 0 ? (
              <Pressable
                onPress={() => setQuestionIndex((index) => index - 1)}
                style={styles.secondaryButton}
                accessibilityRole="button"
                accessibilityLabel="Voltar para a pergunta anterior"
              >
                <Feather name="arrow-left" size={18} color={colors.primary} />
              </Pressable>
            ) : null}

            <Pressable
              onPress={handleAdvance}
              disabled={!hasAnswer || isSubmitting}
              style={[styles.cta, styles.ctaFlex, (!hasAnswer || isSubmitting) && styles.ctaDisabled]}
              accessibilityRole="button"
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.ctaText}>
                  {getExamButtonLabel(questionIndex, phase.questions.length, hasAnswer)}
                </Text>
              )}
            </Pressable>
          </View>
        )}
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
    color: colors.textPrimary,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
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
  topBarSpacer: { width: 40 },
  kindPill: {
    backgroundColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  kindPillText: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textPrimary,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 110 },
  unit: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.primary,
    marginTop: 8,
  },
  title: { fontFamily: fonts.sans.bold, fontSize: 22, color: colors.textPrimary, marginTop: 4 },
  description: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    marginTop: 6,
  },
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
  sectionTitle: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 15,
    color: colors.secondary,
    marginTop: 24,
    marginBottom: 12,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.lg,
    padding: 10,
    marginBottom: 10,
    ...shadow.card,
  },
  thumbnail: { width: 72, height: 54, borderRadius: radius.md, backgroundColor: colors.light },
  thumbnailFallback: { alignItems: 'center', justifyContent: 'center' },
  resourceTexts: { flex: 1, gap: 2 },
  resourceTitle: { fontFamily: fonts.sans.semiBold, fontSize: 14, color: colors.textPrimary },
  resourceMeta: { fontFamily: fonts.sans.regular, fontSize: 11, color: colors.textMuted },
  examIntro: {
    backgroundColor: colors.creamSoft,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 20,
    gap: 4,
  },
  examIntroTitle: { fontFamily: fonts.sans.bold, fontSize: 15, color: colors.textPrimary },
  examIntroText: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  examProgress: { marginTop: 20, gap: 6 },
  examProgressText: { fontFamily: fonts.sans.medium, fontSize: 12, color: colors.textMuted },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.light,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.primary },
  questionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.lg,
    padding: 16,
    marginTop: 16,
    ...shadow.card,
  },
  questionSequence: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.primary,
  },
  questionStatement: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
    marginTop: 6,
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.light,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.creamSoft },
  optionBullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBulletSelected: { backgroundColor: colors.primary },
  optionBulletText: { fontFamily: fonts.sans.bold, fontSize: 12, color: colors.textPrimary },
  optionBulletTextSelected: { color: colors.textOnPrimary },
  optionLabel: {
    flex: 1,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textBody,
  },
  optionLabelSelected: { fontFamily: fonts.sans.medium, color: colors.textPrimary },
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
  ctaDisabled: { opacity: 0.5 },
  ctaFlex: { flex: 1 },
  examFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secondaryButton: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontFamily: fonts.sans.extraBold, fontSize: 16, color: colors.textOnPrimary },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontFamily: fonts.sans.semiBold,
    fontSize: 14,
    color: colors.textOnPrimary,
  },
});
