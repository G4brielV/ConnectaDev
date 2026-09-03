import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetchQuizQuestions, QuizQuestion } from "../shared/api/quizApi";
import { getAuthToken } from "../shared/lib/authSession";

export function QuizScreen() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answerValidationMessage, setAnswerValidationMessage] = useState<string | null>(null);
  const questionTransition = useRef(new Animated.Value(1)).current;
  const previousQuestionIndex = useRef(currentIndex);

  useEffect(() => {
    let isMounted = true;

    async function loadQuiz(): Promise<void> {
      const token = await getAuthToken();
      if (!token) {
        if (isMounted) {
          setErrorMessage("Faça login para iniciar seu questionário.");
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
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o questionário.",
          );
          setIsLoading(false);
        }
      }
    }

    void loadQuiz();
    return () => {
      isMounted = false;
    };
  }, []);

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
  }, [currentIndex, isComplete, questions.length]);

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
        <Text style={styles.errorText}>{errorMessage}</Text>
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

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answer = answers[question.id] ?? "";
  const canAdvance = question.type === "open" ? answer.trim().length > 0 : answer.length > 0;

  function selectAnswer(value: string): void {
    setAnswerValidationMessage(null);
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [question.id]: value,
    }));
  }

  function goToNextQuestion(): void {
    if (!canAdvance) {
      if (question.type === "multiple-choice") {
        setAnswerValidationMessage("Selecione uma opção para continuar");
      }
      return;
    }

    if (currentIndex === questions.length - 1) {
      setIsComplete(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  if (isComplete) {
    return (
      <View style={styles.centered}>
        <Text style={styles.eyebrow}>QUIZ VOCACIONAL</Text>
        <Text style={styles.completedTitle}>Respostas registradas!</Text>
        <Text style={styles.errorText}>
          Obrigado por compartilhar seu perfil. Em breve você verá suas recomendações.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          {question.options?.map((option) => (
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
          {question.type === "open" && (
            <TextInput
              accessibilityLabel="Resposta aberta"
              multiline
              onChangeText={selectAnswer}
              placeholder="Escreva sua resposta..."
              placeholderTextColor="#60717A"
              style={styles.textInput}
              value={answer}
            />
          )}
        </ScrollView>
      </Animated.View>
      <View style={styles.actions}>
        {answerValidationMessage && (
          <Text accessibilityRole="alert" style={styles.validationText}>
            {answerValidationMessage}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdvance }}
          style={[
            styles.nextButton,
            question.type === "multiple-choice" && styles.multipleChoiceNextButton,
            !canAdvance && styles.disabledButton,
          ]}
          onPress={goToNextQuestion}
        >
          <Text style={styles.nextText}>
            {currentIndex === questions.length - 1 ? "Concluir" : "Avançar"}
          </Text>
        </Pressable>
      </View>
    </View>
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
  completedTitle: {
    color: "#033649",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
});
