import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { useAuth } from "../entities/session";
import {
  createForumComment,
  deleteForumComment,
  deleteForumPost,
  fetchForumComments,
  fetchForumPost,
  ForumComment,
  ForumPost,
  ForumReactionValue,
  reactToForumPost,
  updateForumComment,
  updateForumPost,
} from "../shared/api/forumApi";
import type { RootStackParamList } from "../app/navigation/RootNavigator";

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
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar o post.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [postId, token]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  async function handleReaction(value: ForumReactionValue): Promise<void> {
    if (!token || !post || isReacting) return;

    setIsReacting(true);
    try {
      const reaction = await reactToForumPost(token, post.id, value);
      setPost((current) => current
        ? { ...current, reactionCounts: { likes: reaction.likes, dislikes: reaction.dislikes }, myReaction: reaction.myReaction }
        : current);
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : "Não foi possível registrar sua avaliação.");
    } finally {
      setIsReacting(false);
    }
  }

  async function handleSubmitComment(): Promise<void> {
    const content = commentDraft.trim();
    if (!token || !content || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      const comment = await createForumComment(token, postId, content);
      setComments((current) => [...current, comment]);
      setCommentDraft("");
      setIsComposerExpanded(false);
    } catch (error: unknown) {
      setCommentError(error instanceof Error ? error.message : "Não foi possível publicar seu comentário.");
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
        <Text style={styles.errorText}>{errorMessage || "Post não encontrado."}</Text>
        <Pressable accessibilityRole="button" onPress={() => void loadPost()} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardContainer}>
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
              <Text style={styles.topicLabel}>{topicTitle || post.topicSlug}</Text>
              <Text style={styles.title}>{post.title}</Text>
              <View style={styles.authorRow}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{(post.author.name || "U").charAt(0).toUpperCase()}</Text></View>
                <View>
                  <Text style={styles.author}>{post.author.name || "Usuário ConnectaDev"}</Text>
                  <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
                </View>
              </View>
              <Text style={styles.content}>{post.content}</Text>
              <View style={styles.reactionActions}>
                <Pressable
                  accessibilityLabel={`Curtir post. ${post.reactionCounts.likes} curtidas`}
                  accessibilityRole="button"
                  disabled={isReacting}
                  onPress={() => void handleReaction("LIKE")}
                  style={[styles.reactionButton, post.myReaction === "LIKE" && styles.reactionButtonActive]}
                >
                  <Text style={[styles.reactionIcon, post.myReaction === "LIKE" && styles.reactionIconActive]}>👍︎</Text>
                  <Text style={styles.reactionCount}>{post.reactionCounts.likes}</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Não curtir post. ${post.reactionCounts.dislikes} avaliações negativas`}
                  accessibilityRole="button"
                  disabled={isReacting}
                  onPress={() => void handleReaction("DISLIKE")}
                  style={[styles.reactionButton, post.myReaction === "DISLIKE" && styles.reactionButtonActive]}
                >
                  <Text style={[styles.reactionIcon, post.myReaction === "DISLIKE" && styles.reactionIconActive]}>👎︎</Text>
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
                <Text style={styles.commentAuthor}>{item.author.name || "Usuário ConnectaDev"}</Text>
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
                accessibilityState={{ disabled: !commentDraft.trim() || isSubmittingComment }}
                disabled={!commentDraft.trim() || isSubmittingComment}
                onPress={() => void handleSubmitComment()}
                style={({ pressed }) => [
                  styles.sendButton,
                  (!commentDraft.trim() || isSubmittingComment) && styles.submitButtonDisabled,
                  pressed && styles.submitButtonPressed,
                ]}
              >
                {isSubmittingComment ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.sendButtonText}>✈</Text>}
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
                <Text style={styles.composerPlus}>+</Text>
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
              <Text style={styles.actionSheetTitle}>Ações</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (menuTarget === "post") openPostEditor();
                  else {
                    const comment = comments.find((item) => item.id === menuTarget);
                    if (comment) openCommentEditor(comment);
                  }
                }}
                style={styles.actionItem}
              >
                <Text style={styles.actionItemText}>Editar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => menuTarget === "post" ? confirmDeletePost() : confirmDeleteComment(menuTarget || "")}
                style={styles.actionItem}
              >
                <Text style={styles.deleteActionText}>Excluir</Text>
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
                  {isDeleting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.confirmDeleteText}>Excluir</Text>}
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
              <Text style={styles.actionSheetTitle}>{isEditingPost ? "Editar post" : "Editar comentário"}</Text>
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
                maxLength={isEditingPost ? 5000 : 2000}
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
                  style={styles.cancelAction}
                >
                  <Text style={styles.cancelActionText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSavingEdit}
                  onPress={() => void handleSaveEdit()}
                  style={styles.submitButton}
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
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  keyboardContainer: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 32 },
  backText: { color: "#036564", fontSize: 14, fontWeight: "700", marginBottom: 18 },
  postHeader: { backgroundColor: "#FFFFFF", borderRadius: 16, elevation: 2, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  topicLabel: { color: "#036564", fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  title: { color: "#0F172A", fontSize: 25, fontWeight: "800", lineHeight: 32, marginTop: 8 },
  authorRow: { alignItems: "center", flexDirection: "row", marginTop: 18 },
  avatar: { alignItems: "center", backgroundColor: "#DCEEE9", borderRadius: 18, height: 36, justifyContent: "center", marginRight: 10, width: 36 },
  avatarText: { color: "#036564", fontSize: 15, fontWeight: "800" },
  author: { color: "#32504C", fontSize: 13, fontWeight: "700" },
  date: { color: "#7A8986", fontSize: 12, marginTop: 3 },
  content: { color: "#334155", fontSize: 16, lineHeight: 25, marginTop: 22 },
  reactionActions: { alignItems: "center", borderTopColor: "#E2E8F0", borderTopWidth: 1, flexDirection: "row", gap: 18, marginTop: 20, paddingTop: 12 },
  reactionButton: { alignItems: "center", flexDirection: "row", gap: 5 },
  reactionButtonActive: { opacity: 1 },
  reactionIcon: { color: "#94A3B8", fontSize: 15 },
  reactionIconActive: { color: "#036564" },
  reactionCount: { color: "#64748B", fontSize: 13, fontWeight: "700" },
  commentsTitle: { color: "#0F172A", fontSize: 18, fontWeight: "700", marginBottom: 12, marginTop: 26 },
  commentCard: { borderLeftColor: "#D7E0E5", borderLeftWidth: 2, marginBottom: 18, paddingLeft: 14, paddingVertical: 2 },
  commentHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  commentAuthor: { color: "#64748B", flex: 1, fontSize: 13, fontWeight: "700" },
  commentContent: { color: "#334155", fontSize: 14, lineHeight: 21, marginTop: 8 },
  centered: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  errorText: { color: "#8B3434", fontSize: 15, lineHeight: 22, marginBottom: 16, textAlign: "center" },
  primaryButton: { backgroundColor: "#036564", borderRadius: 10, paddingHorizontal: 18, paddingVertical: 14 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 36 },
  emptyTitle: { color: "#0F172A", fontSize: 16, fontWeight: "700" },
  emptyText: { color: "#64748B", fontSize: 14, lineHeight: 21, marginTop: 6, textAlign: "center" },
  composerDock: { backgroundColor: "#F8FAFC", borderTopColor: "#E2E8F0", borderTopWidth: 1, paddingHorizontal: 20, paddingVertical: 10 },
  composerPill: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", borderRadius: 999, borderWidth: 1, flexDirection: "row", height: 44, justifyContent: "flex-start", paddingHorizontal: 16 },
  composerPlusWrap: { alignItems: "center", height: 20, justifyContent: "center", marginRight: 10, width: 20 },
  composerPlus: { color: "#036564", fontSize: 20, fontWeight: "400", includeFontPadding: false, lineHeight: 20, textAlign: "center", textAlignVertical: "center", transform: [{ translateY: -2 }] },
  composerPrompt: { color: "#64748B", fontSize: 14, fontWeight: "600", includeFontPadding: false, lineHeight: 20, textAlignVertical: "center" },
  composerExpanded: { backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", borderRadius: 14, borderWidth: 1, flexDirection: "row", padding: 8 },
  commentInput: { color: "#0F172A", flex: 1, fontSize: 14, lineHeight: 20, maxHeight: 110, minHeight: 44, paddingHorizontal: 8, paddingVertical: 10 },
  sendButton: { alignItems: "center", alignSelf: "flex-end", backgroundColor: "#036564", borderRadius: 22, height: 44, justifyContent: "center", marginLeft: 8, width: 44 },
  sendButtonText: { color: "#FFFFFF", fontSize: 20, transform: [{ rotate: "-12deg" }] },
  submitButton: { alignItems: "center", backgroundColor: "#036564", borderRadius: 10, justifyContent: "center", minHeight: 44, paddingHorizontal: 16 },
  submitButtonDisabled: { backgroundColor: "#A7C6C1" },
  submitButtonPressed: { opacity: 0.85 },
  submitButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  commentError: { color: "#B42318", fontSize: 12, lineHeight: 18, marginTop: 10 },
  actionError: { backgroundColor: "#FEE4E2", color: "#B42318", fontSize: 13, lineHeight: 18, marginHorizontal: 20, marginTop: 8, padding: 10 },
  moreButton: { alignSelf: "flex-end", marginTop: 8, paddingVertical: 1 },
  moreButtonText: { color: "#94A3B8", fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },
  modalOverlay: { backgroundColor: "rgba(3, 22, 52, 0.42)", flex: 1, justifyContent: "flex-end" },
  actionSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 28 },
  actionSheetTitle: { color: "#0F172A", fontSize: 18, fontWeight: "800", marginBottom: 12 },
  actionItem: { borderBottomColor: "#E2E8F0", borderBottomWidth: 1, paddingVertical: 16 },
  actionItemText: { color: "#036564", fontSize: 15, fontWeight: "700" },
  deleteActionText: { color: "#B42318", fontSize: 15, fontWeight: "700" },
  cancelAction: { alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 10, marginTop: 14, paddingVertical: 13 },
  cancelActionText: { color: "#475569", fontSize: 14, fontWeight: "700" },
  confirmModal: { backgroundColor: "#FFFFFF", borderRadius: 16, margin: 20, padding: 20 },
  confirmTitle: { color: "#0F172A", fontSize: 18, fontWeight: "800" },
  confirmText: { color: "#64748B", fontSize: 14, lineHeight: 20, marginTop: 8 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  confirmCancelButton: { alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 10, flex: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 16 },
  confirmDeleteButton: { alignItems: "center", backgroundColor: "#B42318", borderRadius: 10, flex: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 16 },
  confirmDeleteText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  editorModal: { backgroundColor: "#FFFFFF", borderRadius: 16, margin: 20, padding: 20 },
  editInput: { backgroundColor: "#F8FAFC", borderColor: "#CBD5E1", borderRadius: 10, borderWidth: 1, color: "#0F172A", fontSize: 14, marginTop: 10, padding: 12 },
  editContentInput: { minHeight: 130 },
  editorActions: { flexDirection: "row", gap: 10, marginTop: 16 },
});