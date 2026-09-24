import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { QuestionResultItem, ReviewSubmitResponse } from "../shared/api/reviewApi";
import { getWrongAnswers } from "./knowledgeReviewState";

type ReviewResultRouteProp = RouteProp<RootStackParamList, "ReviewResult">;

export function ReviewResultScreen() {
  const route = useRoute<ReviewResultRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "ReviewResult">>();

  const result: ReviewSubmitResponse = route.params?.result;
  const topicId: string = route.params?.topicId || "topic-fundamentos-prog-01";

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  // Celebratory animation (scale & bounce)
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  if (!result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Nenhum resultado de revisão encontrado.</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.homeButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.homeButtonText}>Voltar para o Início</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const wrongAnswers: QuestionResultItem[] = getWrongAnswers(result.results || []);
  const hasErrors = wrongAnswers.length > 0;
  const isPerfectScore = result.score === result.totalQuestions;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Celebratory Animation (Cenário 4) */}
        <Animated.View
          style={[
            styles.celebrationContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.trophyCircle}>
            <Text style={styles.trophyIcon}>{isPerfectScore ? "🏆" : "🎉"}</Text>
          </View>
          <Text style={styles.congratsTitle}>
            {isPerfectScore ? "Excelente Desempenho!" : "Revisão Concluída!"}
          </Text>
          <Text style={styles.topicSubtitle}>{result.topicTitle}</Text>
        </Animated.View>

        {/* Score & Aproveitamento Card (Cenário 4) */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreSummary}>
            {result.score} de {result.totalQuestions} acertos — {result.percentage}%
          </Text>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${result.percentage}%` }]} />
          </View>
        </View>

        {/* Gamification Reward Card: XP + Streaks (Cenário 4) */}
        <View style={styles.rewardCard}>
          <View style={styles.rewardHeader}>
            <Text style={styles.rewardBadge}>RECOMPENSA</Text>
            {result.currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {result.currentStreak} dias seguidos</Text>
              </View>
            )}
          </View>

          <View style={styles.rewardContent}>
            {result.isFirstCompletion === false ? (
              <>
                <Text style={styles.rewardXpText}>Treino concluído 💪</Text>
                <Text style={styles.totalXpSubtext}>
                  O XP deste tópico já foi conquistado. Total acumulado: {result.totalXp} XP
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.rewardXpText}>+{result.xpEarned} XP adquiridos!</Text>
                <Text style={styles.totalXpSubtext}>Total acumulado: {result.totalXp} XP</Text>
              </>
            )}
          </View>
        </View>

        {/* Error Review Collapsible Section (Cenário 6) */}
        {hasErrors && (
          <View style={styles.errorsSection}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Revisar respostas incorretas"
              style={styles.accordionToggle}
              onPress={() => setIsAccordionOpen((prev) => !prev)}
            >
              <View style={styles.accordionTitleRow}>
                <Text style={styles.accordionIcon}>🔍</Text>
                <Text style={styles.accordionTitle}>
                  Revisar Respostas ({wrongAnswers.length} {wrongAnswers.length === 1 ? "erro" : "erros"})
                </Text>
              </View>
              <Text style={styles.accordionArrow}>{isAccordionOpen ? "▲" : "▼"}</Text>
            </Pressable>

            {isAccordionOpen && (
              <View style={styles.accordionContent}>
                {wrongAnswers.map((item, index) => (
                  <View key={item.questionId} style={styles.errorItemCard}>
                    <Text style={styles.errorItemSequence}>Questão {index + 1}</Text>
                    <Text style={styles.errorItemStatement}>{item.statement}</Text>

                    <View style={styles.answerComparisonBox}>
                      <View style={styles.answerRow}>
                        <Text style={styles.answerTagWrong}>Sua resposta:</Text>
                        <Text style={styles.answerTextWrong}>Opção {item.selectedOptionId}</Text>
                      </View>

                      <View style={styles.answerRow}>
                        <Text style={styles.answerTagCorrect}>Correta:</Text>
                        <Text style={styles.answerTextCorrect}>Opção {item.correctOptionId}</Text>
                      </View>
                    </View>

                    <View style={styles.errorExplanationBox}>
                      <Text style={styles.errorExplanationLabel}>Justificativa:</Text>
                      <Text style={styles.errorExplanationText}>{item.explanation}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Actions / Footer (Cenário 6) */}
        <View style={styles.footerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
            style={styles.retryButton}
            onPress={() => {
              navigation.replace("KnowledgeReview", {
                topicId,
                topicTitle: result.topicTitle,
              });
            }}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para a tela inicial"
            style={styles.homeButton}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.homeButtonText}>Voltar para o Início</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 20,
    textAlign: "center",
  },
  celebrationContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  trophyCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E0F2F1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#036564",
  },
  trophyIcon: {
    fontSize: 42,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#031634",
    marginBottom: 6,
    textAlign: "center",
  },
  topicSubtitle: {
    fontSize: 14,
    color: "#036564",
    fontWeight: "600",
    textAlign: "center",
  },
  scoreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  scoreSummary: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 14,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#036564",
    borderRadius: 999,
  },
  rewardCard: {
    backgroundColor: "#033649",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  rewardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rewardBadge: {
    color: "#99F6E4",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  streakBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  streakText: {
    color: "#FEF08A",
    fontSize: 12,
    fontWeight: "700",
  },
  rewardContent: {
    alignItems: "center",
    paddingVertical: 6,
  },
  rewardXpText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  totalXpSubtext: {
    fontSize: 13,
    color: "#94A3B8",
  },
  errorsSection: {
    marginBottom: 24,
  },
  accordionToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  accordionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  accordionIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  accordionArrow: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
  },
  accordionContent: {
    marginTop: 12,
    gap: 12,
  },
  errorItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  errorItemSequence: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  errorItemStatement: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 21,
    marginBottom: 12,
  },
  answerComparisonBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 10,
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  answerTagWrong: {
    width: 100,
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "600",
  },
  answerTextWrong: {
    fontSize: 14,
    color: "#991B1B",
    fontWeight: "700",
  },
  answerTagCorrect: {
    width: 100,
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
  },
  answerTextCorrect: {
    fontSize: 14,
    color: "#166534",
    fontWeight: "700",
  },
  errorExplanationBox: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  errorExplanationLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 2,
  },
  errorExplanationText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 19,
  },
  footerActions: {
    gap: 12,
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: "#036564",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  homeButton: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  homeButtonText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "600",
  },
});
