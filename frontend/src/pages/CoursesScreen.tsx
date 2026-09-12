import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!token) return;
    fetchCourseRecommendations(token)
      .then((response) => {
        setHasDiagnosis(response.hasDiagnosis);
        setAreaPrincipal(response.areaPrincipal);
        setCourses(response.courses);
      })
      .catch((error: unknown) => {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os cursos recomendados.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} color="#036564" />;
  }

  if (errorMessage) {
    return <Text style={styles.centered}>{errorMessage}</Text>;
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
      <Text style={styles.heading}>
        Cursos recomendados para o seu perfil: {areaPrincipal || "seu perfil"}
      </Text>
      <FlatList
        data={courses}
        keyExtractor={(course) => course.id}
        renderItem={({ item }) => (
          <Pressable
            accessibilityLabel={`Abrir curso ${item.title}`}
            accessibilityRole="button"
            onPress={() => {
              void openCourse(item.external_url);
            }}
            style={styles.card}
          >
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.provider} • {item.level}</Text>
            <Text style={styles.tags}>{item.tags.join(" • ")}</Text>
            <Pressable
              accessibilityLabel={
                savedCourseIds.has(item.id)
                  ? `Curso ${item.title} salvo`
                  : `Salvar curso ${item.title}`
              }
              accessibilityRole="button"
              disabled={savingCourseId === item.id}
              onPress={(event) => {
                event.stopPropagation();
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
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum curso recomendado disponível.</Text>}
      />
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastMessage === "Curso salvo nos seus favoritos!" ? "success" : "error"}
        onDismiss={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F8F5", padding: 24, paddingTop: 56 },
  centered: { flex: 1, textAlign: "center", textAlignVertical: "center", padding: 24 },
  heading: { color: "#033649", fontSize: 22, fontWeight: "700", marginBottom: 20 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 16, overflow: "hidden", paddingBottom: 16 },
  thumbnail: { height: 160, width: "100%" },
  title: { color: "#031634", fontSize: 17, fontWeight: "700", padding: 16, paddingBottom: 6 },
  meta: { color: "#60717A", paddingHorizontal: 16 },
  tags: { color: "#036564", fontSize: 12, padding: 16, paddingBottom: 0 },
  bookmarkButton: { alignSelf: "flex-end", padding: 12 },
  bookmarkIcon: { fontSize: 24, opacity: 0.45 },
  bookmarkIconActive: { opacity: 1 },
  empty: { color: "#60717A", textAlign: "center" },
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
