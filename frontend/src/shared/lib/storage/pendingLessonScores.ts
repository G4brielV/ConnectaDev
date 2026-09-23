import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const PENDING_SCORES_KEY = "connectadev_pending_lesson_scores";

export interface PendingLessonScore {
  lessonId: string;
  answers: Record<string, string>;
  savedAt: string;
}

const memoryStorage: Record<string, string> = {};

async function readValue(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return typeof window !== "undefined"
        ? window.localStorage.getItem(PENDING_SCORES_KEY)
        : memoryStorage[PENDING_SCORES_KEY] ?? null;
    } catch {
      return memoryStorage[PENDING_SCORES_KEY] ?? null;
    }
  }

  return SecureStore.getItemAsync(PENDING_SCORES_KEY);
}

async function writeValue(value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PENDING_SCORES_KEY, value);
        return;
      }
    } catch {
      // Fallback para memória quando o localStorage não estiver disponível.
    }
    memoryStorage[PENDING_SCORES_KEY] = value;
    return;
  }

  await SecureStore.setItemAsync(PENDING_SCORES_KEY, value);
}

export async function getPendingLessonScores(): Promise<PendingLessonScore[]> {
  const value = await readValue();
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is PendingLessonScore => {
          if (!item || typeof item !== "object") return false;
          const candidate = item as Record<string, unknown>;
          return (
            typeof candidate.lessonId === "string" &&
            typeof candidate.savedAt === "string" &&
            typeof candidate.answers === "object" &&
            candidate.answers !== null &&
            !Array.isArray(candidate.answers)
          );
        })
      : [];
  } catch {
    return [];
  }
}

export async function savePendingLessonScore(
  pendingScore: Omit<PendingLessonScore, "savedAt">,
): Promise<void> {
  const current = await getPendingLessonScores();
  const next = [
    ...current.filter((item) => item.lessonId !== pendingScore.lessonId),
    { ...pendingScore, savedAt: new Date().toISOString() },
  ];
  await writeValue(JSON.stringify(next));
}

export async function removePendingLessonScore(lessonId: string): Promise<void> {
  const current = await getPendingLessonScores();
  await writeValue(JSON.stringify(current.filter((item) => item.lessonId !== lessonId)));
}
