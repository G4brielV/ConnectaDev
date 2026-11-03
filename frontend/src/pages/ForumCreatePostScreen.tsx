import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
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
import { createForumPost, fetchForumTopics, ForumTopic } from "../shared/api/forumApi";
import { clearForumDraft, getForumDraft, saveForumDraft } from "../shared/lib/storage/forumDraft";
import type { RootStackParamList } from "../app/navigation/RootNavigator";
import { colors, fonts, radius, spacing } from "../shared/config/theme";

export function ForumCreatePostScreen() {
  const { token } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, "ForumCreatePost">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadTopics(): Promise<void> {
      if (!token) {
        setIsLoadingTopics(false);
        return;
      }

      try {
        const availableTopics = await fetchForumTopics(token);
        setTopics(availableTopics);
        const requestedTopic = route.params?.topicId;
        const requestedTopicSlug = availableTopics.find((topic) => topic.id === requestedTopic)?.slug;
        setSelectedTopic(requestedTopicSlug || availableTopics[0]?.slug || "");
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar os tópicos.");
      } finally {
        setIsLoadingTopics(false);
      }
    }

    void loadTopics();
  }, [route.params?.topicId, token]);

  useEffect(() => {
    async function loadDraft(): Promise<void> {
      const draft = await getForumDraft();
      if (draft) {
        setTitle(draft.title);
        setContent(draft.content);
        setTagsText(draft.tagsText);
        if (draft.topicSlug) {
          const matchingTopic = topics.find((topic) => topic.slug === draft.topicSlug);
          setSelectedTopic(matchingTopic?.id || draft.topicSlug);
        }
      }
      setIsDraftLoaded(true);
    }

    void loadDraft();
  }, []);

  useEffect(() => {
    if (!isDraftLoaded) return;
    void saveForumDraft({ topicSlug: selectedTopic, title, content, tagsText });
  }, [content, isDraftLoaded, selectedTopic, tagsText, title]);

  function parseTags(value: string): string[] {
    return [...new Set(value.split(/[\s,]+/).map((tag) => tag.trim()).filter(Boolean))].slice(0, 10);
  }

  async function handleSubmit(): Promise<void> {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!token || isSubmitting) return;
    if (!selectedTopic) {
      setErrorMessage("O tópico é obrigatório.");
      return;
    }
    if (!trimmedTitle) {
      setErrorMessage("O título é obrigatório.");
      return;
    }
    if (trimmedTitle.length > 100) {
      setErrorMessage("O título deve ter no máximo 100 caracteres.");
      return;
    }
    if (!trimmedContent) {
      setErrorMessage("O conteúdo é obrigatório.");
      return;
    }
    if (trimmedContent.length > 2000) {
      setErrorMessage("O conteúdo deve ter no máximo 2000 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createForumPost(token, {
        topicSlug: selectedTopic,
        title: trimmedTitle,
        content: trimmedContent,
        tags: parseTags(tagsText),
      });
      await clearForumDraft();
      const topic = topics.find((item) => item.slug === selectedTopic);
      if (topic) {
        navigation.replace("ForumTopic", { topicId: topic.id, topicTitle: topic.title });
      } else {
        navigation.goBack();
      }
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível publicar o post.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityLabel="Voltar para o fórum" accessibilityRole="button" onPress={() => navigation.goBack()}>
          <View style={styles.backRow}><Feather name="arrow-left" size={16} color={colors.primary} /><Text style={styles.backText}>Fórum</Text></View>
        </Pressable>
        <Text style={styles.eyebrow}>CONNECTA<Text style={styles.eyebrowStrong}>DEV</Text></Text>
        <Text style={styles.title}>Criar post</Text>
        <Text style={styles.subtitle}>Compartilhe uma dúvida, descoberta ou ideia com a comunidade.</Text>

        <Text style={styles.label}>Tópico</Text>
        {isLoadingTopics ? (
          <ActivityIndicator color="#036564" style={styles.topicLoader} />
        ) : (
          <View style={styles.topicList}>
            {topics.map((topic) => {
              const isSelected = selectedTopic === topic.slug;
              return (
                <Pressable
                  key={topic.slug}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelectedTopic(topic.slug)}
                  style={[styles.topicOption, isSelected && styles.topicOptionSelected]}
                >
                  <Text style={[styles.topicOptionText, isSelected && styles.topicOptionTextSelected]}>{topic.title}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.label}>Título</Text>
        <TextInput
          accessibilityLabel="Título do post"
          maxLength={100}
          onChangeText={setTitle}
          placeholder="Ex.: Como começar com desenvolvimento web?"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={title}
        />

        <Text style={styles.label}>Conteúdo</Text>
        <TextInput
          accessibilityLabel="Conteúdo do post"
          multiline
          maxLength={2000}
          onChangeText={setContent}
          placeholder="Escreva os detalhes da sua dúvida ou ideia..."
          placeholderTextColor="#94A3B8"
          style={[styles.input, styles.contentInput]}
          textAlignVertical="top"
          value={content}
        />

        <Text style={styles.counter}>{content.length}/2000</Text>

        <Text style={styles.label}>Tags (opcional)</Text>
        <TextInput
          accessibilityLabel="Tags do post"
          onChangeText={setTagsText}
          placeholder="#react #node"
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={tagsText}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityLabel="Publicar post"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
          disabled={isSubmitting || isLoadingTopics}
          onPress={() => void handleSubmit()}
          style={({ pressed }) => [styles.submitButton, (isSubmitting || isLoadingTopics) && styles.submitButtonDisabled, pressed && styles.submitButtonPressed]}
        >
          {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Publicar Post</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 40 },
  backRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs, marginBottom: spacing.lg },
  backText: { color: colors.primary, fontFamily: fonts.sans.semiBold, fontSize: 14 },
  eyebrow: { color: colors.secondary, fontFamily: fonts.sans.bold, fontSize: 12, letterSpacing: 1.3, marginBottom: spacing.xs },
  eyebrowStrong: { color: colors.primary },
  title: { color: colors.textPrimary, fontFamily: fonts.sans.bold, fontSize: 28, marginBottom: spacing.sm },
  subtitle: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 14, lineHeight: 21, marginBottom: spacing.lg },
  label: { color: colors.textPrimary, fontFamily: fonts.sans.semiBold, fontSize: 14, marginBottom: spacing.sm, marginTop: spacing.md },
  topicLoader: { alignSelf: "flex-start", marginVertical: 12 },
  topicList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicOption: { backgroundColor: colors.surface, borderColor: colors.light, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  topicOptionSelected: { backgroundColor: colors.creamSoft, borderColor: colors.primary },
  topicOptionText: { color: colors.textMuted, fontFamily: fonts.sans.medium, fontSize: 13 },
  topicOptionTextSelected: { color: colors.primary, fontFamily: fonts.sans.bold },
  input: { backgroundColor: colors.surface, borderColor: colors.light, borderRadius: radius.md, borderWidth: 1, color: colors.textPrimary, fontFamily: fonts.sans.regular, fontSize: 14, minHeight: 48, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  contentInput: { minHeight: 170 },
  errorText: { color: "#B42318", fontSize: 13, lineHeight: 19, marginTop: 14 },
  counter: { color: colors.textMuted, fontFamily: fonts.sans.regular, fontSize: 12, marginTop: spacing.xs, textAlign: "right" },
  submitButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radius.pill, justifyContent: "center", marginTop: spacing.lg, minHeight: 50, paddingHorizontal: spacing.lg },
  submitButtonDisabled: { backgroundColor: colors.primarySoft },
  submitButtonPressed: { opacity: 0.85 },
  submitButtonText: { color: colors.textOnPrimary, fontFamily: fonts.sans.semiBold, fontSize: 15 },
});
