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
  Alert,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../entities/session";
import { fetchForumPosts, ForumPost, ForumReactionValue, ForumVoteType, removeForumPostVote, voteForumPost, ForumApiError } from "../shared/api/forumApi";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { colors, fonts, radius, shadow, spacing } from "../shared/config/theme";

function truncateContent(content: string, maxLength = 140): string {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength).trimEnd()}...`;
}

export function ForumTopicScreen() {
  const { token } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, "ForumTopic">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { topicId, topicTitle } = route.params;
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
      const response = await fetchForumPosts(token, topicId, nextPage);
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
  }, [token, topicId]);

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts]),
  );

  async function handleReaction(postId: string, value: ForumReactionValue): Promise<void> {
    if (!token) {
      Alert.alert("Login necessário", "Entre na sua conta para avaliar uma postagem.");
      return;
    }
    if (reactingPostId) return;

    setReactingPostId(postId);
    try {
      const post = posts.find((item) => item.id === postId);
      const currentVote = post?.myReaction === "LIKE" ? "UPVOTE" : post?.myReaction === "DISLIKE" ? "DOWNVOTE" : null;
      const vote = value === "LIKE" ? "UPVOTE" : "DOWNVOTE";
      const reaction = currentVote === vote
        ? await removeForumPostVote(token, postId)
        : await voteForumPost(token, postId, vote as ForumVoteType);
      setPosts((current) => current.map((post) => post.id === postId
        ? { ...post, reactionCounts: { likes: reaction.upvotes, dislikes: reaction.downvotes }, myReaction: reaction.myVote === "UPVOTE" ? "LIKE" : reaction.myVote === "DOWNVOTE" ? "DISLIKE" : null }
        : post));
    } catch (error: unknown) {
      if (error instanceof ForumApiError && error.status === 401) {
        Alert.alert("Sessão expirada", "Faça login novamente para avaliar uma postagem.");
      }
    } finally {
      setReactingPostId(null);
    }
  }

  if (isLoading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Carregando posts...</Text></View>;

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
              <View style={styles.backRow}><Feather name="arrow-left" size={16} color={colors.primary} /><Text style={styles.backText}>Tópicos</Text></View>
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
              {item.tags.length > 0 ? (
                <View style={styles.tagsRow}>
                  {item.tags.map((tag) => <Text key={tag} style={styles.tagBadge}>{tag}</Text>)}
                </View>
              ) : null}
            </Pressable>
            <View style={styles.postMeta}>
              <Pressable
                accessibilityLabel={`Curtir post. ${item.reactionCounts.likes} curtidas`}
                accessibilityRole="button"
                disabled={reactingPostId !== null}
                onPress={() => void handleReaction(item.id, "LIKE")}
                style={[styles.reactionButton, item.myReaction === "LIKE" && styles.reactionButtonActive]}
              >
                <Feather name="thumbs-up" size={15} color={item.myReaction === "LIKE" ? colors.primary : colors.textMuted} />
                <Text style={styles.metaText}>{item.reactionCounts.likes}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Não curtir post. ${item.reactionCounts.dislikes} avaliações negativas`}
                accessibilityRole="button"
                disabled={reactingPostId !== null}
                onPress={() => void handleReaction(item.id, "DISLIKE")}
                style={[styles.reactionButton, item.myReaction === "DISLIKE" && styles.reactionButtonActive]}
              >
                <Feather name="thumbs-down" size={15} color={item.myReaction === "DISLIKE" ? colors.primary : colors.textMuted} />
                <Text style={styles.metaText}>{item.reactionCounts.dislikes}</Text>
              </Pressable>
              <View accessibilityLabel={`${item._count.comments} comentários`} style={styles.commentCount}>
                <Feather name="message-circle" size={14} color={colors.textMuted} />
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
          onPress={() => navigation.navigate("ForumCreatePost", { topicId, topicTitle })}
          style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
        >
          <Feather name="plus" size={24} color={colors.textOnPrimary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  listContent: { padding: spacing.lg, paddingBottom: 104 },
  header: { marginBottom: spacing.md },
  backRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs, marginBottom: spacing.md },
  backText: { color: colors.primary, fontFamily: fonts.sans.semiBold, fontSize: 14 },
  title: { color: colors.textPrimary, fontFamily: fonts.sans.bold, fontSize: 26, marginBottom: spacing.sm },
  subtitle: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 14, lineHeight: 20 },
  postCard: { backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.sm, overflow: "hidden", ...shadow.card },
  postContentPressable: { padding: 18 },
  postCardPressed: { backgroundColor: colors.creamSoft },
  postTitle: { color: colors.textPrimary, fontFamily: fonts.sans.semiBold, fontSize: 17, lineHeight: 23 },
  postContent: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tagBadge: { backgroundColor: colors.creamSoft, borderRadius: radius.pill, color: colors.primary, fontFamily: fonts.sans.semiBold, fontSize: 11, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  postMeta: { alignItems: "center", borderTopColor: "#E2E8F0", borderTopWidth: 1, flexDirection: "row", gap: 14, paddingHorizontal: 18, paddingVertical: 10 },
  reactionButton: { alignItems: "center", flexDirection: "row", gap: 4 },
  reactionButtonActive: { opacity: 1 },
  reactionIcon: { color: "#94A3B8", fontSize: 14 },
  reactionIconActive: { color: "#036564" },
  commentCount: { alignItems: "center", flexDirection: "row", gap: 5 },
  commentIcon: { fontSize: 14 },
  author: { color: colors.secondary, fontFamily: fonts.sans.semiBold, fontSize: 13, marginBottom: spacing.xs },
  metaText: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 12, marginTop: spacing.xs },
  centered: { alignItems: "center", backgroundColor: colors.canvas, flex: 1, justifyContent: "center", padding: spacing.lg },
  loadingText: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 13, marginTop: spacing.sm },
  errorText: { color: "#8B3434", fontSize: 15, lineHeight: 22, marginBottom: 16, textAlign: "center" },
  primaryButton: { backgroundColor: "#036564", borderRadius: 10, paddingHorizontal: 18, paddingVertical: 14 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyTitle: { color: "#0F172A", fontSize: 17, fontWeight: "700" },
  emptyText: { color: "#64748B", fontSize: 14, lineHeight: 21, marginTop: 6, textAlign: "center" },
  footerLoader: { marginVertical: 16 },
  createDock: { bottom: spacing.md, position: "absolute", right: spacing.md },
  createButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.pill, height: 54, justifyContent: "center", width: 54, ...shadow.card },
  createButtonPressed: { opacity: 0.82 },
  createButtonText: { color: "#FFFFFF", fontSize: 26, fontWeight: "300", includeFontPadding: false, lineHeight: 30, textAlign: "center", textAlignVertical: "center", transform: [{ translateY: -2 }] },
});