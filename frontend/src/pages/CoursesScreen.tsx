import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchCourseRecommendations, CourseRecommendation } from "../shared/api/coursesApi";
import { useAuth } from "../entities/session";

export function CoursesScreen() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [areaPrincipal, setAreaPrincipal] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchCourseRecommendations(token)
      .then((response) => {
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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Cursos recomendados para o seu perfil: {areaPrincipal || "seu perfil"}
      </Text>
      <FlatList
        data={courses}
        keyExtractor={(course) => course.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.provider} • {item.level}</Text>
            <Text style={styles.tags}>{item.tags.join(" • ")}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum curso recomendado disponível.</Text>}
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
  empty: { color: "#60717A", textAlign: "center" },
});
