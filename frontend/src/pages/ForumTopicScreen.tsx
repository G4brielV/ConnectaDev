import { useCallback, useState } from "react";
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
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { useAuth } from "../entities/session";
import { fetchForumPosts, ForumPost, ForumReactionValue, reactToForumPost } from "../shared/api/forumApi";
import type { RootStackParamList } from "../app/navigation/RootNavigator";

function truncateContent(content: string, maxLength = 140): string {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength).trimEnd()}...`;
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
  const [reactingPostId, setReactingPostId] = useState<string | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts]),
  );

  async function handleReaction(postId: string, value: ForumReactionValue): Promise<void> {
    if (!token || reactingPostId) return;

    setReactingPostId(postId);
    try {
      const reaction = await reactToForumPost(token, postId, value);
      setPosts((current) => current.map((post) => post.id === postId
        ? { ...post, reactionCounts: { likes: reaction.likes, dislikes: reaction.dislikes } }
        : post));
    } finally {
      setReactingPostId(null);
    }
  }

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
          <View style={styles.postCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir post ${item.title}`}
              onPress={() => navigation.navigate("ForumPost", { postId: item.id, topicTitle })}
              style={({ pressed }) => [styles.postContentPressable, pressed && styles.postCardPressed]}
            >
              <Text style={styles.author}>{item.author.name || "Usuário ConnectaDev"}</Text>
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postContent}>{truncateContent(item.content)}</Text>
            </Pressable>
            <View style={styles.postMeta}>
              <Pressable
                accessibilityLabel={`Curtir post. ${item.reactionCounts.likes} curtidas`}
                accessibilityRole="button"
                disabled={reactingPostId !== null}
                onPress={() => void handleReaction(item.id, "LIKE")}
                style={styles.reactionButton}
              >
                <Text style={styles.reactionIcon}>👍</Text>
                <Text style={styles.metaText}>{item.reactionCounts.likes}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Não curtir post. ${item.reactionCounts.dislikes} avaliações negativas`}
                accessibilityRole="button"
                disabled={reactingPostId !== null}
                onPress={() => void handleReaction(item.id, "DISLIKE")}
                style={styles.reactionButton}
              >
                <Text style={styles.reactionIcon}>👎</Text>
                <Text style={styles.metaText}>{item.reactionCounts.dislikes}</Text>
              </Pressable>
              <View accessibilityLabel={`${item._count.comments} comentários`} style={styles.commentCount}>
                <Text style={styles.commentIcon}>💬</Text>
                <Text style={styles.metaText}>{item._count.comments}</Text>
              </View>
            </View>
          </View>
        )}
      />
      <View pointerEvents="box-none" style={styles.createDock}>
        <Pressable
          accessibilityLabel="Criar novo post"
          accessibilityRole="button"
          onPress={() => navigation.navigate("ForumCreatePost", { topicSlug, topicTitle })}
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
  listContent: { padding: 20, paddingBottom: 96 },
  header: { marginBottom: 20 },
  backText: { color: "#036564", fontSize: 14, fontWeight: "700", marginBottom: 18 },
  title: { color: "#0F172A", fontSize: 26, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#64748B", fontSize: 14, lineHeight: 20 },
  postCard: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: 16, borderWidth: 1, elevation: 2, marginBottom: 12, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  postContentPressable: { padding: 18 },
  postCardPressed: { backgroundColor: "#F0FDFA" },
  postTitle: { color: "#0F172A", fontSize: 17, fontWeight: "700", lineHeight: 23 },
  postContent: { color: "#64748B", fontSize: 13, lineHeight: 19, marginTop: 8 },
  postMeta: { alignItems: "center", borderTopColor: "#E2E8F0", borderTopWidth: 1, flexDirection: "row", gap: 14, paddingHorizontal: 18, paddingVertical: 10 },
  reactionButton: { alignItems: "center", flexDirection: "row", gap: 4 },
  reactionIcon: { fontSize: 14 },
  commentCount: { alignItems: "center", flexDirection: "row", gap: 5 },
  commentIcon: { fontSize: 14 },
  author: { color: "#32504C", fontSize: 13, fontWeight: "700", marginBottom: 6 },
  metaText: { color: "#64748B", fontSize: 12, marginTop: 4 },
  centered: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  errorText: { color: "#8B3434", fontSize: 15, lineHeight: 22, marginBottom: 16, textAlign: "center" },
  primaryButton: { backgroundColor: "#036564", borderRadius: 10, paddingHorizontal: 18, paddingVertical: 14 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyTitle: { color: "#0F172A", fontSize: 17, fontWeight: "700" },
  emptyText: { color: "#64748B", fontSize: 14, lineHeight: 21, marginTop: 6, textAlign: "center" },
  footerLoader: { marginVertical: 16 },
  createDock: { bottom: 16, position: "absolute", right: 20 },
  createButton: { alignItems: "center", backgroundColor: "#036564", borderRadius: 999, height: 50, justifyContent: "center", width: 50 },
  createButtonPressed: { opacity: 0.82 },
  createButtonText: { color: "#FFFFFF", fontSize: 26, fontWeight: "300", includeFontPadding: false, lineHeight: 30, textAlign: "center", textAlignVertical: "center", transform: [{ translateY: -2 }] },
});