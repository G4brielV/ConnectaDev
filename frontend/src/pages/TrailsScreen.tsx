import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../entities/session";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { fetchTrailRecommendations, TrailRecommendation } from "../shared/api/trailsApi";
import { XpProgressBar } from "../shared/ui/XpProgressBar/XpProgressBar";

export function TrailsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Trails">>();
  const [trails, setTrails] = useState<TrailRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTrails = useCallback(async (): Promise<void> => {
    if (!token) return;
    setIsLoading(true);
    try {
      setTrails(await fetchTrailRecommendations(token));
      setErrorMessage(null);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar suas trilhas.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTrails();
  }, [loadTrails]);

  if (isLoading) return <ActivityIndicator style={styles.centered} color="#036564" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <XpProgressBar />
      <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
        <Text style={styles.back}>‹ Voltar</Text>
      </Pressable>
      <Text style={styles.eyebrow}>TRILHAS PERSONALIZADAS</Text>
      <Text style={styles.title}>Seu próximo passo na tecnologia</Text>
      <Text style={styles.subtitle}>Selecionamos até 3 trilhas com base na sua área principal do Quiz Vocacional.</Text>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      {!errorMessage && trails.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhuma trilha disponível para seu perfil.</Text>
          <Text style={styles.emptyText}>Conclua o Quiz Vocacional ou aguarde novas trilhas da sua área.</Text>
        </View>
      ) : null}
      {trails.map((trail) => (
        <View key={trail.id} style={styles.card}>
          <Text style={styles.area}>{trail.area ?? "TRILHA CONNECTADEV"}</Text>
          <Text style={styles.cardTitle}>{trail.title}</Text>
          {trail.description ? <Text style={styles.description}>{trail.description}</Text> : null}
          {trail.lessons.map((lesson) => (
            <Pressable
              accessibilityRole="button"
              key={lesson.id}
              onPress={() => navigation.navigate("TrailLesson", { lessonId: lesson.id })}
              style={styles.lesson}
            >
              <View>
                <Text style={styles.lessonTitle}>Lição {lesson.sequence}: {lesson.title}</Text>
                <Text style={styles.lessonMeta}>{lesson.questions.length} perguntas · +{lesson.xpReward} XP</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F9F8F5", flexGrow: 1, gap: 14, padding: 20 },
  centered: { flex: 1 },
  back: { color: "#036564", fontSize: 15, fontWeight: "700" },
  eyebrow: { color: "#B46B00", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#031634", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#60717A", fontSize: 14, lineHeight: 20 },
  error: { color: "#B13A24", fontSize: 14 },
  empty: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 18 },
  emptyTitle: { color: "#031634", fontSize: 16, fontWeight: "800" },
  emptyText: { color: "#60717A", marginTop: 6 },
  card: { backgroundColor: "#FFFFFF", borderColor: "#E8DDCB", borderRadius: 12, borderWidth: 1, padding: 16 },
  area: { color: "#036564", fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  cardTitle: { color: "#031634", fontSize: 20, fontWeight: "800", marginTop: 6 },
  description: { color: "#60717A", lineHeight: 19, marginTop: 6 },
  lesson: { alignItems: "center", borderTopColor: "#E8DDCB", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingTop: 14 },
  lessonTitle: { color: "#033649", fontSize: 14, fontWeight: "700" },
  lessonMeta: { color: "#B46B00", fontSize: 12, marginTop: 4 },
  arrow: { color: "#036564", fontSize: 28 },
});
