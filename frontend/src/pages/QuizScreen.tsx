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
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  fetchQuizQuestions,
  QuizQuestion,
  submitQuiz,
} from "../shared/api/quizApi";
import { useAuth } from "../entities/session";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { getQuizCatalogState } from "./quizState";
import { invalidateJobRecommendations } from "../shared/api/jobRecommendationsCache";
import { chunky, colors, fonts, radius, shadow, spacing } from "../shared/config/theme";
import { Logo } from "../shared/ui/Logo";
import { Button } from "../shared/ui/Button/Button";

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

function QuizScreenContent() {
  const quizLoadErrorMessage =
    "Não foi possível carregar as perguntas no momento. Verifique sua conexão.";
  const { isAuthenticated, isLoading: isAuthLoading, token } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Quiz">>();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answerValidationMessage, setAnswerValidationMessage] = useState<string | null>(null);
  const textInputRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
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
    scrollRef.current?.scrollTo({ y: 0, animated: false });
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

        if (currentIndex > 0) {
          setCurrentIndex((index) => index - 1);
          return true;
        }

        return false;
      },
    );

    return () => subscription.remove();
  }, [currentIndex, isLoading, isSubmitting]);

  function leaveQuiz(): void {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          color={colors.primary}
          size="large"
          accessibilityLabel="Carregando quiz"
        />
        <Text style={styles.loadingText}>Preparando suas perguntas...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <View style={styles.stateCard}>
          <View style={styles.stateIconError}>
            <Feather name="wifi-off" size={26} color={colors.danger} />
          </View>
          <Text style={styles.stateTitle}>Não foi possível carregar</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <View style={styles.stateActions}>
            <Button
              title="Tentar novamente"
              onPress={() => {
                setErrorMessage(null);
                setRetryAttempt((attempt) => attempt + 1);
              }}
            />
            <Button
              title="Voltar"
              variant="soft"
              onPress={leaveQuiz}
              accessibilityLabel="Sair do quiz"
            />
          </View>
        </View>
      </View>
    );
  }

  if (getQuizCatalogState(questions) === "empty") {
    return (
      <View style={styles.centered}>
        <View style={styles.stateCard}>
          <View style={styles.stateIconNeutral}>
            <Feather name="compass" size={26} color={colors.primary} />
          </View>
          <Text style={styles.stateTitle}>Quiz em atualização</Text>
          <Text style={styles.stateText}>
            O quiz vocacional está passando por atualizações. Volte em breve!
          </Text>
          <View style={styles.stateActions}>
            <Button
              title="Voltar para a Home"
              onPress={() => navigation.navigate("Home")}
              accessibilityLabel="Voltar para a tela inicial"
            />
          </View>
        </View>
      </View>
    );
  }

  const question = questions[currentIndex];
  if (!question) {
    return (
      <View style={styles.centered}>
        <View style={styles.stateCard}>
          <View style={styles.stateIconNeutral}>
            <Feather name="compass" size={26} color={colors.primary} />
          </View>
          <Text style={styles.stateTitle}>Nenhuma pergunta disponível</Text>
          <Text style={styles.stateText}>
            Não encontramos perguntas para exibir agora.
          </Text>
          <View style={styles.stateActions}>
            <Button
              title="Voltar"
              onPress={leaveQuiz}
              accessibilityLabel="Sair do quiz"
            />
          </View>
        </View>
      </View>
    );
  }

  if (isSubmitting) {
    return (
      <View style={styles.centered}>
        <View style={styles.stateCard}>
          <View style={styles.processingBadge}>
            <Feather name="cpu" size={13} color={colors.primary} />
            <Text style={styles.processingBadgeText}>ANÁLISE POR IA</Text>
          </View>
          <View style={styles.processingLogoWrap}>
            <Logo size={42} showWordmark={false} />
          </View>
          <ActivityIndicator
            color={colors.primary}
            size="large"
            accessibilityLabel="Processando perfil"
            style={styles.processingSpinner}
          />
          <Text style={styles.stateTitle}>Analisando sua vocação...</Text>
          <Text style={styles.stateText}>
            Estamos cruzando suas respostas para recomendar a área, a trilha e os cursos ideais para você.
          </Text>
        </View>
      </View>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answer = answers[question.id] ?? "";
  const trimmedAnswer = answer.trim();
  const isMultipleChoice = question.type === "MULTIPLE_CHOICE";
  const isOpenText = question.type === "OPEN_TEXT";
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasOptions = isMultipleChoice && (question.options?.length ?? 0) > 0;
  const minLength = question.validation?.minLength ?? (isOpenText ? 20 : 0);
  const maxLength = question.validation?.maxLength ?? (isOpenText ? 500 : 0);
  const remainingMinChars = Math.max(0, minLength - trimmedAnswer.length);
  const canAdvance =
    isOpenText
      ? trimmedAnswer.length >= minLength && trimmedAnswer.length <= maxLength
      : hasOptions && answer.length > 0;

  function selectAnswer(value: string): void {
    setAnswerValidationMessage(null);
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [question.id]: value,
    }));
  }

  // Respostas ficam em `answers` por id, então voltar preserva o que já foi respondido
  function goToPreviousQuestion(): void {
    setAnswerValidationMessage(null);
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
      return;
    }
    leaveQuiz();
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
            ? `Escreva pelo menos ${minLength} caracteres para detalhar sua resposta.`
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
        setAnswerValidationMessage("Selecione uma opção para continuar.");
      }
      return;
    }

    if (isLastQuestion) {
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
        invalidateJobRecommendations();
        navigation.replace("QuizResult", { result });
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardContainer}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityLabel={
              currentIndex > 0 ? "Voltar para a pergunta anterior" : "Sair do quiz"
            }
            accessibilityRole="button"
            disabled={isSubmitting}
            hitSlop={8}
            onPress={goToPreviousQuestion}
            style={({ pressed }) => [
              styles.headerBackButton,
              pressed && styles.headerBackButtonPressed,
            ]}
          >
            <Feather
              color={colors.textPrimary}
              name={currentIndex > 0 ? "arrow-left" : "x"}
              size={20}
            />
          </Pressable>
          <Logo size={28} showWordmark={false} />
          <View style={styles.headerBrandTexts}>
            <Text style={styles.headerEyebrow}>CONNECTADEV</Text>
            <Text style={styles.headerTitle}>Quiz Vocacional</Text>
          </View>
        </View>
        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>
            {currentIndex + 1}/{questions.length}
          </Text>
        </View>
      </View>

      <View
        style={styles.progressWrap}
        accessibilityRole="progressbar"
        accessibilityLabel={`Pergunta ${currentIndex + 1} de ${questions.length}`}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
      >
        <View style={styles.progressTrack}>
          <View style={[styles.progressValue, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <Animated.View
          style={{
            opacity: questionTransition,
            transform: [
              {
                translateX: questionTransition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.questionHeader}>
            <View style={styles.questionMetaRow}>
              <View style={styles.questionTag}>
                <Feather
                  name={isOpenText ? "edit-3" : "compass"}
                  size={12}
                  color={colors.primary}
                />
                <Text style={styles.questionTagText}>
                  PERGUNTA {currentIndex + 1} DE {questions.length}
                </Text>
              </View>
            </View>
            <Text style={styles.question}>{question.prompt}</Text>
            <Text style={styles.questionHint}>
              {isOpenText
                ? `Conte com suas palavras (mínimo de ${minLength} caracteres).`
                : "Escolha a alternativa que mais combina com você."}
            </Text>
          </View>

          {hasOptions && (
            <View style={styles.optionsList}>
              {question.options?.map((option, optionIndex) => {
                const isSelected = answer === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => selectAnswer(option.id)}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && styles.selectedOption,
                      pressed && !isSelected && styles.optionPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionBullet,
                        isSelected && styles.selectedBullet,
                      ]}
                    >
                      {isSelected ? (
                        <Feather
                          name="check"
                          size={14}
                          color={colors.textOnPrimary}
                        />
                      ) : (
                        <Text style={styles.optionBulletText}>
                          {optionLetter(optionIndex)}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {isOpenText && (
            <View
              style={[
                styles.openTextCard,
                trimmedAnswer.length >= minLength && styles.openTextCardReady,
                answerValidationMessage && styles.openTextCardError,
                answer.length >= maxLength && styles.openTextCardMax,
              ]}
            >
              <TextInput
                accessibilityLabel="Resposta aberta"
                multiline
                maxLength={maxLength}
                onChangeText={selectAnswer}
                placeholder="Escreva sobre seus interesses, o que gosta de fazer ou que tipo de problema curte resolver..."
                placeholderTextColor={colors.textMuted}
                ref={textInputRef}
                style={styles.textInput}
                textAlignVertical="top"
                value={answer}
              />
              <View style={styles.openTextFooter}>
                <View style={styles.openTextStatus}>
                  <Feather
                    name={remainingMinChars === 0 ? "check-circle" : "info"}
                    size={13}
                    color={
                      remainingMinChars === 0
                        ? colors.success
                        : colors.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.openTextHint,
                      remainingMinChars === 0 && styles.openTextHintReady,
                    ]}
                  >
                    {remainingMinChars === 0
                      ? "Pronto para continuar"
                      : `Faltam ${remainingMinChars} caracteres`}
                  </Text>
                </View>
                <Text
                  accessibilityLabel={`${answer.length} de ${maxLength} caracteres`}
                  style={[
                    styles.characterCount,
                    answer.length >= maxLength && styles.maxLengthText,
                  ]}
                >
                  {answer.length}/{maxLength}
                </Text>
              </View>
            </View>
          )}

          {answerValidationMessage ? (
            <View accessibilityRole="alert" style={styles.validationBanner}>
              <Feather name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.validationText}>{answerValidationMessage}</Text>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        {currentIndex > 0 ? (
          <Pressable
            accessibilityLabel="Voltar para a pergunta anterior"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={goToPreviousQuestion}
            style={({ pressed }) => [
              styles.secondaryFooterButton,
              pressed && styles.secondaryFooterButtonPressed,
            ]}
          >
            <Feather name="arrow-left" size={19} color={colors.primary} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdvance || isSubmitting }}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.cta,
            !canAdvance && styles.ctaDisabled,
            pressed && canAdvance && styles.ctaPressed,
          ]}
          onPress={() => void goToNextQuestion()}
        >
          <Text style={styles.ctaText}>
            {isLastQuestion ? "Concluir e Analisar Perfil" : "Continuar"}
          </Text>
          <Feather
            name={isLastQuestion ? "check" : "arrow-right"}
            size={18}
            color={colors.textOnPrimary}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

export function QuizScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <QuizScreenContent />
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
    backgroundColor: colors.canvas,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
    padding: spacing.lg,
  },
  loadingText: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  stateCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.light,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow.card,
  },
  stateIconError: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  stateIconNeutral: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.creamSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  stateTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 19,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  stateText: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: "center",
  },
  stateActions: {
    width: "100%",
    gap: 10,
    marginTop: spacing.lg,
  },
  processingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: spacing.md,
  },
  processingBadgeText: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    letterSpacing: 0.9,
    color: colors.primary,
  },
  processingLogoWrap: {
    marginBottom: spacing.sm,
  },
  processingSpinner: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackButtonPressed: {
    backgroundColor: colors.creamSoft,
  },
  headerBrandTexts: {
    flex: 1,
  },
  headerEyebrow: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textMuted,
  },
  headerTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  stepPill: {
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepPillText: {
    fontFamily: fonts.mono.medium,
    fontSize: 12,
    color: colors.primary,
  },
  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamSoft,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.light,
    overflow: "hidden",
  },
  progressValue: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  progressPercent: {
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    color: colors.textMuted,
    minWidth: 32,
    textAlign: "right",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  questionHeader: {
    marginBottom: 18,
    gap: 8,
  },
  questionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  questionTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  questionTagText: {
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.primary,
  },
  question: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  questionHint: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  optionsList: {
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderColor: colors.light,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
    ...shadow.card,
  },
  optionPressed: {
    backgroundColor: colors.creamSoft,
  },
  selectedOption: {
    backgroundColor: colors.creamSoft,
    borderColor: colors.primary,
  },
  optionBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.creamSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBullet: {
    backgroundColor: colors.primary,
  },
  optionBulletText: {
    fontFamily: fonts.sans.bold,
    fontSize: 12,
    color: colors.secondary,
  },
  optionText: {
    flex: 1,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  selectedOptionText: {
    fontFamily: fonts.sans.semiBold,
    color: colors.textPrimary,
  },
  openTextCard: {
    backgroundColor: colors.surface,
    borderColor: colors.light,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: 16,
    ...shadow.card,
  },
  openTextCardReady: {
    borderColor: colors.primary,
  },
  openTextCardError: {
    borderColor: colors.danger,
  },
  openTextCardMax: {
    borderColor: colors.accent,
  },
  textInput: {
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    minHeight: 148,
    padding: 0,
  },
  openTextFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.creamSoft,
  },
  openTextStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  openTextHint: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  openTextHintReady: {
    color: colors.success,
  },
  characterCount: {
    fontFamily: fonts.mono.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  maxLengthText: {
    color: colors.danger,
  },
  validationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FDF3F2",
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 14,
  },
  validationText: {
    flex: 1,
    fontFamily: fonts.sans.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.danger,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.light,
  },
  secondaryFooterButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryFooterButtonPressed: {
    backgroundColor: colors.creamSoft,
    borderColor: colors.primary,
  },
  cta: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderBottomWidth: chunky.ctaDepth,
    borderBottomColor: colors.primaryDeepest,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  ctaDisabled: {
    opacity: 0.48,
  },
  ctaPressed: {
    borderBottomWidth: chunky.pressedDepth,
    transform: [{ translateY: 2 }],
  },
  ctaText: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 15,
    color: colors.textOnPrimary,
  },
});
