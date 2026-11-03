import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../entities/session";
import {
  createForumComment,
  deleteForumComment,
  deleteForumPost,
  fetchForumComments,
  fetchForumPost,
  ForumComment,
  ForumApiError,
  ForumPost,
  ForumReactionValue,
  ForumVoteType,
  cacheForumPost,
  getCachedForumPost,
  removeForumPostVote,
  voteForumPost,
  reactToForumPost,
  updateForumComment,
  updateForumPost,
} from "../shared/api/forumApi";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { colors, fonts, radius, shadow, spacing } from "../shared/config/theme";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function ForumPostScreen() {
  const { token, user } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, "ForumPost">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { postId, topicTitle } = route.params;
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [menuTarget, setMenuTarget] = useState<"post" | string | null>(null);
  const [editingComment, setEditingComment] = useState<ForumComment | null>(null);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    { type: "post" } | { type: "comment"; id: string } | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const loadPost = useCallback(async (refresh = false): Promise<void> => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const [postResponse, commentsResponse] = await Promise.all([
        fetchForumPost(token, postId),
        fetchForumComments(token, postId),
      ]);
      setPost(postResponse);
      setComments(commentsResponse);
      setIsCached(false);
      await cacheForumPost(postResponse, commentsResponse);
    } catch (error: unknown) {
      if (error instanceof ForumApiError && error.status === 404) {
        setErrorMessage("Esta postagem não foi encontrada ou foi removida");
      } else {
        const cached = await getCachedForumPost(postId);
        if (cached) {
          setPost(cached.post);
          setComments(cached.comments);
          setIsCached(true);
          setErrorMessage(null);
        } else {
          setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar o post.");
        }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [postId, token]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  async function handleReaction(value: ForumReactionValue): Promise<void> {
    if (!token) {
      Alert.alert("Login necessário", "Entre na sua conta para avaliar uma postagem.");
      return;
    }
    if (!post || isReacting) return;

    setIsReacting(true);
    try {
      const currentVote = post.myReaction === "LIKE" ? "UPVOTE" : post.myReaction === "DISLIKE" ? "DOWNVOTE" : null;
      const vote = value === "LIKE" ? "UPVOTE" : "DOWNVOTE";
      const reaction = currentVote === vote
        ? await removeForumPostVote(token, post.id)
        : await voteForumPost(token, post.id, vote as ForumVoteType);
      setPost((current) => current
        ? { ...current, reactionCounts: { likes: reaction.upvotes, dislikes: reaction.downvotes }, myReaction: reaction.myVote === "UPVOTE" ? "LIKE" : reaction.myVote === "DOWNVOTE" ? "DISLIKE" : null }
        : current);
    } catch (error: unknown) {
      if (error instanceof ForumApiError && error.status === 401) {
        Alert.alert("Sessão expirada", "Faça login novamente para avaliar uma postagem.");
      } else {
        setActionError(error instanceof Error ? error.message : "Não foi possível registrar sua avaliação.");
      }
    } finally {
      setIsReacting(false);
    }
  }

  async function handleSubmitComment(): Promise<void> {
    const content = commentDraft.trim();
    if (!token || isSubmittingComment) return;
    if (!content) {
      setCommentError("O comentário não pode ser vazio.");
      return;
    }
    if (content.length > 1000) {
      setCommentError("Limite máximo de 1000 caracteres excedido.");
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      const comment = await createForumComment(token, postId, content);
      setComments((current) => [...current, comment]);
      setPost((current) => current
        ? { ...current, _count: { ...current._count, comments: current._count.comments + 1 } }
        : current);
      setCommentDraft("");
      setIsComposerExpanded(false);
    } catch (error: unknown) {
      if (error instanceof ForumApiError && error.status === 404) {
        Alert.alert("Post indisponível", "Esta postagem não está mais disponível", [{ text: "Voltar", onPress: () => navigation.goBack() }]);
      } else {
        setCommentError(error instanceof Error ? error.message : "Não foi possível publicar seu comentário.");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  }

  function openPostEditor(): void {
    if (!post) return;
    setMenuTarget(null);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditError(null);
    setIsEditingPost(true);
  }

  function openCommentEditor(comment: ForumComment): void {
    setMenuTarget(null);
    setEditContent(comment.content);
    setEditError(null);
    setEditingComment(comment);
  }

  async function handleSaveEdit(): Promise<void> {
    if (!token || isSavingEdit) return;
    const content = editContent.trim();
    if (!content || (isEditingPost && !editTitle.trim())) {
      setEditError("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    try {
      if (isEditingPost && post) {
        setPost(await updateForumPost(token, post.id, { title: editTitle.trim(), content }));
        setIsEditingPost(false);
      } else if (editingComment) {
        const updatedComment = await updateForumComment(token, editingComment.id, content);
        setComments((current) => current.map((item) => item.id === updatedComment.id ? updatedComment : item));
        setEditingComment(null);
      }
    } catch (error: unknown) {
      setEditError(error instanceof Error ? error.message : "Não foi possível salvar a edição.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  function confirmDeletePost(): void {
    if (!token || !post) return;
    setMenuTarget(null);
    setDeleteTarget({ type: "post" });
  }

  function confirmDeleteComment(commentId: string): void {
    if (!token) return;
    setMenuTarget(null);
    setDeleteTarget({ type: "comment", id: commentId });
  }

  async function handleDelete(): Promise<void> {
    if (!token || !deleteTarget || isDeleting) return;

    setIsDeleting(true);
    setActionError(null);
    try {
      if (deleteTarget.type === "post" && post) {
        await deleteForumPost(token, post.id);
        navigation.goBack();
      } else if (deleteTarget.type === "comment") {
        await deleteForumComment(token, deleteTarget.id);
        setComments((current) => current.filter((comment) => comment.id !== deleteTarget.id));
        setPost((current) => current
          ? { ...current, _count: { ...current._count, comments: Math.max(0, current._count.comments - 1) } }
          : current);
        setDeleteTarget(null);
      }
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : "Não foi possível excluir o conteúdo.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) return <ActivityIndicator style={styles.centered} color="#036564" />;

  if (errorMessage || !post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage || "Esta postagem não foi encontrada ou foi removida"}</Text>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Voltar ao fórum</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardContainer}>
        {isCached ? <Text style={styles.cacheBanner}>Você está visualizando a versão em cache desta postagem</Text> : null}
        {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
        <FlatList
          data={comments}
          keyExtractor={(comment) => comment.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onTouchStart={() => {
            if (isComposerExpanded) setIsComposerExpanded(false);
          }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadPost(true)} tintColor="#036564" />}
          ListHeaderComponent={
            <View>
            <Pressable accessibilityLabel="Voltar para os posts" accessibilityRole="button" onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>‹ {topicTitle || "Posts"}</Text>
            </Pressable>
            <View style={styles.postHeader}>
              <Text style={styles.topicLabel}>{post.topicTitle || topicTitle || post.topicSlug}</Text>
              <Text style={styles.title}>{post.title}</Text>
              <View style={styles.authorRow}>
                {post.author.image ? (
                  <Image accessibilityLabel={`Avatar de ${post.author.name || "usuário"}`} source={{ uri: post.author.image }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}><Text style={styles.avatarText}>{(post.author.name || "U").charAt(0).toUpperCase()}</Text></View>
                )}
                <View>
                  <Text style={styles.author}>{post.author.name || "Usuário ConnectaDev"}</Text>
                  <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
                </View>
              </View>
              <Text style={styles.content}>{post.content}</Text>
              <View style={styles.postStats}>
                  <View style={styles.statItem}><Feather name="message-circle" size={14} color={colors.textMuted} /><Text style={styles.statText}>{post._count.comments}</Text></View>
                  <View style={styles.statItem}><Feather name="eye" size={14} color={colors.textMuted} /><Text style={styles.statText}>{post.viewsCount}</Text></View>
              </View>
              {post.tags.length > 0 ? (
                <View style={styles.tagsRow}>
                  {post.tags.map((tag) => <Text key={tag} style={styles.tagBadge}>{tag}</Text>)}
                </View>
              ) : null}
              <View style={styles.reactionActions}>
                <Pressable
                  accessibilityLabel={`Curtir post. ${post.reactionCounts.likes} curtidas`}
                  accessibilityRole="button"
                  disabled={isReacting}
                  onPress={() => void handleReaction("LIKE")}
                  style={[styles.reactionButton, post.myReaction === "LIKE" && styles.reactionButtonActive]}
                >
                  <Feather name="thumbs-up" size={15} color={post.myReaction === "LIKE" ? colors.primary : colors.textMuted} />
                  <Text style={styles.reactionCount}>{post.reactionCounts.likes}</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Não curtir post. ${post.reactionCounts.dislikes} avaliações negativas`}
                  accessibilityRole="button"
                  disabled={isReacting}
                  onPress={() => void handleReaction("DISLIKE")}
                  style={[styles.reactionButton, post.myReaction === "DISLIKE" && styles.reactionButtonActive]}
                >
                  <Feather name="thumbs-down" size={15} color={post.myReaction === "DISLIKE" ? colors.primary : colors.textMuted} />
                  <Text style={styles.reactionCount}>{post.reactionCounts.dislikes}</Text>
                </Pressable>
              </View>
              {user?.id === post.author.id ? (
                <Pressable
                  accessibilityLabel="Abrir ações do post"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => {
                    setActionError(null);
                    setMenuTarget("post");
                  }}
                  style={styles.moreButton}
                >
                  <Text style={styles.moreButtonText}>•••</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.commentsTitle}>Comentários ({comments.length})</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Ainda não há comentários</Text>
              <Text style={styles.emptyText}>Seja a primeira pessoa a participar desta conversa.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAuthorRow}>
                  {item.author.image ? (
                    <Image accessibilityLabel={`Avatar de ${item.author.name || "usuário"}`} source={{ uri: item.author.image }} style={styles.commentAvatarImage} />
                  ) : (
                    <View style={styles.commentAvatar}><Text style={styles.commentAvatarText}>{(item.author.name || "U").charAt(0).toUpperCase()}</Text></View>
                  )}
                  <Text style={styles.commentAuthor}>{item.author.name || "Usuário ConnectaDev"}</Text>
                </View>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.commentContent}>{item.content}</Text>
              {user?.id === item.author.id ? (
                <Pressable
                  accessibilityLabel={`Abrir ações do comentário de ${item.author.name || "usuário"}`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => {
                    setActionError(null);
                    setMenuTarget(item.id);
                  }}
                  style={styles.moreButton}
                >
                  <Text style={styles.moreButtonText}>•••</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        />
        <View style={styles.composerDock}>
          {isComposerExpanded ? (
            <View style={styles.composerExpanded}>
              <TextInput
                accessibilityLabel="Escreva um comentário"
                autoFocus
                maxLength={1100}
                multiline
                onChangeText={(value) => {
                  setCommentDraft(value);
                  if (commentError) setCommentError(null);
                }}
                onSubmitEditing={() => void handleSubmitComment()}
                placeholder="Escreva um comentário..."
                placeholderTextColor="#94A3B8"
                returnKeyType="send"
                style={styles.commentInput}
                textAlignVertical="top"
                value={commentDraft}
              />
              <Pressable
                accessibilityLabel="Publicar comentário"
                accessibilityRole="button"
                accessibilityState={{ disabled: isSubmittingComment }}
                disabled={isSubmittingComment}
                onPress={() => void handleSubmitComment()}
                style={({ pressed }) => [
                  styles.sendButton,
                  isSubmittingComment && styles.submitButtonDisabled,
                  pressed && styles.submitButtonPressed,
                ]}
              >
                {isSubmittingComment ? <ActivityIndicator color={colors.textOnPrimary} size="small" /> : <Feather name="send" size={17} color={colors.textOnPrimary} />}
              </Pressable>
              {commentError ? <Text style={styles.commentError}>{commentError}</Text> : null}
            </View>
          ) : (
            <Pressable
              accessibilityLabel="Entre na conversa"
              accessibilityRole="button"
              onPress={() => setIsComposerExpanded(true)}
              style={({ pressed }) => [styles.composerPill, pressed && styles.submitButtonPressed]}
            >
              <View style={styles.composerPlusWrap}>
                <Feather name="plus" size={18} color={colors.primary} />
              </View>
              <Text style={styles.composerPrompt}>Entre na conversa</Text>
            </Pressable>
          )}
        </View>
        <Modal
          animationType="slide"
          transparent
          visible={menuTarget !== null}
          onRequestClose={() => setMenuTarget(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setMenuTarget(null)}>
            <View style={styles.actionSheet}>
              <View style={styles.actionSheetHeader}>
                <View style={styles.actionSheetIcon}>
                  <Feather name="more-horizontal" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.actionSheetTitle}>Ações</Text>
                  <Text style={styles.actionSheetSubtitle}>Gerencie este conteúdo</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (menuTarget === "post") openPostEditor();
                  else {
                    const comment = comments.find((item) => item.id === menuTarget);
                    if (comment) openCommentEditor(comment);
                  }
                }}
                style={({ pressed }) => [styles.actionItem, pressed && styles.actionItemPressed]}
              >
                <View style={styles.actionItemIcon}>
                  <Feather name="edit-2" size={17} color={colors.primary} />
                </View>
                <Text style={styles.actionItemText}>Editar</Text>
                <Feather name="chevron-right" size={17} color={colors.textMuted} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => menuTarget === "post" ? confirmDeletePost() : confirmDeleteComment(menuTarget || "")}
                style={({ pressed }) => [styles.actionItem, pressed && styles.deleteItemPressed]}
              >
                <View style={styles.deleteItemIcon}>
                  <Feather name="trash-2" size={17} color={colors.danger} />
                </View>
                <Text style={styles.deleteActionText}>Excluir</Text>
                <Feather name="chevron-right" size={17} color={colors.danger} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setMenuTarget(null)} style={styles.cancelAction}>
                <Text style={styles.cancelActionText}>Cancelar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
        <Modal
          animationType="fade"
          transparent
          visible={deleteTarget !== null}
          onRequestClose={() => {
            if (!isDeleting) setDeleteTarget(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModal}>
              <View style={styles.confirmIcon}>
                <Feather name="trash-2" size={22} color={colors.danger} />
              </View>
              <Text style={styles.confirmTitle}>
                Excluir {deleteTarget?.type === "post" ? "post" : "comentário"}?
              </Text>
              <Text style={styles.confirmText}>Essa ação não poderá ser desfeita.</Text>
              <View style={styles.confirmActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isDeleting}
                  onPress={() => setDeleteTarget(null)}
                  style={styles.confirmCancelButton}
                >
                  <Text style={styles.cancelActionText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isDeleting}
                  onPress={() => void handleDelete()}
                  style={styles.confirmDeleteButton}
                >
                  {isDeleting ? <ActivityIndicator color={colors.textOnPrimary} size="small" /> : <><Feather name="trash-2" size={15} color={colors.textOnPrimary} /><Text style={styles.confirmDeleteText}>Excluir</Text></>}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="fade"
          transparent
          visible={isEditingPost || editingComment !== null}
          onRequestClose={() => {
            if (!isSavingEdit) {
              setIsEditingPost(false);
              setEditingComment(null);
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editorModal}>
              <View style={styles.editorHeader}>
                <View style={styles.editorIcon}>
                  <Feather name="edit-2" size={19} color={colors.primary} />
                </View>
                <View style={styles.editorTitleWrap}>
                  <Text style={styles.actionSheetTitle}>{isEditingPost ? "Editar post" : "Editar comentário"}</Text>
                  <Text style={styles.actionSheetSubtitle}>Atualize o conteúdo da conversa</Text>
                </View>
              </View>
              {isEditingPost ? (
                <TextInput
                  accessibilityLabel="Título do post"
                  maxLength={120}
                  onChangeText={setEditTitle}
                  placeholder="Título do post"
                  placeholderTextColor="#94A3B8"
                  style={styles.editInput}
                  value={editTitle}
                />
              ) : null}
              <TextInput
                accessibilityLabel={isEditingPost ? "Conteúdo do post" : "Conteúdo do comentário"}
                multiline
                maxLength={isEditingPost ? 5000 : 1000}
                onChangeText={setEditContent}
                placeholder={isEditingPost ? "Conteúdo do post" : "Conteúdo do comentário"}
                placeholderTextColor="#94A3B8"
                style={[styles.editInput, styles.editContentInput]}
                textAlignVertical="top"
                value={editContent}
              />
              {editError ? <Text style={styles.commentError}>{editError}</Text> : null}
              <View style={styles.editorActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSavingEdit}
                  onPress={() => {
                    setIsEditingPost(false);
                    setEditingComment(null);
                  }}
                  style={styles.editorCancelButton}
                >
                  <Text style={styles.cancelActionText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSavingEdit}
                  onPress={() => void handleSaveEdit()}
                  style={[styles.submitButton, styles.editorActionButton]}
                >
                  {isSavingEdit ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.submitButtonText}>Salvar</Text>}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  keyboardContainer: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  backText: { color: colors.primary, fontFamily: fonts.sans.semiBold, fontSize: 14, marginBottom: spacing.md },
  postHeader: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  topicLabel: { color: colors.primary, fontFamily: fonts.sans.bold, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase" },
  title: { color: colors.textPrimary, fontFamily: fonts.sans.bold, fontSize: 25, lineHeight: 32, marginTop: spacing.sm },
  authorRow: { alignItems: "center", flexDirection: "row", marginTop: 18 },
  avatar: { alignItems: "center", backgroundColor: "#DCEEE9", borderRadius: 18, height: 36, justifyContent: "center", marginRight: 10, width: 36 },
  avatarImage: { borderRadius: 18, height: 36, marginRight: 10, width: 36 },
  avatarText: { color: "#036564", fontSize: 15, fontWeight: "800" },
  author: { color: "#32504C", fontSize: 13, fontWeight: "700" },
  date: { color: "#7A8986", fontSize: 12, marginTop: 3 },
  content: { color: colors.textBody, fontFamily: fonts.sans.regular, fontSize: 16, lineHeight: 25, marginTop: spacing.lg },
  postStats: { flexDirection: "row", gap: 16, marginTop: 16 },
  statItem: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  statText: { color: colors.textMuted, fontFamily: fonts.sans.medium, fontSize: 13 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },
  tagBadge: { backgroundColor: "#E0F2F1", borderRadius: 999, color: "#036564", fontSize: 12, fontWeight: "700", paddingHorizontal: 9, paddingVertical: 5 },
  reactionActions: { alignItems: "center", borderTopColor: "#E2E8F0", borderTopWidth: 1, flexDirection: "row", gap: 18, marginTop: 20, paddingTop: 12 },
  reactionButton: { alignItems: "center", flexDirection: "row", gap: 5 },
  reactionButtonActive: { opacity: 1 },
  reactionIcon: { color: "#94A3B8", fontSize: 15 },
  reactionIconActive: { color: "#036564" },
  reactionCount: { color: "#64748B", fontSize: 13, fontWeight: "700" },
  commentsTitle: { color: colors.textPrimary, fontFamily: fonts.sans.semiBold, fontSize: 18, marginBottom: spacing.sm, marginTop: spacing.lg },
  commentCard: { borderLeftColor: "#D7E0E5", borderLeftWidth: 2, marginBottom: 18, paddingLeft: 14, paddingVertical: 2 },
  commentHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  commentAuthorRow: { alignItems: "center", flex: 1, flexDirection: "row" },
  commentAvatar: { alignItems: "center", backgroundColor: "#E2E8F0", borderRadius: 14, height: 28, justifyContent: "center", marginRight: 8, width: 28 },
  commentAvatarImage: { borderRadius: 14, height: 28, marginRight: 8, width: 28 },
  commentAvatarText: { color: "#475569", fontSize: 12, fontWeight: "800" },
  commentAuthor: { color: "#64748B", flex: 1, fontSize: 13, fontWeight: "700" },
  commentContent: { color: "#334155", fontSize: 14, lineHeight: 21, marginTop: 8 },
  centered: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  errorText: { color: "#8B3434", fontSize: 15, lineHeight: 22, marginBottom: 16, textAlign: "center" },
  primaryButton: { backgroundColor: "#036564", borderRadius: 10, paddingHorizontal: 18, paddingVertical: 14 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 36 },
  emptyTitle: { color: "#0F172A", fontSize: 16, fontWeight: "700" },
  emptyText: { color: "#64748B", fontSize: 14, lineHeight: 21, marginTop: 6, textAlign: "center" },
  composerDock: { backgroundColor: colors.canvas, borderTopColor: colors.light, borderTopWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  composerPill: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.light, borderRadius: radius.pill, borderWidth: 1, flexDirection: "row", height: 44, justifyContent: "flex-start", paddingHorizontal: spacing.md },
  composerPlusWrap: { alignItems: "center", height: 20, justifyContent: "center", marginRight: 10, width: 20 },
  composerPlus: { color: "#036564", fontSize: 20, fontWeight: "400", includeFontPadding: false, lineHeight: 20, textAlign: "center", textAlignVertical: "center", transform: [{ translateY: -2 }] },
  composerPrompt: { color: "#64748B", fontSize: 14, fontWeight: "600", includeFontPadding: false, lineHeight: 20, textAlignVertical: "center" },
  composerExpanded: { backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", borderRadius: 14, borderWidth: 1, flexDirection: "row", padding: 8 },
  commentInput: { color: "#0F172A", flex: 1, fontSize: 14, lineHeight: 20, maxHeight: 110, minHeight: 44, paddingHorizontal: 8, paddingVertical: 10 },
  sendButton: { alignItems: "center", alignSelf: "flex-end", backgroundColor: "#036564", borderRadius: 22, height: 44, justifyContent: "center", marginLeft: 8, width: 44 },
  sendButtonText: { color: "#FFFFFF", fontSize: 20, transform: [{ rotate: "-12deg" }] },
  submitButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.pill, justifyContent: "center", minHeight: 44, paddingHorizontal: spacing.md },
  submitButtonDisabled: { backgroundColor: "#A7C6C1" },
  submitButtonPressed: { opacity: 0.85 },
  submitButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  commentError: { color: "#B42318", fontSize: 12, lineHeight: 18, marginTop: 10 },
  actionError: { backgroundColor: "#FEE4E2", color: "#B42318", fontSize: 13, lineHeight: 18, marginHorizontal: 20, marginTop: 8, padding: 10 },
  cacheBanner: { backgroundColor: "#FEF3C7", color: "#92400E", fontSize: 12, paddingHorizontal: 20, paddingVertical: 8, textAlign: "center" },
  moreButton: { alignSelf: "flex-end", marginTop: 8, paddingVertical: 1 },
  moreButtonText: { color: "#94A3B8", fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },
  modalOverlay: { alignItems: "center", backgroundColor: "rgba(3, 22, 52, 0.48)", flex: 1, justifyContent: "flex-end" },
  actionSheet: { alignSelf: "stretch", backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, paddingBottom: spacing.xl, width: "100%" },
  actionSheetHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  actionSheetIcon: { alignItems: "center", backgroundColor: colors.creamSoft, borderRadius: radius.md, height: 40, justifyContent: "center", width: 40 },
  actionSheetTitle: { color: colors.textPrimary, fontFamily: fonts.sans.bold, fontSize: 18 },
  actionSheetSubtitle: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 12, marginTop: 2 },
  actionItem: { alignItems: "center", borderTopColor: colors.light, borderTopWidth: 1, flexDirection: "row", minHeight: 58, paddingVertical: spacing.sm },
  actionItemPressed: { backgroundColor: colors.creamSoft },
  deleteItemPressed: { backgroundColor: "#FDECEC" },
  actionItemIcon: { alignItems: "center", backgroundColor: colors.creamSoft, borderRadius: radius.sm, height: 32, justifyContent: "center", marginRight: spacing.sm, width: 32 },
  deleteItemIcon: { alignItems: "center", backgroundColor: "#FDECEC", borderRadius: radius.sm, height: 32, justifyContent: "center", marginRight: spacing.sm, width: 32 },
  actionItemText: { color: colors.primary, flex: 1, fontFamily: fonts.sans.semiBold, fontSize: 15 },
  deleteActionText: { color: colors.danger, flex: 1, fontFamily: fonts.sans.semiBold, fontSize: 15 },
  cancelAction: { alignItems: "center", backgroundColor: colors.creamSoft, borderRadius: radius.pill, marginTop: spacing.md, paddingVertical: spacing.sm },
  cancelActionText: { color: colors.secondary, fontFamily: fonts.sans.semiBold, fontSize: 14 },
  confirmModal: { backgroundColor: colors.surface, borderRadius: radius.lg, margin: spacing.lg, padding: spacing.lg, width: "90%" },
  confirmIcon: { alignItems: "center", alignSelf: "center", backgroundColor: "#FDECEC", borderRadius: radius.pill, height: 52, justifyContent: "center", marginBottom: spacing.md, width: 52 },
  confirmTitle: { color: colors.textPrimary, fontFamily: fonts.sans.bold, fontSize: 18, textAlign: "center" },
  confirmText: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 14, lineHeight: 20, marginTop: spacing.sm, textAlign: "center" },
  confirmActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  confirmCancelButton: { alignItems: "center", backgroundColor: colors.creamSoft, borderRadius: radius.pill, flex: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: spacing.md },
  confirmDeleteButton: { alignItems: "center", backgroundColor: colors.danger, borderRadius: radius.pill, flex: 1, flexDirection: "row", gap: spacing.xs, justifyContent: "center", minHeight: 44, paddingHorizontal: spacing.md },
  confirmDeleteText: { color: colors.textOnPrimary, fontFamily: fonts.sans.semiBold, fontSize: 14 },
  editorModal: { backgroundColor: colors.surface, borderRadius: radius.lg, margin: spacing.lg, padding: spacing.lg, width: "90%" },
  editorHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  editorIcon: { alignItems: "center", backgroundColor: colors.creamSoft, borderRadius: radius.md, height: 40, justifyContent: "center", width: 40 },
  editorTitleWrap: { flex: 1 },
  editInput: { backgroundColor: colors.canvas, borderColor: colors.light, borderRadius: radius.md, borderWidth: 1, color: colors.textPrimary, fontFamily: fonts.sans.regular, fontSize: 14, marginTop: spacing.sm, padding: spacing.md },
  editContentInput: { minHeight: 130 },
  editorActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  editorActionButton: { flex: 1 },
  editorCancelButton: { alignItems: "center", backgroundColor: colors.creamSoft, borderRadius: radius.pill, flex: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: spacing.md },
});