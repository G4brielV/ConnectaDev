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
    backgroundColor: "#F5F7F6",
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 22,
  },
  eyebrow: {
    color: "#036564",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: "#183B3A",
    fontSize: 32,
    fontWeight: "800",
  },
  subtitle: {
    color: "#61716F",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  topicCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DCE7E3",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    minHeight: 82,
    paddingHorizontal: 16,
  },
  topicCardPressed: {
    backgroundColor: "#EEF6F3",
  },
  topicIcon: {
    alignItems: "center",
    backgroundColor: "#E2F0EC",
    borderRadius: 10,
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
    color: "#183B3A",
    fontSize: 16,
    fontWeight: "700",
  },
  topicAction: {
    color: "#71817E",
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
