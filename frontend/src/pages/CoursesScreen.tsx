import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  bookmarkCourse,
  fetchCourseRecommendations,
  rateCourse,
  updateCourseRating,
  CourseRecommendation,
} from "../shared/api/coursesApi";
import { useAuth } from "../entities/session";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { Toast } from "../shared/ui/Toast";
import { CourseRatingModal } from "../features/courses/ui/CourseRatingModal";
import { useGamification } from "../entities/gamification";
import { XpProgressBar } from "../shared/ui/XpProgressBar/XpProgressBar";

export function CoursesScreen() {
  const { token } = useAuth();
  const { refresh } = useGamification();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Courses">>();
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [areaPrincipal, setAreaPrincipal] = useState("");
  const [hasDiagnosis, setHasDiagnosis] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedCourseIds, setSavedCourseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const [ratingCourse, setRatingCourse] = useState<CourseRecommendation | null>(null);
  const [isRating, setIsRating] = useState(false);
  const loadErrorMessage =
    "Não foi possível carregar suas recomendações no momento";

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function openCourse(externalUrl: string): Promise<void> {
    try {
      await Linking.openURL(externalUrl);
    } catch {
      setErrorMessage("Não foi possível abrir o conteúdo do curso.");
    }
  }

  async function saveCourse(courseId: string): Promise<void> {
    if (!token || savedCourseIds.has(courseId) || savingCourseId) return;

    setSavingCourseId(courseId);
    try {
      await bookmarkCourse(token, courseId);
      setSavedCourseIds((current) => new Set(current).add(courseId));
      setToastMessage("Curso salvo nos seus favoritos!");
      setToastVisible(true);
    } catch (error: unknown) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o curso nos seus favoritos.",
      );
      setToastVisible(true);
    } finally {
      setSavingCourseId(null);
    }
  }

  async function submitRating(
    rating: number,
    comment: string,
    matchedProfile: boolean,
  ): Promise<void> {
    if (!token || !ratingCourse) return;

    setIsRating(true);
    try {
      const isEditing = Boolean(ratingCourse.userRating);
      const saveRating = isEditing ? updateCourseRating : rateCourse;
      const savedRating = await saveRating(token, ratingCourse.id, {
        rating,
        comment,
        matchedProfile,
      });
      setCourses((current) =>
        current.map((course) =>
          course.id === ratingCourse.id ? { ...course, userRating: savedRating } : course,
        ),
      );
      setRatingCourse(null);
      setToastMessage(
        isEditing
          ? "Sua avaliação foi atualizada com sucesso!"
          : "Obrigado pelo seu feedback! Ele ajuda a calibrar suas recomendações",
      );
      setToastVisible(true);
    } catch (error: unknown) {
      setToastMessage(
        "Não foi possível registrar sua avaliação agora. Verifique sua conexão e tente novamente",
      );
      setToastVisible(true);
    } finally {
      setIsRating(false);
    }
  }

  const loadRecommendations = useCallback(async (): Promise<void> => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetchCourseRecommendations(token);
      setHasDiagnosis(response.hasDiagnosis);
      setAreaPrincipal(response.areaPrincipal);
      setCourses(response.courses);
    } catch {
      setErrorMessage(loadErrorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} color="#036564" />;
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void loadRecommendations();
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Tentar Novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (!hasDiagnosis) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>
            Descubra seu perfil na tecnologia para receber indicações personalizadas
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Quiz")}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Fazer Teste Vocacional</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <XpProgressBar />
      {/* Topo Fixo e Compacto */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.logo}>CONNECTADEV</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>◯</Text>
        </View>
      </View>

      {/* Lista com o título dentro do ListHeaderComponent (rola junto) */}
      <FlatList
        data={courses}
        keyExtractor={(course) => course.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.titleSection}>
            <Text style={styles.matchBadge}>✪ SEU MATCH PERFEITO</Text>
            <Text style={styles.heading}>Cursos sugeridos para o seu perfil</Text>
            <Text style={styles.subtitle}>
              Selecionamos {courses.length} curso{courses.length === 1 ? "" : "s"} com base em{" "}
              {areaPrincipal || "suas preferências"}.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              accessibilityLabel={`Abrir curso ${item.title}`}
              accessibilityRole="button"
              onPress={() => {
                void openCourse(item.external_url);
              }}
            >
              <View style={styles.banner}>
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                <Text style={styles.matchOverlay}>👍 MATCH</Text>
                <Text style={styles.providerOverlay}>{item.provider}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.category}>
                  {item.tags.slice(0, 2).join(" & ").toUpperCase()}
                </Text>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.metaChips}>
                  <Text style={styles.metaChip}>📊 {item.level}</Text>
                  <Text style={styles.metaChip}>🎓 Curso gratuito</Text>
                </View>
                <Text style={styles.tags}>{item.tags.join(" • ")}</Text>
                {item.userRating && (
                  <Text style={styles.ratingStatus}>★ Avaliado por você: {item.userRating.rating}/5</Text>
                )}
                <Text style={styles.ctaText}>Começar Curso Grátis  →</Text>
                <Pressable
                  accessibilityLabel={`Fazer revisão com IA do curso ${item.title}`}
                  accessibilityRole="button"
                  onPress={(e) => {
                    e.stopPropagation?.();
                    navigation.navigate("KnowledgeReview", {
                      topicId: `course-topic-${item.id}`,
                      topicTitle: `Revisão: ${item.title}`,
                    });
                  }}
                  style={styles.aiReviewButton}
                >
                  <Text style={styles.aiReviewButtonText}>Fazer Revisão com IA (até +50 XP) 🧠</Text>
                </Pressable>
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel={`Avaliar curso ${item.title}`}
              accessibilityRole="button"
              disabled={isRating}
              onPress={() => {
                if (!isRating) setRatingCourse(item);
              }}
              style={[styles.ratingButton, isRating && styles.disabledButton]}
            >
              <Text style={styles.ratingButtonText}>★ Avaliar Curso</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={
                savedCourseIds.has(item.id)
                  ? `Curso ${item.title} salvo`
                  : `Salvar curso ${item.title}`
              }
              accessibilityRole="button"
              disabled={savingCourseId === item.id}
              onPress={() => {
                void saveCourse(item.id);
              }}
              style={styles.bookmarkButton}
            >
              <Text
                style={[
                  styles.bookmarkIcon,
                  savedCourseIds.has(item.id) && styles.bookmarkIconActive,
                ]}
              >
                🔖
              </Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum curso recomendado disponível.</Text>
        }
      />
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={
          toastMessage === "Curso salvo nos seus favoritos!" ||
          toastMessage === "Sua avaliação foi atualizada com sucesso!" ||
          toastMessage ===
            "Obrigado pelo seu feedback! Ele ajuda a calibrar suas recomendações"
            ? "success"
            : "error"
        }
        onDismiss={() => setToastVisible(false)}
      />
      <CourseRatingModal
        visible={ratingCourse !== null}
        courseTitle={ratingCourse?.title || ""}
        initialRating={ratingCourse?.userRating?.rating}
        initialComment={ratingCourse?.userRating?.comment}
        initialMatchedProfile={ratingCourse?.userRating?.matchedProfile}
        isEditing={Boolean(ratingCourse?.userRating)}
        isSubmitting={isRating}
        onClose={() => {
          if (!isRating) setRatingCourse(null);
        }}
        onSubmit={(rating, comment, matchedProfile) => {
          void submitRating(rating, comment, matchedProfile);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F8F5",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    height: 32,
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerButton: {
    padding: 2,
    width: 28,
  },
  headerButtonText: {
    color: "#033649",
    fontSize: 22,
    lineHeight: 22,
  },
  logo: {
    color: "#036564",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#036564",
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  titleSection: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 12,
  },
  matchBadge: {
    backgroundColor: "#E5F1F7",
    borderRadius: 999,
    color: "#033649",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heading: {
    color: "#031634",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  subtitle: {
    color: "#60717A",
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    elevation: 2,
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  banner: {
    height: 150,
    position: "relative",
  },
  thumbnail: {
    height: "100%",
    width: "100%",
  },
  matchOverlay: {
    backgroundColor: "#036564",
    borderRadius: 999,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    left: 10,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: "absolute",
    top: 10,
  },
  providerOverlay: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    bottom: 10,
    color: "#033649",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: 10,
  },
  cardContent: {
    padding: 14,
  },
  category: {
    color: "#60717A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    color: "#031634",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  metaChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  metaChip: {
    backgroundColor: "#F2EEE5",
    borderRadius: 999,
    color: "#033649",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tags: {
    color: "#036564",
    fontSize: 11,
    marginTop: 8,
  },
  ctaText: {
    backgroundColor: "#036564",
    borderRadius: 10,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 12,
    padding: 11,
    textAlign: "center",
  },
  aiReviewButton: {
    backgroundColor: "#F0FDFA",
    borderColor: "#036564",
    borderWidth: 1.5,
    borderRadius: 10,
    marginTop: 8,
    padding: 10,
    alignItems: "center",
  },
  aiReviewButtonText: {
    color: "#036564",
    fontSize: 13,
    fontWeight: "700",
  },
  ratingButton: {
    alignSelf: "flex-start",
    marginLeft: 14,
    marginBottom: 10,
    paddingVertical: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  ratingButtonText: {
    color: "#B46B00",
    fontSize: 12,
    fontWeight: "800",
  },
  ratingStatus: {
    color: "#B46B00",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  bookmarkButton: {
    padding: 8,
    position: "absolute",
    right: 8,
    top: 8,
  },
  bookmarkIcon: {
    fontSize: 20,
    opacity: 0.45,
  },
  bookmarkIconActive: {
    opacity: 1,
  },
  empty: {
    color: "#60717A",
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    color: "#8B1E1E",
    textAlign: "center",
    fontSize: 16,
  },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8DDCB",
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    width: "100%",
  },
  emptyStateTitle: {
    color: "#033649",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
    textAlign: "center",
  },
  primaryButton: {
    alignSelf: "center",
    backgroundColor: "#036564",
    borderRadius: 8,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
