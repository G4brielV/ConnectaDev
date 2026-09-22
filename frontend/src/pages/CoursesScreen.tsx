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
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  bookmarkCourse,
  fetchCourseRecommendations,
  CourseRecommendation,
} from "../shared/api/coursesApi";
import { useAuth } from "../entities/session";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { Toast } from "../shared/ui/Toast";

export function CoursesScreen() {
  const { token } = useAuth();
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
  const loadErrorMessage =
    "Não foi possível carregar suas recomendações no momento";

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
                <Text style={styles.ctaText}>Começar Curso Grátis  →</Text>
              </View>
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
          toastMessage === "Curso salvo nos seus favoritos!" ? "success" : "error"
        }
        onDismiss={() => setToastVisible(false)}
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
