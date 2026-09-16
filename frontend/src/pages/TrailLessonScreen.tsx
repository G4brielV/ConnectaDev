import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../entities/session";
import { useGamification } from "../entities/gamification";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { fetchTrailLesson, TrailLesson } from "../shared/api/trailsApi";
import { scoreLesson, ScoreLessonResult } from "../shared/api/gamificationApi";

type Props = NativeStackScreenProps<RootStackParamList, "TrailLesson">;

export function TrailLessonScreen() {
  const { token } = useAuth();
  const { applySummary } = useGamification();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "TrailLesson">>();
  const route = useRoute<Props["route"]>();
  const [lesson, setLesson] = useState<TrailLesson | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ScoreLessonResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resultAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!result) return;

    Animated.spring(resultAnimation, {
      toValue: 1,
      friction: 7,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, [result, resultAnimation]);

  useEffect(() => {
    if (!token) return;
    void fetchTrailLesson(token, route.params.lessonId)
      .then(setLesson)
      .catch((error: unknown) => setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar a lição."))
      .finally(() => setIsLoading(false));
  }, [route.params.lessonId, token]);

  async function handleSubmit(): Promise<void> {
    if (!token || !lesson || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const score = await scoreLesson(token, lesson.id, answers);
      setResult(score);
      applySummary({ totalXp: score.totalXp, currentLevel: score.currentLevel });
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível registrar sua pontuação.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <ActivityIndicator style={styles.centered} color="#036564" />;
  if (errorMessage && !lesson) return <View style={styles.centered}><Text style={styles.error}>{errorMessage}</Text></View>;
  if (!lesson) return null;

  if (result) {
    return (
      <View style={styles.resultScreen}>
        <Animated.View
          style={[
            styles.resultContent,
            {
              opacity: resultAnimation,
              transform: [{ scale: resultAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            },
          ]}
        >
          <Text style={styles.celebration}>{result.leveledUp ? "🎉" : "🏆"}</Text>
          <Text style={styles.resultTitle}>{result.leveledUp ? "Level Up!" : "Lição concluída!"}</Text>
          <Text style={styles.resultScore}>Você acertou {result.correctCount} de {result.totalQuestions} perguntas.</Text>
          <Text style={styles.xpMessage}>
            {result.xpEarned > 0 ? `+${result.xpEarned} XP adicionados ao seu perfil!` : "Você já resgatou o XP desta lição."}
          </Text>
          {!result.leveledUp && result.correctCount < result.totalQuestions ? (
            <Text style={styles.studyMessage}>
              Revise os conteúdos para gabaritar na próxima!
            </Text>
          ) : null}
          {result.leveledUp ? (
            <Text style={styles.levelUp}>
              Parabéns! Você alcançou o Nível {result.currentLevel}: {result.levelName ?? "Iniciante Tech"} 🎉
            </Text>
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => navigation.replace("Trails")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Voltar para trilhas</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Voltar</Text></Pressable>
      <Text style={styles.eyebrow}>LIÇÃO {lesson.sequence}</Text>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.subtitle}>Acerte todas as perguntas para receber +{lesson.xpReward} XP.</Text>
      {lesson.questions.map((question, index) => (
        <View key={question.id} style={styles.questionCard}>
          <Text style={styles.questionNumber}>Pergunta {index + 1}</Text>
          <Text style={styles.question}>{question.statement}</Text>
          {question.options?.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option.id}
              onPress={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
              style={[styles.option, answers[question.id] === option.id && styles.optionSelected]}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </Pressable>
          ))}
          {question.type === "OPEN_TEXT" ? (
            <TextInput
              multiline
              onChangeText={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))}
              placeholder="Digite sua resposta"
              style={styles.input}
              value={answers[question.id] ?? ""}
            />
          ) : null}
        </View>
      ))}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={() => void handleSubmit()} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>{isSubmitting ? "Calculando XP..." : "Concluir lição"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F9F8F5", flexGrow: 1, gap: 14, padding: 20 },
  centered: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  back: { color: "#036564", fontSize: 15, fontWeight: "700" },
  eyebrow: { color: "#B46B00", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#031634", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#60717A", fontSize: 14, lineHeight: 20 },
  questionCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16 },
  questionNumber: { color: "#036564", fontSize: 12, fontWeight: "800" },
  question: { color: "#031634", fontSize: 17, fontWeight: "700", lineHeight: 24, marginVertical: 10 },
  option: { borderColor: "#D7E0E3", borderRadius: 8, borderWidth: 1, marginTop: 8, padding: 12 },
  optionSelected: { backgroundColor: "#E5F1F7", borderColor: "#036564" },
  optionText: { color: "#033649" },
  input: { borderColor: "#D7E0E3", borderRadius: 8, borderWidth: 1, minHeight: 90, padding: 12, textAlignVertical: "top" },
  primaryButton: { alignItems: "center", backgroundColor: "#036564", borderRadius: 10, padding: 15 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  error: { color: "#B13A24", fontSize: 14 },
  resultScreen: { alignItems: "center", backgroundColor: "#031634", flex: 1, gap: 16, justifyContent: "center", padding: 24 },
  resultContent: { alignItems: "center", gap: 16, maxWidth: 360, width: "100%" },
  celebration: { fontSize: 54 },
  resultTitle: { color: "#FFFFFF", fontSize: 28, fontWeight: "800", marginTop: 12 },
  resultScore: { color: "#E8DDCB", fontSize: 16, marginTop: 14, textAlign: "center" },
  xpMessage: { color: "#CDB380", fontSize: 20, fontWeight: "800", marginTop: 20, textAlign: "center" },
  studyMessage: { color: "#E8DDCB", fontSize: 15, textAlign: "center" },
  levelUp: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginTop: 16, textAlign: "center" },
});
