import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../entities/session";
import {
  fetchForumPosts,
  ForumApiError,
  ForumPost,
  ForumReactionValue,
  ForumVoteType,
  removeForumPostVote,
  voteForumPost,
} from "../shared/api/forumApi";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { chunky, colors, fonts, radius, shadow, spacing } from "../shared/config/theme";
import { Button } from "../shared/ui/Button/Button";

function truncateContent(content: string, maxLength = 140): string {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength).trimEnd()}...`;
}

function formatPostDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function authorInitial(name: string | null): string {
  const first = (name ?? "").trim()[0];
  return first ? first.toUpperCase() : "U";
}

export function ForumTopicScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
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

  const loadPosts = useCallback(
    async (nextPage = 1, refresh = false): Promise<void> => {
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
        setPosts((current) => (nextPage === 1 ? response.data : [...current, ...response.data]));
        setPage(response.pagination.page);
        setTotalPages(response.pagination.totalPages);
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar os posts.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [token, topicId],
  );

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
      const currentVote =
        post?.myReaction === "LIKE" ? "UPVOTE" : post?.myReaction === "DISLIKE" ? "DOWNVOTE" : null;
      const vote: ForumVoteType = value === "LIKE" ? "UPVOTE" : "DOWNVOTE";
      const reaction =
        currentVote === vote
          ? await removeForumPostVote(token, postId)
          : await voteForumPost(token, postId, vote);
      setPosts((current) =>
        current.map((item) =>
          item.id === postId
            ? {
                ...item,
                reactionCounts: { likes: reaction.upvotes, dislikes: reaction.downvotes },
                myReaction:
                  reaction.myVote === "UPVOTE"
                    ? "LIKE"
                    : reaction.myVote === "DOWNVOTE"
                      ? "DISLIKE"
                      : null,
              }
            : item,
        ),
      );
    } catch (error: unknown) {
      if (error instanceof ForumApiError && error.status === 401) {
        Alert.alert("Sessão expirada", "Faça login novamente para avaliar uma postagem.");
      }
    } finally {
      setReactingPostId(null);
    }
  }

  const header = (
    <View style={styles.topBar}>
      <Pressable
        accessibilityLabel="Voltar para os tópicos"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
      >
        <Feather name="arrow-left" size={20} color={colors.textPrimary} />
      </Pressable>
      <View style={styles.topBarTexts}>
        <Text style={styles.eyebrow}>FÓRUM · TÓPICO</Text>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {topicTitle}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
        {header}
        <View style={styles.centered}>
          <View style={styles.stateCard}>
            <View style={styles.stateIconError}>
              <Feather name="wifi-off" size={24} color={colors.danger} />
            </View>
            <Text style={styles.stateTitle}>Não foi possível carregar</Text>
            <Text style={styles.stateText}>{errorMessage}</Text>
            <View style={styles.stateAction}>
              <Button title="Tentar novamente" onPress={() => void loadPosts()} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {header}
      <FlatList
        data={posts}
        keyExtractor={(post) => post.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadPosts(1, true)}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (!isLoadingMore && page < totalPages) void loadPosts(page + 1);
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.introHeader}>
            <Text style={styles.title}>{topicTitle}</Text>
            <Text style={styles.subtitle}>
              {posts.length === 1
                ? "1 discussão recente da comunidade"
                : posts.length > 1
                  ? `${posts.length} discussões recentes da comunidade`
                  : "Discussões recentes da comunidade"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="message-square" size={24} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Ainda não há posts</Text>
            <Text style={styles.emptyText}>
              Seja a primeira pessoa a iniciar uma conversa neste tópico.
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
          ) : null
        }
        renderItem={({ item }) => {
          const isLiked = item.myReaction === "LIKE";
          const isDisliked = item.myReaction === "DISLIKE";
          const formattedDate = formatPostDate(item.createdAt);

          return (
            <View style={styles.postCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir post ${item.title}`}
                onPress={() => navigation.navigate("ForumPost", { postId: item.id, topicTitle })}
                style={({ pressed }) => [
                  styles.postContentPressable,
                  pressed && styles.postCardPressed,
                ]}
              >
                <View style={styles.authorRow}>
                  {item.author.image ? (
                    <Image source={{ uri: item.author.image }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{authorInitial(item.author.name)}</Text>
                    </View>
                  )}
                  <View style={styles.authorMeta}>
                    <Text style={styles.author} numberOfLines={1}>
                      {item.author.name || "Usuário ConnectaDev"}
                    </Text>
                    {formattedDate ? <Text style={styles.date}>{formattedDate}</Text> : null}
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textMuted} />
                </View>

                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postContent}>{truncateContent(item.content)}</Text>

                {item.tags.length > 0 ? (
                  <View style={styles.tagsRow}>
                    {item.tags.map((tag) => (
                      <Text key={tag} style={styles.tagBadge}>
                        {tag}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </Pressable>

              <View style={styles.postMeta}>
                <Pressable
                  accessibilityLabel={`Curtir post. ${item.reactionCounts.likes} curtidas`}
                  accessibilityRole="button"
                  disabled={reactingPostId !== null}
                  onPress={() => void handleReaction(item.id, "LIKE")}
                  style={[styles.reactionPill, isLiked && styles.reactionPillActive]}
                >
                  <Feather
                    name="thumbs-up"
                    size={14}
                    color={isLiked ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.metaText, isLiked && styles.metaTextActive]}>
                    {item.reactionCounts.likes}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityLabel={`Não curtir post. ${item.reactionCounts.dislikes} avaliações negativas`}
                  accessibilityRole="button"
                  disabled={reactingPostId !== null}
                  onPress={() => void handleReaction(item.id, "DISLIKE")}
                  style={[styles.reactionPill, isDisliked && styles.reactionPillActive]}
                >
                  <Feather
                    name="thumbs-down"
                    size={14}
                    color={isDisliked ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.metaText, isDisliked && styles.metaTextActive]}>
                    {item.reactionCounts.dislikes}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityLabel={`${item._count.comments} comentários`}
                  accessibilityRole="button"
                  onPress={() => navigation.navigate("ForumPost", { postId: item.id, topicTitle })}
                  style={styles.commentBadge}
                >
                  <Feather name="message-circle" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{item._count.comments}</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <View
        style={[
          styles.createDock,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        <Pressable
          accessibilityLabel="Criar novo post"
          accessibilityRole="button"
          onPress={() => navigation.navigate("ForumCreatePost", { topicId, topicTitle })}
          style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
        >
          <Feather name="edit-3" size={17} color={colors.textOnPrimary} />
          <Text style={styles.createButtonText}>Criar nova publicação</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamSoft,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPressed: {
    backgroundColor: colors.creamSoft,
  },
  topBarTexts: {
    flex: 1,
    gap: 1,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: fonts.mono.medium,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sans.bold,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  introHeader: {
    marginBottom: 16,
    gap: 4,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.sans.extraBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.light,
    marginBottom: 12,
    overflow: "hidden",
    ...shadow.card,
  },
  postContentPressable: {
    padding: 16,
  },
  postCardPressed: {
    backgroundColor: colors.creamSoft,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.light,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.sans.bold,
    fontSize: 13,
  },
  authorMeta: {
    flex: 1,
    gap: 1,
  },
  author: {
    color: colors.secondary,
    fontFamily: fonts.sans.semiBold,
    fontSize: 13,
  },
  date: {
    color: colors.textMuted,
    fontFamily: fonts.sans.regular,
    fontSize: 11,
  },
  postTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sans.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  postContent: {
    color: colors.textMuted,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tagBadge: {
    backgroundColor: colors.creamSoft,
    borderRadius: radius.pill,
    color: colors.primary,
    fontFamily: fonts.mono.medium,
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopColor: colors.creamSoft,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  reactionPillActive: {
    backgroundColor: colors.creamSoft,
    borderColor: colors.primary,
  },
  commentBadge: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  metaText: {
    color: colors.textMuted,
    fontFamily: fonts.sans.semiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  metaTextActive: {
    color: colors.primary,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: fonts.sans.medium,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  stateCard: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  stateIconError: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  stateTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sans.bold,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 6,
  },
  stateText: {
    color: colors.textMuted,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  stateAction: {
    width: "100%",
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    paddingVertical: 36,
    ...shadow.card,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.creamSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.sans.bold,
    fontSize: 16,
    marginBottom: 4,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 260,
  },
  footerLoader: {
    marginVertical: 16,
  },
  createDock: {
    backgroundColor: colors.canvas,
    borderTopColor: colors.light,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  createButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderBottomWidth: chunky.ctaDepth,
    borderBottomColor: colors.primaryDeepest,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  createButtonPressed: {
    borderBottomWidth: chunky.pressedDepth,
    transform: [{ translateY: 2 }],
  },
  createButtonText: {
    color: colors.textOnPrimary,
    fontFamily: fonts.sans.extraBold,
    fontSize: 14,
  },
});
