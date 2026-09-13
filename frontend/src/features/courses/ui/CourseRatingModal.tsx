import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const MAX_COMMENT_LENGTH = 500;

export interface CourseRatingModalProps {
  visible: boolean;
  courseTitle: string;
  initialRating?: number;
  initialComment?: string | null;
  initialMatchedProfile?: boolean | null;
  isEditing?: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string, matchedProfile: boolean) => void;
}

export function CourseRatingModal({
  visible,
  courseTitle,
  initialRating = 0,
  initialComment,
  initialMatchedProfile = null,
  isEditing = false,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CourseRatingModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment || "");
  const [matchedProfile, setMatchedProfile] = useState<boolean | null>(initialMatchedProfile);
  const [ratingError, setRatingError] = useState(false);

  function handleSubmit(): void {
    if (!rating) {
      setRatingError(true);
      return;
    }

    if (matchedProfile === null) return;

    onSubmit(rating, comment.trim(), matchedProfile);
  }

  useEffect(() => {
    if (visible) {
      setRating(initialRating);
      setComment(initialComment || "");
      setMatchedProfile(initialMatchedProfile);
      setRatingError(false);
    }
  }, [initialComment, initialMatchedProfile, initialRating, visible]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Avaliar curso</Text>
          <Text style={styles.courseTitle} numberOfLines={2}>{courseTitle}</Text>
          <Text style={styles.label}>Sua nota</Text>
          <View style={[styles.stars, ratingError && styles.starsError]}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                accessibilityLabel={`${value} estrelas`}
                accessibilityRole="button"
                key={value}
                onPress={() => {
                  setRating(value);
                  setRatingError(false);
                }}
                style={styles.starButton}
              >
                <Text style={[styles.star, value <= rating && styles.starActive]}>★</Text>
              </Pressable>
            ))}
          </View>
          {ratingError && (
            <Text style={styles.ratingError}>
              Selecione uma nota de 1 a 5 estrelas antes de enviar
            </Text>
          )}
          <Text style={styles.label}>
            Este curso fez sentido com a sua área recomendada no teste?
          </Text>
          <View style={styles.profileOptions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMatchedProfile(true)}
              style={[styles.profileOption, matchedProfile === true && styles.profileOptionSelected]}
            >
              <Text style={styles.profileOptionText}>Sim, totalmente</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMatchedProfile(false)}
              style={[styles.profileOption, matchedProfile === false && styles.profileOptionSelected]}
            >
              <Text style={styles.profileOptionText}>Não fez sentido</Text>
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="Comentário da avaliação"
            multiline
            maxLength={MAX_COMMENT_LENGTH}
            onChangeText={(value) => setComment(value.slice(0, MAX_COMMENT_LENGTH))}
            placeholder="Comentário opcional"
            style={styles.input}
            value={comment}
          />
          <Text
            style={[
              styles.commentCounter,
              comment.length === MAX_COMMENT_LENGTH && styles.commentCounterWarning,
            ]}
          >
            {comment.length}/{MAX_COMMENT_LENGTH}
          </Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
            >
              <Text style={styles.submitText}>
                {isSubmitting ? "Enviando..." : isEditing ? "Atualizar Avaliação" : "Enviar Avaliação"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: "center", backgroundColor: "rgba(3, 22, 52, 0.55)", flex: 1, justifyContent: "center", padding: 20 },
  container: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, width: "100%" },
  title: { color: "#031634", fontSize: 20, fontWeight: "800" },
  courseTitle: { color: "#60717A", fontSize: 14, marginTop: 6 },
  label: { color: "#033649", fontSize: 13, fontWeight: "700", marginTop: 20 },
  stars: { borderColor: "transparent", borderRadius: 8, borderWidth: 1, flexDirection: "row", marginTop: 6, padding: 2 },
  starsError: { borderColor: "#D95D39" },
  starButton: { paddingRight: 6 },
  star: { color: "#D7DCE0", fontSize: 34 },
  starActive: { color: "#F4B942" },
  ratingError: { color: "#B13A24", fontSize: 12, marginTop: 4 },
  profileOptions: { flexDirection: "row", gap: 8, marginTop: 8 },
  profileOption: { borderColor: "#D7E0E3", borderRadius: 8, borderWidth: 1, flex: 1, padding: 10 },
  profileOptionSelected: { backgroundColor: "#E5F1F7", borderColor: "#036564" },
  profileOptionText: { color: "#033649", fontSize: 12, fontWeight: "700", textAlign: "center" },
  input: { borderColor: "#D7E0E3", borderRadius: 8, borderWidth: 1, color: "#031634", height: 100, marginTop: 16, padding: 12, textAlignVertical: "top" },
  commentCounter: { color: "#60717A", fontSize: 12, marginTop: 4, textAlign: "right" },
  commentCounterWarning: { color: "#B13A24", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 18 },
  cancelButton: { justifyContent: "center", paddingHorizontal: 10 },
  cancelText: { color: "#60717A", fontWeight: "700" },
  submitButton: { backgroundColor: "#036564", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12 },
  disabledButton: { opacity: 0.5 },
  submitText: { color: "#FFFFFF", fontWeight: "700" },
});