import { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  fetchQuizQuestions,
  QuizAnalysisResult,
  QuizQuestion,
  submitQuiz,
} from "../shared/api/quizApi";
import { useAuth } from "../entities/session";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { getQuizCatalogState } from "./quizState";

export function QuizScreen() {
  const quizLoadErrorMessage =
    "Não foi possível carregar as perguntas no momento. Verifique sua conexão.";
  const { isAuthenticated, isLoading: isAuthLoading, token } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Quiz">>();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<QuizAnalysisResult | null>(null);
  const [isResultSaved, setIsResultSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answerValidationMessage, setAnswerValidationMessage] = useState<string | null>(null);
  const textInputRef = useRef<TextInput | null>(null);
  const questionTransition = useRef(new Animated.Value(1)).current;
  const previousQuestionIndex = useRef(currentIndex);

  useEffect(() => {
    let isMounted = true;

    async function loadQuiz(): Promise<void> {
      if (isAuthLoading) {
        return;
      }

      if (!isAuthenticated || !token) {
        if (isMounted) {
          setQuestions([]);
          setErrorMessage(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const loadedQuestions = await fetchQuizQuestions(token);
        if (isMounted) {
          setQuestions(loadedQuestions);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setErrorMessage(quizLoadErrorMessage);
          setIsLoading(false);
        }
      }
    }

    setIsLoading(isAuthLoading || isAuthenticated);
    setErrorMessage(null);
    if (isAuthenticated && token) {
      void loadQuiz();
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isAuthLoading, quizLoadErrorMessage, retryAttempt, token]);

  useEffect(() => {
    if (previousQuestionIndex.current === currentIndex) {
      return undefined;
    }

    previousQuestionIndex.current = currentIndex;
    questionTransition.setValue(0);
    const animation = Animated.timing(questionTransition, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();
    return () => animation.stop();
  }, [currentIndex, questionTransition]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return undefined;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isLoading || isSubmitting) {
          return true;
        }

        if (isComplete) {
          setIsComplete(false);
          setCurrentIndex(Math.max(0, questions.length - 1));
          return true;
        }

        if (currentIndex > 0) {
          setCurrentIndex((index) => index - 1);
          return true;
        }

        return false;
      },
    );

    return () => subscription.remove();
  }, [currentIndex, isComplete, isLoading, isSubmitting, questions.length]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#036564" accessibilityLabel="Carregando quiz" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setErrorMessage(null);
              setRetryAttempt((attempt) => attempt + 1);
            }}
            style={styles.retryButton}
          >
            <Text style={styles.nextText}>Tentar Novamente</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (getQuizCatalogState(questions) === "empty") {
    return (
      <View style={styles.centered}>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>
            O quiz vocacional está passando por atualizações. Volte em breve!
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela inicial"
            onPress={() => navigation.navigate("Home")}
            style={styles.retryButton}
          >
            <Text style={styles.nextText}>Voltar para a Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const question = questions[currentIndex];
  if (!question) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Nenhuma pergunta disponível.</Text>
      </View>
    );
  }

  if (isSubmitting) {
    return (
      <View style={styles.processingScreen}>
        <View style={styles.processingCard}>
          <ActivityIndicator
            color="#036564"
            size="large"
            accessibilityLabel="Processando perfil"
          />
          <Text style={styles.processingTitle}>Processando perfil</Text>
          <Text style={styles.processingText}>Analisando sua vocação...</Text>
        </View>
      </View>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answer = answers[question.id] ?? "";
  const isMultipleChoice = question.type === "MULTIPLE_CHOICE";
  const isOpenText = question.type === "OPEN_TEXT";
  const hasOptions = isMultipleChoice && (question.options?.length ?? 0) > 0;
  const minLength = question.validation?.minLength ?? (isOpenText ? 20 : 0);
  const maxLength = question.validation?.maxLength ?? (isOpenText ? 500 : 0);
  const canAdvance =
    isOpenText
      ? answer.trim().length >= minLength && answer.trim().length <= maxLength
      : hasOptions && answer.length > 0;

  function selectAnswer(value: string): void {
    setAnswerValidationMessage(null);
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [question.id]: value,
    }));
  }

  async function goToNextQuestion(): Promise<void> {
    if (isLoading || isSubmitting) {
      return;
    }

    Keyboard.dismiss();
    let submissionAnswers = answers;

    if (isOpenText) {
      const sanitizedAnswer = answer.trim();
      if (sanitizedAnswer.length < minLength || sanitizedAnswer.length > maxLength) {
        setAnswerValidationMessage(
          sanitizedAnswer.length < minLength
            ? `Escreva pelo menos ${minLength} caracteres para detalhar sua resposta`
            : `A resposta não pode ultrapassar ${maxLength} caracteres.`,
        );
        textInputRef.current?.focus();
        return;
      }

      submissionAnswers = {
        ...answers,
        [question.id]: sanitizedAnswer,
      };
      setAnswers((currentAnswers) => ({
        ...currentAnswers,
        [question.id]: sanitizedAnswer,
      }));
    }

    if (!canAdvance) {
      if (isMultipleChoice) {
        setAnswerValidationMessage("Selecione uma opção para continuar");
      }
      return;
    }

    if (currentIndex === questions.length - 1) {
      if (isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      if (!token) {
        setErrorMessage("Sua sessão não é válida. Faça login para continuar.");
        setIsSubmitting(false);
        return;
      }

      try {
        const result = await submitQuiz(token, { answers: submissionAnswers });
        setAnalysisResult(result);
        setIsComplete(true);
      } catch (error) {
        setAnswerValidationMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível enviar suas respostas.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  if (isComplete) {
    const skills = [
      { label: "Criatividade Visual & UX", value: 92, icon: "✦" },
      { label: "Lógica de Programação", value: 96, icon: "⌘" },
      { label: "Foco em Soluções Reais", value: 95, icon: "✓" },
    ];

    return (
      <View style={styles.resultScreen}>
        <View style={styles.resultHeader}>
          <Pressable
            accessibilityLabel="Fechar resultado"
            accessibilityRole="button"
            onPress={() => navigation.navigate("Home")}
            style={styles.resultClose}
          >
            <Text style={styles.resultCloseText}>×</Text>
          </Pressable>
          <View style={styles.resultBrand}>
            <Text style={styles.resultLogo}>CONNECTADEV</Text>
            <Text style={styles.resultHeaderTitle}>Quiz Result{"\n"}Summary</Text>
          </View>
          <View style={styles.resultAvatar}>
            <Text style={styles.resultAvatarText}>◯</Text>
          </View>
        </View>
        <View style={styles.resultJourneyTrack}>
          <View style={styles.resultJourneyValue} />
        </View>
        <ScrollView
          contentContainerStyle={styles.resultScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {analysisResult ? (
            <>
              <View style={styles.resultHero}>
                <Text style={styles.resultBadge}>🏆 QUIZ CONCLUÍDO • +200 XP</Text>
                <Text style={styles.resultTitle}>{analysisResult.areaPrincipal}!</Text>
                <Text style={styles.resultSubtitle}>
                  Seu perfil foi analisado e já temos próximos passos para você.
                </Text>
              </View>
              <View style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <View style={styles.matchTitleBlock}>
                    <Text style={styles.resultLabel}>TRILHA RECOMENDADA</Text>
                    <Text style={styles.matchTitle}>Trilha {analysisResult.areaPrincipal}</Text>
                    <Text style={styles.matchSubtitle}>Porto Digital Ready • 12 Semanas</Text>
                  </View>
                  <View style={styles.matchCircle}>
                    <Text style={styles.matchPercent}>94%</Text>
                    <Text style={styles.matchText}>MATCH</Text>
                  </View>
                </View>
                {skills.map((skill) => (
                  <View key={skill.label} style={styles.skillRow}>
                    <View style={styles.skillTopline}>
                      <Text style={styles.skillName}>{skill.icon} {skill.label}</Text>
                      <Text style={styles.skillPercent}>{skill.value}%</Text>
                    </View>
                    <View style={styles.skillTrack}>
                      <View style={[styles.skillValue, { width: `${skill.value}%` }]} />
                    </View>
                  </View>
                ))}
                <View style={styles.demandFooter}>
                  <Text style={styles.demandIcon}>▣</Text>
                  <Text style={styles.demandText}>Alinhada à demanda do Porto Digital & Região.</Text>
                </View>
              </View>
              <View style={styles.strengthCard}>
                <Text style={styles.strengthTitle}>✓ Pontos fortes identificados</Text>
                <Text style={styles.resultText}>{analysisResult.justificativa}</Text>
                <View style={styles.tagGroup}>
                  {analysisResult.tecnologiasSugeridas.map((technology) => (
                    <Text key={technology} style={styles.resultTag}>✦ {technology}</Text>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.errorText}>
              Não foi possível carregar a análise do seu perfil.
            </Text>
          )}
          <View style={styles.resultActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("Courses")}
              style={styles.resultPrimaryButton}
            >
              <Text style={styles.resultPrimaryButtonText}>Ver Trilha & Oportunidades  →</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsResultSaved(true)}
              style={styles.resultSecondaryButton}
            >
              <Text style={styles.resultSecondaryButtonText}>
                {isResultSaved
                  ? "✓  Resultado salvo nesta sessão"
                  : "🔖  Salvar Resultado no Meu Perfil"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setAnswers({});
                setCurrentIndex(0);
                setAnalysisResult(null);
                setIsResultSaved(false);
                setIsComplete(false);
              }}
            >
              <Text style={styles.resultGhostButton}>Refazer Quiz Vocacional</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
      style={styles.container}
    >
      <View style={styles.header}>
        {currentIndex > 0 ? (
          <Pressable
            accessibilityLabel="Voltar para a pergunta anterior"
            accessibilityRole="button"
            onPress={() => setCurrentIndex((index) => index - 1)}
            style={styles.headerBackButton}
          >
            <Text style={styles.headerBackText}>‹ Voltar</Text>
          </Pressable>
        ) : (
          <View style={styles.headerBackPlaceholder} />
        )}
        <Text style={styles.eyebrow}>QUIZ VOCACIONAL</Text>
        <View style={styles.headerBackPlaceholder} />
      </View>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>
          Pergunta {currentIndex + 1} de {questions.length}
        </Text>
        <Text style={styles.progressLabel}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressValue, { width: `${progress}%` }]} />
      </View>
      <Animated.View
        style={[
          styles.card,
          {
            opacity: questionTransition,
            transform: [
              {
                translateX: questionTransition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.questionContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.questionScroll}
        >
          <Text style={styles.question}>{question.prompt}</Text>
          {hasOptions && question.options?.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: answer === option.id }}
              onPress={() => selectAnswer(option.id)}
              style={[styles.option, answer === option.id && styles.selectedOption]}
            >
              <View style={[styles.optionIndicator, answer === option.id && styles.selectedIndicator]} />
              <Text style={styles.optionText}>{option.label}</Text>
            </Pressable>
          ))}
          {isOpenText && (
            <TextInput
              accessibilityLabel="Resposta aberta"
              multiline
              maxLength={maxLength}
              onChangeText={selectAnswer}
              placeholder="Escreva sua resposta..."
              placeholderTextColor="#60717A"
              ref={textInputRef}
              style={[
                styles.textInput,
                answerValidationMessage && styles.warningInput,
                answer.length >= maxLength && styles.maxLengthInput,
              ]}
              value={answer}
            />
          )}
          {isOpenText && answerValidationMessage && (
            <Text accessibilityRole="alert" style={styles.openValidationText}>
              {answerValidationMessage}
            </Text>
          )}
          {isOpenText && (
            <Text
              accessibilityLabel={`${answer.length} de ${maxLength} caracteres`}
              style={[styles.characterCount, answer.length >= maxLength && styles.maxLengthText]}
            >
              {answer.length}/{maxLength}
            </Text>
          )}
        </ScrollView>
      </Animated.View>
      <View style={styles.actions}>
        {answerValidationMessage && !isOpenText && (
          <Text accessibilityRole="alert" style={styles.validationText}>
            {answerValidationMessage}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdvance || isSubmitting }}
          disabled={isSubmitting}
          style={[
            styles.nextButton,
            isMultipleChoice && styles.multipleChoiceNextButton,
            !canAdvance && styles.disabledButton,
          ]}
          onPress={goToNextQuestion}
        >
          <Text style={styles.nextText}>
            {currentIndex === questions.length - 1
              ? "Concluir e Analisar Perfil"
              : "Avançar"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F8F5",
    padding: 24,
    paddingTop: 56,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9F8F5",
    padding: 24,
  },
  processingCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DDCB",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    padding: 28,
    shadowColor: "#031634",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  processingScreen: {
    alignItems: "center",
    backgroundColor: "#F9F8F5",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  processingTitle: {
    color: "#033649",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 18,
  },
  processingText: {
    color: "#60717A",
    fontSize: 14,
    marginTop: 8,
  },
  eyebrow: {
    color: "#036564",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 0,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerBackButton: {
    minWidth: 84,
    paddingVertical: 8,
  },
  multipleChoiceNextButton: {
    transform: [{ translateY: -6 }],
  },
  questionContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  questionScroll: {
    flex: 1,
  },
  headerBackPlaceholder: {
    minWidth: 84,
  },
  headerBackText: {
    color: "#036564",
    fontSize: 14,
    fontWeight: "600",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    color: "#033649",
    fontSize: 14,
    fontWeight: "600",
  },
  progressTrack: {
    backgroundColor: "#E8DDCB",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  progressValue: {
    backgroundColor: "#036564",
    borderRadius: 999,
    height: "100%",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DDCB",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    flex: 1,
    marginTop: 24,
    overflow: "hidden",
    padding: 24,
    shadowColor: "#031634",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  question: {
    color: "#031634",
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    marginBottom: 20,
  },
  option: {
    alignItems: "center",
    flexDirection: "row",
    borderColor: "#036564",
    borderRadius: 8,
    borderWidth: 1.5,
    marginTop: 12,
    padding: 16,
  },
  selectedOption: {
    backgroundColor: "#E8DDCB",
    borderWidth: 2,
  },
  optionIndicator: {
    borderColor: "#036564",
    borderRadius: 10,
    borderWidth: 1.5,
    height: 20,
    marginRight: 12,
    width: 20,
  },
  selectedIndicator: {
    backgroundColor: "#036564",
    borderColor: "#033649",
  },
  optionText: {
    color: "#033649",
    fontSize: 14,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    minHeight: 48,
  },
  validationText: {
    color: "#D9534F",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    marginRight: 12,
  },
  nextButton: {
    backgroundColor: "#036564",
    borderRadius: 8,
    marginLeft: "auto",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  nextText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.45,
  },
  errorText: {
    color: "#031634",
    fontSize: 16,
    textAlign: "center",
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DDCB",
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  retryButton: {
    backgroundColor: "#036564",
    borderRadius: 8,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  textInput: {
    borderColor: "#036564",
    borderRadius: 8,
    borderWidth: 1.5,
    color: "#031634",
    fontSize: 14,
    minHeight: 120,
    padding: 16,
    textAlignVertical: "top",
  },
  warningInput: {
    borderColor: "#D9534F",
  },
  maxLengthInput: {
    borderColor: "#CDB380",
  },
  openValidationText: {
    color: "#D9534F",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  characterCount: {
    color: "#60717A",
    fontSize: 12,
    marginTop: 8,
    textAlign: "right",
  },
  maxLengthText: {
    color: "#D9534F",
    fontWeight: "700",
  },
  completedTitle: {
    color: "#033649",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  resultContent: {
    alignSelf: "stretch",
    paddingBottom: 16,
    paddingTop: 20,
  },
  resultScreen: {
    backgroundColor: "#F9F8F5",
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  resultHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  resultClose: { padding: 8, width: 48 },
  resultCloseText: { color: "#033649", fontSize: 30, lineHeight: 30 },
  resultBrand: { alignItems: "center", flexDirection: "row", gap: 8 },
  resultLogo: { color: "#036564", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  resultHeaderTitle: { color: "#60717A", fontSize: 12, lineHeight: 15 },
  resultAvatar: {
    alignItems: "center",
    backgroundColor: "#031634",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  resultAvatarText: { color: "#FFFFFF", fontSize: 18 },
  resultJourneyTrack: {
    backgroundColor: "#E8DDCB",
    height: 4,
    marginBottom: 10,
    overflow: "hidden",
  },
  resultJourneyValue: { backgroundColor: "#033649", height: "100%", width: "60%" },
  resultScrollContent: { paddingBottom: 24 },
  resultHero: { alignItems: "center", padding: 20 },
  resultBadge: {
    backgroundColor: "#F2E7C9",
    borderRadius: 999,
    color: "#8B6A20",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resultTitle: {
    color: "#033649",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },
  resultSubtitle: { color: "#60717A", fontSize: 14, marginTop: 8, textAlign: "center" },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DDCB",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    maxHeight: "90%",
    padding: 24,
    shadowColor: "#031634",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  resultLabel: {
    color: "#036564",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 18,
  },
  resultPrimaryArea: {
    color: "#033649",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  resultText: {
    color: "#031634",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    textAlign: "center",
  },
  matchCard: {
    backgroundColor: "#F2F8F7",
    borderColor: "#D9E8E5",
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  matchHeader: { flexDirection: "row", justifyContent: "space-between" },
  matchTitleBlock: { flex: 1, paddingRight: 12 },
  matchTitle: { color: "#033649", fontSize: 19, fontWeight: "800", marginTop: 6 },
  matchSubtitle: { color: "#60717A", fontSize: 13, marginTop: 5 },
  matchCircle: {
    alignItems: "center",
    borderColor: "#036564",
    borderRadius: 42,
    borderWidth: 7,
    height: 84,
    justifyContent: "center",
    width: 84,
  },
  matchPercent: { color: "#033649", fontSize: 18, fontWeight: "800" },
  matchText: { color: "#036564", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  skillRow: { marginTop: 18 },
  skillTopline: { flexDirection: "row", justifyContent: "space-between" },
  skillName: { color: "#033649", flex: 1, fontSize: 13 },
  skillPercent: { color: "#036564", fontSize: 13, fontWeight: "800" },
  skillTrack: { backgroundColor: "#DCE9E7", borderRadius: 999, height: 7, marginTop: 7, overflow: "hidden" },
  skillValue: { backgroundColor: "#036564", borderRadius: 999, height: "100%" },
  demandFooter: {
    alignItems: "center",
    backgroundColor: "#F5F7F8",
    borderRadius: 10,
    flexDirection: "row",
    marginTop: 18,
    padding: 12,
  },
  demandIcon: { color: "#036564", fontSize: 20, marginRight: 8 },
  demandText: { color: "#60717A", flex: 1, fontSize: 12 },
  strengthCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DDCB",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
    padding: 18,
  },
  strengthTitle: { color: "#198754", fontSize: 16, fontWeight: "800" },
  tagGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  resultTag: { backgroundColor: "#E5F1F7", borderRadius: 999, color: "#033649", fontSize: 12, paddingHorizontal: 12, paddingVertical: 8 },
  resultActions: { gap: 10, marginTop: 18 },
  resultPrimaryButton: { alignItems: "center", backgroundColor: "#036564", borderRadius: 12, paddingVertical: 16 },
  resultPrimaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  resultSecondaryButton: { alignItems: "center", paddingVertical: 12 },
  resultSecondaryButtonText: { color: "#033649", fontSize: 14, fontWeight: "700" },
  resultGhostButton: { color: "#60717A", fontSize: 13, paddingVertical: 8, textAlign: "center" },
});
