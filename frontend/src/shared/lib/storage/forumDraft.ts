import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DRAFT_KEY = "connectadev_forum_draft";

export interface ForumDraft {
  topicSlug: string;
  title: string;
  content: string;
  tagsText: string;
}

const memoryStorage: Record<string, string> = {};

async function readValue(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return typeof window !== "undefined" ? window.localStorage.getItem(DRAFT_KEY) : memoryStorage[DRAFT_KEY] ?? null;
    } catch {
      return memoryStorage[DRAFT_KEY] ?? null;
    }
  }
  return SecureStore.getItemAsync(DRAFT_KEY);
}

async function writeValue(value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(DRAFT_KEY, value);
        return;
      }
    } catch {
      // Falls back to memory when local storage is unavailable.
    }
    memoryStorage[DRAFT_KEY] = value;
    return;
  }
  await SecureStore.setItemAsync(DRAFT_KEY, value);
}

export async function getForumDraft(): Promise<ForumDraft | null> {
  const value = await readValue();
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<ForumDraft>;
    if (typeof parsed.title !== "string" || typeof parsed.content !== "string" || typeof parsed.tagsText !== "string") return null;
    return { topicSlug: typeof parsed.topicSlug === "string" ? parsed.topicSlug : "", title: parsed.title, content: parsed.content, tagsText: parsed.tagsText };
  } catch {
    return null;
  }
}

export async function saveForumDraft(draft: ForumDraft): Promise<void> {
  await writeValue(JSON.stringify(draft));
}

export async function clearForumDraft(): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_KEY);
        return;
      }
    } catch {
      // Falls back to memory when local storage is unavailable.
    }
    delete memoryStorage[DRAFT_KEY];
    return;
  }
  await SecureStore.deleteItemAsync(DRAFT_KEY);
}
