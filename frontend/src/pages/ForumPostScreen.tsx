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
import { fetchForumComments, fetchForumPost, ForumComment, ForumPost } from "../shared/api/forumApi";
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
  const { token } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, "ForumPost">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { postId, topicTitle } = route.params;
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      <FlatList
        data={comments}
        keyExtractor={(comment) => comment.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7F6" },
  listContent: { padding: 20, paddingBottom: 32 },
  backText: { color: "#036564", fontSize: 15, fontWeight: "700", marginBottom: 18 },
  postHeader: { backgroundColor: "#FFFFFF", borderColor: "#DCE7E3", borderRadius: 12, borderWidth: 1, padding: 18 },
  topicLabel: { color: "#036564", fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  title: { color: "#183B3A", fontSize: 25, fontWeight: "800", lineHeight: 32, marginTop: 8 },
  authorRow: { alignItems: "center", flexDirection: "row", marginTop: 18 },
  avatar: { alignItems: "center", backgroundColor: "#DCEEE9", borderRadius: 18, height: 36, justifyContent: "center", marginRight: 10, width: 36 },
  avatarText: { color: "#036564", fontSize: 15, fontWeight: "800" },
  author: { color: "#32504C", fontSize: 13, fontWeight: "700" },
  date: { color: "#7A8986", fontSize: 12, marginTop: 3 },
  content: { color: "#344A47", fontSize: 16, lineHeight: 25, marginTop: 22 },
  commentsTitle: { color: "#183B3A", fontSize: 19, fontWeight: "800", marginBottom: 12, marginTop: 26 },
  commentCard: { backgroundColor: "#FFFFFF", borderColor: "#E1EBE7", borderRadius: 10, borderWidth: 1, marginBottom: 10, padding: 14 },
  commentHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  commentAuthor: { color: "#036564", flex: 1, fontSize: 13, fontWeight: "700" },
  commentContent: { color: "#4E625E", fontSize: 14, lineHeight: 21, marginTop: 8 },
  centered: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  errorText: { color: "#8B3434", fontSize: 15, lineHeight: 22, marginBottom: 16, textAlign: "center" },
  primaryButton: { backgroundColor: "#036564", borderRadius: 8, paddingHorizontal: 18, paddingVertical: 12 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 36 },
  emptyTitle: { color: "#183B3A", fontSize: 16, fontWeight: "700" },
  emptyText: { color: "#61716F", fontSize: 14, lineHeight: 21, marginTop: 6, textAlign: "center" },
});