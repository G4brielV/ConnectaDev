import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../entities/session";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import {
  fetchReviewQuestions,
  ReviewAnswerInput,
  ReviewQuestion,
  submitReview,
} from "../shared/api/reviewApi";
import {
  getOptionStatus,
  getReviewButtonState,
  OptionStatus,
} from "./knowledgeReviewState";

type KnowledgeReviewRouteProp = RouteProp<RootStackParamList, "KnowledgeReview">;

export function KnowledgeReviewScreen() {
  const route = useRoute<KnowledgeReviewRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "KnowledgeReview">>();
  const { token, isAuthenticated } = useAuth();

  const topicId = route.params?.topicId || "topic-fundamentos-prog-01";
  const topicTitleParam = route.params?.topicTitle;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState<string>(topicTitleParam || "Revisão de Conhecimento");
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  // Topic already completed before: training mode, no XP awarded
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User selections per question: questionId -> selectedOptionId
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Confirmed questions: questionId -> true
  const [confirmedQuestions, setConfirmedQuestions] = useState<Record<string, boolean>>({});

  // Subtle warning when tapping disabled button
  const [showSelectionWarning, setShowSelectionWarning] = useState(false);
  const warningFadeAnim = useRef(new Animated.Value(0)).current;

  // Modals
  const [showExitModal, setShowExitModal] = useState(false);
  const [showNetworkErrorModal, setShowNetworkErrorModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transition animation between questions
  const questionFadeAnim = useRef(new Animated.Value(1)).current;

  const loadQuestions = useCallback(async (): Promise<void> => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetchReviewQuestions(token, topicId);
      setSessionId(response.sessionId);
      setTopicTitle(response.topicTitle || topicTitleParam || "Revisão de Conhecimento");
      setQuestions(response.questions);
      setIsTrainingMode(Boolean(response.alreadyCompleted));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível carregar as perguntas de revisão.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [token, topicId, topicTitleParam]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  // Intercept native back button on Android (Cenário 5)
  useEffect(() => {
    const onBackPress = () => {
      // If there are questions and review is still in progress, confirm exit
      if (questions.length > 0 && !isSubmitting) {
        setShowExitModal(true);
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [questions.length, isSubmitting]);

  function triggerSelectionWarning(): void {
    setShowSelectionWarning(true);
    warningFadeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(warningFadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(warningFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSelectionWarning(false);
    });
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentSelectedOptionId = currentQuestion ? answers[currentQuestion.id] ?? null : null;
  const isCurrentConfirmed = currentQuestion ? Boolean(confirmedQuestions[currentQuestion.id]) : false;

  const buttonState = getReviewButtonState(
    currentSelectedOptionId,
    isCurrentConfirmed,
    isLastQuestion,
  );

  function handleSelectOption(optionId: string): void {
    if (isCurrentConfirmed || !currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    setShowSelectionWarning(false);
  }

  function handleConfirmAnswer(): void {
    if (!currentQuestion || !currentSelectedOptionId) return;
    setConfirmedQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }));
  }

  function handleNextQuestion(): void {
    if (currentIndex < questions.length - 1) {
      Animated.sequence([
        Animated.timing(questionFadeAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(questionFadeAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentIndex((prev) => prev + 1);
    }
  }

  async function handleFinalizeReview(): Promise<void> {
    if (!token || !sessionId) return;

    setIsSubmitting(true);
    setShowNetworkErrorModal(false);

    // Build answer payload from local answers state (skip unanswered to satisfy API validation)
    const payload: ReviewAnswerInput[] = questions
      .filter((q) => Boolean(answers[q.id]))
      .map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id],
      }));

    try {
      const submitResult = await submitReview(token, sessionId, payload);
      setIsSubmitting(false);
      // Navigate to ReviewResultScreen on success (Cenário 4)
      navigation.navigate("ReviewResult", {
        result: submitResult,
        topicId,
      });
    } catch {
      // Cenário 7: Falha de conexão ao submeter os resultados finais
      // As respostas dadas pelo usuário permanecem salvas em cache local na sessão
      setIsSubmitting(false);
      setShowNetworkErrorModal(true);
    }
  }

  function handleMainButtonPress(): void {
    if (!isCurrentConfirmed) {
      if (!currentSelectedOptionId) {
        triggerSelectionWarning();
      } else {
        handleConfirmAnswer();
      }
    } else {
      if (isLastQuestion) {
        void handleFinalizeReview();
      } else {
        handleNextQuestion();
      }
    }
  }

  function handleConfirmExit(): void {
    setShowExitModal(false);
    navigation.goBack();
  }

  function handleCancelExit(): void {
    setShowExitModal(false);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#036564" />
          <Text style={styles.loadingText}>Carregando perguntas de revisão...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage || questions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Atenção</Text>
            <Text style={styles.errorMessage}>
              {errorMessage || "Nenhuma pergunta encontrada para este tópico no momento."}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.retryButton}
              onPress={() => void loadQuestions()}
            >
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={styles.backLink}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backLinkText}>Voltar</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Close (X) button & Progress info (Cenário 1 e 5) */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar revisão"
          onPress={() => setShowExitModal(true)}
          style={styles.closeButton}
          hitSlop={12}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.topicBadge} numberOfLines={1}>
            {topicTitle}
          </Text>
          <Text style={styles.progressCounter}>
            Pergunta {currentIndex + 1} de {questions.length}
          </Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
      </View>

      {isTrainingMode ? (
        <View style={styles.trainingBanner} accessibilityRole="text">
          <Text style={styles.trainingBannerText}>
            Modo treino: você já concluiu este tópico, então esta tentativa não gera XP.
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: questionFadeAnim }}>
          {/* Question Statement */}
          <View style={styles.questionCard}>
            <Text style={styles.questionStatement}>{currentQuestion.statement}</Text>
          </View>

          {/* Multiple Choice Options (Cenário 1, 2) */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const status: OptionStatus = getOptionStatus(
                option,
                currentSelectedOptionId,
                isCurrentConfirmed,
                currentQuestion.correctOptionId,
              );

              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{
                    selected: option.id === currentSelectedOptionId,
                    disabled: isCurrentConfirmed,
                  }}
                  onPress={() => handleSelectOption(option.id)}
                  disabled={isCurrentConfirmed}
                  style={[
                    styles.optionCard,
                    status === "selected" && styles.optionSelected,
                    status === "correct" && styles.optionCorrect,
                    status === "incorrect" && styles.optionIncorrect,
                    status === "dimmed" && styles.optionDimmed,
                  ]}
                >
                  <View
                    style={[
                      styles.optionBadge,
                      status === "selected" && styles.badgeSelected,
                      status === "correct" && styles.badgeCorrect,
                      status === "incorrect" && styles.badgeIncorrect,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionBadgeText,
                        status === "selected" && styles.badgeTextSelected,
                        status === "correct" && styles.badgeTextCorrect,
                        status === "incorrect" && styles.badgeTextIncorrect,
                      ]}
                    >
                      {option.id}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.optionLabel,
                      status === "selected" && styles.labelSelected,
                      status === "correct" && styles.labelCorrect,
                      status === "incorrect" && styles.labelIncorrect,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Didactic Explanation Card (Cenário 2) */}
          {isCurrentConfirmed && (
            <View style={styles.explanationCard}>
              <View style={styles.explanationHeader}>
                <Text style={styles.explanationIcon}>💡</Text>
                <Text style={styles.explanationTitle}>
                  {currentSelectedOptionId === currentQuestion.correctOptionId
                    ? "Parabéns, resposta correta!"
                    : "Explicação Didática:"}
                </Text>
              </View>
              <Text style={styles.explanationBody}>{currentQuestion.explanation}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Footer Area with Action Button and Subtle Prompt (Cenário 1, 2, 3, 4) */}
      <View style={styles.footer}>
        {/* Subtle warning message when trying to advance without selection (Cenário 3) */}
        {showSelectionWarning && (
          <Animated.View style={[styles.warningBanner, { opacity: warningFadeAnim }]}>
            <Text style={styles.warningText}>
              Selecione uma alternativa antes de continuar
            </Text>
          </Animated.View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={handleMainButtonPress}
          disabled={isSubmitting}
          style={[
            styles.mainButton,
            buttonState.disabled && styles.mainButtonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.mainButtonText,
                buttonState.disabled && styles.mainButtonTextDisabled,
              ]}
            >
              {buttonState.label}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Confirmation Exit Modal (Cenário 5) */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelExit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Deseja pausar a revisão?</Text>
            <Text style={styles.modalSubtitle}>
              Seu progresso nesta tentativa não será contabilizado.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                style={styles.modalContinueButton}
                onPress={handleCancelExit}
              >
                <Text style={styles.modalContinueText}>Continuar Respondendo</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={styles.modalExitButton}
                onPress={handleConfirmExit}
              >
                <Text style={styles.modalExitText}>Sair</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Connection Failure / HTTP 500 Modal (Cenário 7) */}
      <Modal
        visible={showNetworkErrorModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNetworkErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Erro de Conexão</Text>
            <Text style={styles.modalSubtitle}>
              Não foi possível salvar seu resultado. Verifique sua conexão.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                style={styles.modalRetryButton}
                onPress={() => void handleFinalizeReview()}
              >
                <Text style={styles.modalRetryText}>Tentar Enviar Novamente</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={styles.modalDismissButton}
                onPress={() => setShowNetworkErrorModal(false)}
              >
                <Text style={styles.modalDismissText}>Fechar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: "#036564",
    fontSize: 15,
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B91C1C",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#036564",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    color: "#64748B",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    fontSize: 18,
    color: "#334155",
    fontWeight: "700",
  },
  trainingBanner: {
    backgroundColor: "#FEF3C7",
    borderBottomColor: "#FDE68A",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  trainingBannerText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  topicBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#036564",
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  progressCounter: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  headerRightSpacer: {
    width: 40,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#E2E8F0",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#036564",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  questionStatement: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 25,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  optionSelected: {
    borderColor: "#036564",
    backgroundColor: "#F0FDFA",
  },
  optionCorrect: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  optionIncorrect: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  optionDimmed: {
    opacity: 0.55,
    borderColor: "#E2E8F0",
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  badgeSelected: {
    backgroundColor: "#036564",
  },
  badgeCorrect: {
    backgroundColor: "#16A34A",
  },
  badgeIncorrect: {
    backgroundColor: "#DC2626",
  },
  optionBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  badgeTextSelected: {
    color: "#FFFFFF",
  },
  badgeTextCorrect: {
    color: "#FFFFFF",
  },
  badgeTextIncorrect: {
    color: "#FFFFFF",
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    lineHeight: 21,
    fontWeight: "500",
  },
  labelSelected: {
    color: "#036564",
    fontWeight: "600",
  },
  labelCorrect: {
    color: "#15803D",
    fontWeight: "700",
  },
  labelIncorrect: {
    color: "#B91C1C",
    fontWeight: "600",
  },
  explanationCard: {
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  explanationIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  explanationBody: {
    fontSize: 14,
    color: "#1E3A8A",
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  warningBanner: {
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  warningText: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "600",
  },
  mainButton: {
    backgroundColor: "#036564",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mainButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  mainButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  mainButtonTextDisabled: {
    color: "#64748B",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    gap: 10,
  },
  modalContinueButton: {
    backgroundColor: "#036564",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalContinueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  modalExitButton: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalExitText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  modalRetryButton: {
    backgroundColor: "#036564",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalRetryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  modalDismissButton: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalDismissText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
});
