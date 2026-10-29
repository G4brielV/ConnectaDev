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
import { useAuth } from "../entities/session";
import { createForumPost, fetchForumTopics, ForumTopic } from "../shared/api/forumApi";
import type { RootStackParamList } from "../app/navigation/RootNavigator";

export function ForumCreatePostScreen() {
  const { token } = useAuth();
  const route = useRoute<RouteProp<RootStackParamList, "ForumCreatePost">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
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
        const requestedTopic = route.params?.topicSlug;
        const requestedTopicExists = availableTopics.some((topic) => topic.slug === requestedTopic);
        setSelectedTopic(requestedTopicExists ? requestedTopic || "" : availableTopics[0]?.slug || "");
      } catch (error: unknown) {
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar os tópicos.");
      } finally {
        setIsLoadingTopics(false);
      }
    }

    void loadTopics();
  }, [route.params?.topicSlug, token]);

  async function handleSubmit(): Promise<void> {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!token || isSubmitting) return;
    if (!selectedTopic || !trimmedTitle || !trimmedContent) {
      setErrorMessage("Escolha um tópico e preencha o título e o conteúdo.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createForumPost(token, {
        topicSlug: selectedTopic,
        title: trimmedTitle,
        content: trimmedContent,
      });
      const topicTitle = topics.find((topic) => topic.slug === selectedTopic)?.title || "Fórum";
      navigation.replace("ForumTopic", { topicSlug: selectedTopic, topicTitle });
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
          <Text style={styles.backText}>‹ Fórum</Text>
        </Pressable>
        <Text style={styles.eyebrow}>COMUNIDADE CONNECTADEV</Text>
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
          maxLength={120}
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
          maxLength={5000}
          onChangeText={setContent}
          placeholder="Escreva os detalhes da sua dúvida ou ideia..."
          placeholderTextColor="#94A3B8"
          style={[styles.input, styles.contentInput]}
          textAlignVertical="top"
          value={content}
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
          {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Publicar post</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#F8FAFC", flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  backText: { color: "#036564", fontSize: 14, fontWeight: "700", marginBottom: 22 },
  eyebrow: { alignSelf: "flex-start", backgroundColor: "#E0F2F1", borderRadius: 999, color: "#036564", fontSize: 11, fontWeight: "800", marginBottom: 8, paddingHorizontal: 10, paddingVertical: 4 },
  title: { color: "#0F172A", fontSize: 28, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#64748B", fontSize: 14, lineHeight: 21, marginBottom: 24 },
  label: { color: "#0F172A", fontSize: 14, fontWeight: "700", marginBottom: 8, marginTop: 16 },
  topicLoader: { alignSelf: "flex-start", marginVertical: 12 },
  topicList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicOption: { backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  topicOptionSelected: { backgroundColor: "#E0F2F1", borderColor: "#036564" },
  topicOptionText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  topicOptionTextSelected: { color: "#036564", fontWeight: "800" },
  input: { backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", borderRadius: 10, borderWidth: 1, color: "#0F172A", fontSize: 14, minHeight: 48, paddingHorizontal: 14, paddingVertical: 12 },
  contentInput: { minHeight: 170 },
  errorText: { color: "#B42318", fontSize: 13, lineHeight: 19, marginTop: 14 },
  submitButton: { alignItems: "center", backgroundColor: "#036564", borderRadius: 10, justifyContent: "center", marginTop: 24, minHeight: 50, paddingHorizontal: 18 },
  submitButtonDisabled: { backgroundColor: "#A7C6C1" },
  submitButtonPressed: { opacity: 0.85 },
  submitButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
