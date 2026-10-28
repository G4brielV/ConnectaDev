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
          <View style={styles.header}>
            <Text style={styles.eyebrow}>COMUNIDADE CONNECTADEV</Text>
            <Text style={styles.title}>Fórum</Text>
            <Text style={styles.subtitle}>Encontre conversas sobre tecnologia, carreira e aprendizado.</Text>
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
            style={({ pressed }) => [styles.topicCard, pressed && styles.topicCardPressed]}
          >
            <View style={styles.topicIcon}><Text style={styles.topicIconText}>#</Text></View>
            <View style={styles.topicContent}>
              <Text style={styles.topicTitle}>{item.title}</Text>
              <Text style={styles.topicAction}>Ver posts</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2F1",
    borderRadius: 999,
    color: "#036564",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  title: {
    color: "#0F172A",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
  },
  topicCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    marginBottom: 12,
    minHeight: 82,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  topicCardPressed: {
    backgroundColor: "#F0FDFA",
  },
  topicIcon: {
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  topicIconText: {
    color: "#036564",
    fontSize: 23,
    fontWeight: "700",
  },
  topicContent: {
    flex: 1,
    marginLeft: 14,
  },
  topicTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  topicAction: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 5,
  },
  chevron: {
    color: "#036564",
    fontSize: 28,
    fontWeight: "300",
    marginLeft: 12,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: "#8B3434",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#036564",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    color: "#183B3A",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: "#61716F",
    fontSize: 14,
    marginTop: 6,
  },
});
