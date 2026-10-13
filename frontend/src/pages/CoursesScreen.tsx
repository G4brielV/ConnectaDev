import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
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
import { CourseCard } from "../features/courses/ui/CourseCard";
import { userInitials } from "../features/courses/lib/courseCardView";
import { useGamification } from "../entities/gamification";
import { XpProgressBar } from "../shared/ui/XpProgressBar/XpProgressBar";
import { colors, fonts, radius, shadow, chunky } from "../shared/config/theme";

function CoursesScreenContent() {
  const { token, user } = useAuth();
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

  // Pela aba não há para onde voltar; pelo "Meus cursos" do Perfil, há.
  const canGoBack = navigation.canGoBack();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Feather name="wifi-off" size={28} color={colors.textMuted} />
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void loadRecommendations();
          }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryButtonText}>Tentar Novamente</Text>
        </Pressable>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.backLink}
            hitSlop={8}
          >
            <Text style={styles.backLinkText}>Voltar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (!hasDiagnosis) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyStateIcon}>
            <Feather name="compass" size={26} color={colors.primary} />
          </View>
          <Text style={styles.emptyStateTitle}>
            Descubra seu perfil na tecnologia para receber indicações personalizadas
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Quiz")}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonText}>Fazer Teste Vocacional</Text>
          </Pressable>
          {canGoBack ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              style={styles.backLink}
              hitSlop={8}
            >
              <Text style={styles.backLinkText}>Voltar</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(course) => course.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <XpProgressBar />

            <View style={styles.navBar}>
              {canGoBack ? (
                <Pressable
                  accessibilityLabel="Voltar"
                  accessibilityRole="button"
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                  hitSlop={6}
                >
                  <Feather name="chevron-left" size={20} color={colors.textPrimary} />
                </Pressable>
              ) : (
                <View style={styles.navSpacer} />
              )}
              <View style={styles.brand}>
                <View style={styles.brandDot} />
                <Text style={styles.brandText}>CONNECTADEV</Text>
              </View>
              <Pressable
                accessibilityLabel="Meu Perfil"
                accessibilityRole="button"
                onPress={() => navigation.navigate("Home", { tab: "profile" })}
                style={styles.avatar}
                hitSlop={6}
              >
                <Text style={styles.avatarText}>{userInitials(user?.name, user?.email)}</Text>
                <View style={styles.onlineDot} />
              </Pressable>
            </View>

            <View style={styles.titleSection}>
              <View style={styles.sectionPill}>
                <Text style={styles.sectionPillText}>Recomendados para Você</Text>
              </View>
              <Text style={styles.subtitle}>
                {courses.length} curso{courses.length === 1 ? "" : "s"} selecionado
                {courses.length === 1 ? "" : "s"} para {areaPrincipal || "suas preferências"}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <CourseCard
            course={item}
            featured={index === 0}
            areaLabel={areaPrincipal}
            saved={savedCourseIds.has(item.id)}
            saving={savingCourseId === item.id}
            ratingDisabled={isRating}
            onOpen={() => {
              void openCourse(item.external_url);
            }}
            onReview={() =>
              navigation.navigate("KnowledgeReview", {
                topicId: `course-topic-${item.id}`,
                topicTitle: `Revisão: ${item.title}`,
              })
            }
            onRate={() => {
              if (!isRating) setRatingCourse(item);
            }}
            onSave={() => {
              void saveCourse(item.id);
            }}
          />
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

export function CoursesScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <CoursesScreenContent />
    </SafeAreaView>
  );
}

// Layout da tela "Cursos Recomendados - ConnectaDev" do Stitch (sem as abas
// "Em andamento" e "Concluídos", que ainda não têm dados).
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  container: { flex: 1, backgroundColor: colors.canvas },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  listContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },
  listHeader: { gap: 12, marginBottom: 16 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
  },
  navSpacer: { width: 36 },
  brand: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  brandText: {
    fontFamily: fonts.sans.extraBold,
    fontSize: 14,
    letterSpacing: 2.4,
    color: colors.primary,
  },
  avatar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarText: { fontFamily: fonts.sans.semiBold, fontSize: 12, color: colors.textOnPrimary },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  titleSection: { gap: 8 },
  sectionPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionPillText: { fontFamily: fonts.sans.bold, fontSize: 12, color: colors.textOnPrimary },
  subtitle: { fontFamily: fonts.sans.regular, fontSize: 13, color: colors.textMuted },
  empty: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    fontFamily: fonts.sans.medium,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyStateCard: {
    alignItems: "center",
    gap: 12,
    width: "100%",
    backgroundColor: colors.surface,
    borderColor: colors.light,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 24,
    ...shadow.card,
  },
  emptyStateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.creamSoft,
  },
  emptyStateTitle: {
    fontFamily: fonts.sans.bold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.secondary,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderBottomWidth: chunky.ctaDepth,
    borderBottomColor: colors.primaryDeepest,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonPressed: { borderBottomWidth: chunky.pressedDepth, transform: [{ translateY: 2 }] },
  primaryButtonText: { fontFamily: fonts.sans.bold, fontSize: 14, color: colors.textOnPrimary },
  backLink: { paddingVertical: 8 },
  backLinkText: { fontFamily: fonts.sans.semiBold, fontSize: 14, color: colors.textMuted },
});
