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
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../entities/session";
import { fetchForumTopics, ForumTopic } from "../shared/api/forumApi";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { colors, fonts, radius, shadow, spacing } from "../shared/config/theme";
import { XpProgressBar } from "../shared/ui/XpProgressBar/XpProgressBar";

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
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Carregando discussões...</Text></View>;
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
      <XpProgressBar />
      <FlatList
        data={topics}
        keyExtractor={(topic) => topic.slug}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadTopics(true)} tintColor="#036564" />}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>CONNECTA<Text style={styles.eyebrowStrong}>DEV</Text></Text>
              <Text style={styles.title}>Fórum</Text>
              <Text style={styles.subtitle}>Encontre conversas sobre tecnologia, carreira e aprendizado.</Text>
            </View>
            <View style={styles.headerIcon}><Feather name="message-circle" size={24} color={colors.primary} /></View>
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
            onPress={() => navigation.navigate("ForumTopic", { topicId: item.id, topicTitle: item.title })}
            style={({ pressed }) => [styles.topicRow, pressed && styles.topicRowPressed]}
          >
            <View style={styles.topicIcon}><Text style={styles.topicIconText}>{item.icon}</Text></View>
            <View style={styles.topicContent}>
              <Text style={styles.topicTitle}>{item.title}</Text>
              <Text style={styles.topicAction}>{item.discussionsCount} discussões • {item.repliesCount} respostas</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.primary} />
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
          <Feather name="plus" size={24} color={colors.textOnPrimary} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  listContent: { padding: spacing.lg, paddingBottom: 104 },
  headerRow: { alignItems: "center", flexDirection: "row", paddingTop: spacing.sm },
  header: { flex: 1, marginBottom: spacing.lg, paddingRight: spacing.md },
  eyebrow: { color: colors.secondary, fontFamily: fonts.sans.bold, fontSize: 12, letterSpacing: 1.3 },
  eyebrowStrong: { color: colors.primary },
  title: { color: colors.textPrimary, fontFamily: fonts.sans.bold, fontSize: 26, marginTop: spacing.xs, marginBottom: spacing.sm },
  headerIcon: { alignItems: "center", backgroundColor: colors.creamSoft, borderRadius: radius.lg, height: 52, justifyContent: "center", width: 52 },
  createDock: { bottom: spacing.md, position: "absolute", right: spacing.md },
  createButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.pill, height: 54, justifyContent: "center", width: 54, ...shadow.card },
  createButtonPressed: { opacity: 0.82 },
  createButtonText: { color: "#FFFFFF", fontSize: 26, fontWeight: "300", includeFontPadding: false, lineHeight: 30, textAlign: "center", textAlignVertical: "center", transform: [{ translateY: -2 }] },
  subtitle: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 14, lineHeight: 20 },
  topicRow: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, flexDirection: "row", minHeight: 76, marginBottom: spacing.sm, padding: spacing.md, ...shadow.card },
  topicRowPressed: { backgroundColor: colors.creamSoft },
  topicContent: { flex: 1 },
  topicIcon: { alignItems: "center", backgroundColor: colors.creamSoft, borderRadius: radius.md, height: 42, justifyContent: "center", marginRight: spacing.sm, width: 42 },
  topicIconText: { color: colors.primary, fontSize: 21, fontWeight: "700" },
  topicTitle: { color: colors.textPrimary, fontFamily: fonts.sans.semiBold, fontSize: 15 },
  topicAction: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 13, marginTop: spacing.xs },
  centered: { alignItems: "center", backgroundColor: colors.canvas, flex: 1, justifyContent: "center", padding: spacing.lg },
  loadingText: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 13, marginTop: spacing.sm },
  errorText: { color: colors.danger, fontFamily: fonts.sans.medium, fontSize: 15, lineHeight: 22, marginBottom: spacing.md, textAlign: "center" },
  primaryButton: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  primaryButtonText: { color: colors.textOnPrimary, fontFamily: fonts.sans.semiBold, fontSize: 14 },
  emptyState: { alignItems: "center", paddingVertical: spacing.xl },
  emptyTitle: { color: colors.textPrimary, fontFamily: fonts.sans.semiBold, fontSize: 17 },
  emptyText: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 14, marginTop: spacing.xs },
});
