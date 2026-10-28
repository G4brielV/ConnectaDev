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
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useAuth } from "../entities/session";
import { fetchForumPosts, ForumPost } from "../shared/api/forumApi";
import type { RootStackParamList } from "../app/navigation/RootNavigator";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

export function ForumTopicScreen() {
  const { token } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, "ForumTopic">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { topicSlug, topicTitle } = route.params;
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPosts = useCallback(async (nextPage = 1, refresh = false): Promise<void> => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (refresh) setIsRefreshing(true);
    else if (nextPage === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    setErrorMessage(null);

    try {
      const response = await fetchForumPosts(token, topicSlug, nextPage);
      setPosts((current) => nextPage === 1 ? response.data : [...current, ...response.data]);
      setPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar os posts.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [token, topicSlug]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  if (isLoading) return <ActivityIndicator style={styles.centered} color="#036564" />;

  if (errorMessage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Pressable accessibilityRole="button" onPress={() => void loadPosts()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadPosts(1, true)} tintColor="#036564" />}
        onEndReached={() => {
          if (!isLoadingMore && page < totalPages) void loadPosts(page + 1);
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable accessibilityLabel="Voltar para os tópicos" accessibilityRole="button" onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>‹ Tópicos</Text>
            </Pressable>
            <Text style={styles.title}>{topicTitle}</Text>
            <Text style={styles.subtitle}>Posts mais recentes da comunidade.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Ainda não há posts</Text>
            <Text style={styles.emptyText}>Este tópico ainda não tem nenhuma conversa publicada.</Text>
          </View>
        }
        ListFooterComponent={isLoadingMore ? <ActivityIndicator color="#036564" style={styles.footerLoader} /> : null}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir post ${item.title}`}
            onPress={() => navigation.navigate("ForumPost", { postId: item.id, topicTitle })}
            style={({ pressed }) => [styles.postCard, pressed && styles.postCardPressed]}
          >
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text numberOfLines={3} style={styles.postContent}>{item.content}</Text>
            <View style={styles.postMeta}>
              <Text style={styles.author}>{item.author.name || "Usuário ConnectaDev"}</Text>
              <Text style={styles.metaText}>{formatDate(item.createdAt)} · {item._count.comments} comentário{item._count.comments === 1 ? "" : "s"}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7F6" },
  listContent: { padding: 20, paddingBottom: 32 },
  header: { marginBottom: 20 },
  backText: { color: "#036564", fontSize: 15, fontWeight: "700", marginBottom: 18 },
  title: { color: "#183B3A", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#61716F", fontSize: 14, marginTop: 6 },
  postCard: { backgroundColor: "#FFFFFF", borderColor: "#DCE7E3", borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 16 },
  postCardPressed: { backgroundColor: "#EEF6F3" },
  postTitle: { color: "#183B3A", fontSize: 17, fontWeight: "800", lineHeight: 23 },
  postContent: { color: "#50615E", fontSize: 14, lineHeight: 21, marginTop: 8 },
  postMeta: { borderTopColor: "#E8EFEC", borderTopWidth: 1, marginTop: 14, paddingTop: 10 },
  author: { color: "#036564", fontSize: 13, fontWeight: "700" },
  metaText: { color: "#7A8986", fontSize: 12, marginTop: 4 },
  centered: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  errorText: { color: "#8B3434", fontSize: 15, lineHeight: 22, marginBottom: 16, textAlign: "center" },
  primaryButton: { backgroundColor: "#036564", borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyTitle: { color: "#183B3A", fontSize: 17, fontWeight: "700" },
  emptyText: { color: "#61716F", fontSize: 14, lineHeight: 21, marginTop: 6, textAlign: "center" },
  footerLoader: { marginVertical: 16 },
});