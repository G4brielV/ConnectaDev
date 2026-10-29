import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../entities/session";
import { fetchForumTopics, ForumTopic } from "../shared/api/forumApi";
import type { RootStackParamList } from "../app/navigation/RootNavigator";

export function ForumScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTopics = useCallback(async (refresh = false): Promise<void> => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      setTopics(await fetchForumTopics(token));
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar os tópicos.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  if (isLoading) {
    return <ActivityIndicator style={styles.centered} color="#036564" />;
  }

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Pressable accessibilityRole="button" onPress={() => void loadTopics()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={topics}
        keyExtractor={(topic) => topic.slug}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadTopics(true)} tintColor="#036564" />}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>COMUNIDADE CONNECTADEV</Text>
              <Text style={styles.title}>Fórum</Text>
              <Text style={styles.subtitle}>Encontre conversas sobre tecnologia, carreira e aprendizado.</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nenhum tópico disponível</Text>
            <Text style={styles.emptyText}>Tente novamente mais tarde.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir tópico ${item.title}`}
            onPress={() => navigation.navigate("ForumTopic", { topicSlug: item.slug, topicTitle: item.title })}
            style={({ pressed }) => [styles.topicRow, pressed && styles.topicRowPressed]}
          >
            <View style={styles.topicContent}>
              <Text style={styles.topicTitle}>{item.title}</Text>
              <Text style={styles.topicAction}>Explorar conversas</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
      <View pointerEvents="box-none" style={styles.createDock}>
        <Pressable
          accessibilityLabel="Criar novo post"
          accessibilityRole="button"
          onPress={() => navigation.navigate("ForumCreatePost")}
          style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
        >
          <Text style={styles.createButtonText}>+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  listContent: { paddingBottom: 96 },
  headerRow: { alignItems: "center", flexDirection: "row", paddingHorizontal: 20, paddingTop: 20 },
  header: { flex: 1, marginBottom: 20, paddingRight: 16 },
  eyebrow: { alignSelf: "flex-start", backgroundColor: "#E0F2F1", borderRadius: 999, color: "#036564", fontSize: 11, fontWeight: "800", marginBottom: 8, paddingHorizontal: 10, paddingVertical: 4, textTransform: "uppercase" },
  title: { color: "#0F172A", fontSize: 26, fontWeight: "800", marginBottom: 8 },
  createDock: { bottom: 16, position: "absolute", right: 20 },
  createButton: { alignItems: "center", backgroundColor: "#036564", borderRadius: 999, height: 50, justifyContent: "center", width: 50 },
  createButtonPressed: { opacity: 0.82 },
  createButtonText: { color: "#FFFFFF", fontSize: 26, fontWeight: "300", includeFontPadding: false, lineHeight: 30, textAlign: "center", textAlignVertical: "center", transform: [{ translateY: -2 }] },
  subtitle: { color: "#64748B", fontSize: 14, lineHeight: 20 },
  topicRow: { alignItems: "center", borderBottomColor: "#E2E8F0", borderBottomWidth: 1, flexDirection: "row", minHeight: 76, paddingHorizontal: 20, paddingVertical: 14 },
  topicRowPressed: { backgroundColor: "#F0FDFA" },
  topicContent: { flex: 1 },
  topicTitle: { color: "#0F172A", fontSize: 15, fontWeight: "700" },
  topicAction: { color: "#64748B", fontSize: 13, marginTop: 4 },
  chevron: { color: "#036564", fontSize: 24, fontWeight: "300", marginLeft: 12 },
  centered: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  errorText: { color: "#8B3434", fontSize: 15, lineHeight: 22, marginBottom: 16, textAlign: "center" },
  primaryButton: { backgroundColor: "#036564", borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyTitle: { color: "#0F172A", fontSize: 17, fontWeight: "700" },
  emptyText: { color: "#64748B", fontSize: 14, marginTop: 6 },
});
