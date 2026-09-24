import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { useAuth } from "../entities/session";
import { fetchCourseRecommendations, CourseRecommendation } from "../shared/api/coursesApi";
import { fetchGamificationSummary, GamificationSummary } from "../shared/api/gamificationApi";
import { areaTopicId } from "../shared/lib/areaTopic";

const XP_HINT = "até +50 XP";

export function ReviewHubScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Home">>();
  const { token } = useAuth();
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [areaPrincipal, setAreaPrincipal] = useState<string | null>(null);
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCourses = useCallback(async (): Promise<void> => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetchCourseRecommendations(token);
      setCourses(res.courses || []);
      setAreaPrincipal(res.hasDiagnosis && res.areaPrincipal ? res.areaPrincipal : null);
    } catch {
      // Keep empty if unable to load recommendations
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const loadSummary = useCallback(async (): Promise<void> => {
    if (!token) return;
    try {
      setSummary(await fetchGamificationSummary(token));
    } catch {
      // Keep previous values if unable to load progress
    }
  }, [token]);

  // Reload when the Home screen regains focus (e.g. returning from a review result)
  useFocusEffect(
    useCallback(() => {
      void loadCourses();
      void loadSummary();
    }, [loadCourses, loadSummary]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>REVISÃO ATIVA 📝</Text>
          <Text style={styles.title}>Revisão de Conhecimento</Text>
          <Text style={styles.subtitle}>
            Responda a questionários gerados por IA para fixar o conteúdo dos seus estudos, acumular XP e manter sua ofensiva diária ativa.
          </Text>
        </View>

        {/* Gamification summary card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🔥</Text>
            <View>
              <Text style={styles.statLabel}>Ofensiva</Text>
              <Text style={styles.statValue}>
                {summary ? `${summary.currentStreak} ${summary.currentStreak === 1 ? "dia" : "dias"}` : "—"}
              </Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🏆</Text>
            <View>
              <Text style={styles.statLabel}>XP total</Text>
              <Text style={styles.statValue}>{summary ? `${summary.totalXp} XP` : "—"}</Text>
            </View>
          </View>
        </View>

        {/* Revisão da área do diagnóstico vocacional */}
        {areaPrincipal ? (
          <>
            <Text style={styles.sectionTitle}>Revisão da sua área</Text>
            <View style={[styles.reviewCard, styles.areaCard]}>
              <View style={styles.cardTopRow}>
                <Text style={styles.trackBadge}>SUA ÁREA</Text>
                <Text style={styles.xpBadge}>{XP_HINT}</Text>
              </View>
              <Text style={styles.cardTitle}>{areaPrincipal}</Text>
              <Text style={styles.cardDescription}>
                Perguntas geradas por IA sobre os fundamentos de {areaPrincipal}, com base no seu diagnóstico vocacional.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Iniciar revisão da área ${areaPrincipal}`}
                onPress={() =>
                  navigation.navigate("KnowledgeReview", {
                    topicId: areaTopicId(areaPrincipal),
                    topicTitle: `Revisão: ${areaPrincipal}`,
                  })
                }
                style={styles.startButton}
              >
                <Text style={styles.startButtonText}>Revisar minha área 🧠</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {/* Tópico Base / Geral */}
        <Text style={styles.sectionTitle}>Módulos Essenciais</Text>
        <View style={styles.reviewCard}>
          <View style={styles.cardTopRow}>
            <Text style={styles.trackBadge}>TRILHA BASE</Text>
            <Text style={styles.xpBadge}>{XP_HINT}</Text>
          </View>
          <Text style={styles.cardTitle}>Fundamentos de Programação e Lógica</Text>
          <Text style={styles.cardDescription}>
            Variáveis, laços de repetição (while/for), condicionais e funções puras.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Iniciar revisão de fundamentos de programação"
            onPress={() =>
              navigation.navigate("KnowledgeReview", {
                topicId: "topic-fundamentos-prog-01",
                topicTitle: "Fundamentos de Programação e Lógica",
              })
            }
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>Iniciar Revisão 📝</Text>
          </Pressable>
        </View>

        {/* Revisões por Cursos Recomendados */}
        <View style={styles.coursesSectionHeader}>
          <Text style={styles.sectionTitle}>Revisão com IA dos seus Cursos</Text>
          <Text style={styles.sectionSubtitle}>
            A IA gera 5 perguntas inéditas adaptadas ao tema e nível de cada curso. Cada acerto vale 10 XP na primeira conclusão.
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#036564" style={styles.loader} />
        ) : courses.length > 0 ? (
          courses.map((course) => (
            <View key={course.id} style={styles.courseReviewCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.providerBadge}>{course.provider}</Text>
                <Text style={styles.levelBadge}>{course.level}</Text>
              </View>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseTags}>{course.tags.join(" • ")}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Revisar com IA ${course.title}`}
                onPress={() =>
                  navigation.navigate("KnowledgeReview", {
                    topicId: `course-topic-${course.id}`,
                    topicTitle: `Revisão: ${course.title}`,
                  })
                }
                style={styles.aiStartButton}
              >
                <Text style={styles.aiStartButtonText}>Fazer Revisão com IA ({XP_HINT}) 🧠</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <View style={styles.emptyCoursesCard}>
            <Text style={styles.emptyCoursesText}>
              Conclua o Quiz Vocacional para desbloquear cursos e gerar revisões personalizadas por IA.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("Quiz")}
              style={styles.quizLinkButton}
            >
              <Text style={styles.quizLinkText}>Começar o Quiz Agora 🚀</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2F1",
    color: "#036564",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#033649",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  statIcon: {
    fontSize: 24,
  },
  statLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  coursesSectionHeader: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  areaCard: {
    borderColor: "#036564",
    borderWidth: 1.5,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  trackBadge: {
    backgroundColor: "#E0F2F1",
    color: "#036564",
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  xpBadge: {
    backgroundColor: "#FEF3C7",
    color: "#B45309",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: "#036564",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  courseReviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  providerBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#036564",
  },
  levelBadge: {
    fontSize: 11,
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 4,
    marginBottom: 4,
  },
  courseTags: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
  },
  aiStartButton: {
    backgroundColor: "#F0FDFA",
    borderWidth: 1.5,
    borderColor: "#036564",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  aiStartButtonText: {
    color: "#036564",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCoursesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8,
  },
  emptyCoursesText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 14,
  },
  quizLinkButton: {
    backgroundColor: "#036564",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  quizLinkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  loader: {
    marginTop: 20,
  },
});
