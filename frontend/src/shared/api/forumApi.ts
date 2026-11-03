import { API_URL } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ForumTopic {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  icon: string;
  discussionsCount: number;
  repliesCount: number;
}

export interface ForumAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface ForumPost {
  id: string;
  topicSlug: string;
  topicTitle?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  viewsCount: number;
  author: ForumAuthor;
  _count: {
    comments: number;
  };
  reactionCounts: {
    likes: number;
    dislikes: number;
  };
  myReaction: ForumReactionValue | null;
}

export type ForumReactionValue = "LIKE" | "DISLIKE";

export interface ForumComment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
}

export class ForumApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ForumApiError";
  }
}

export interface ForumPostsResponse {
  data: ForumPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function request<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ForumApiError(body?.message || "Não foi possível carregar o fórum no momento.", response.status);
  }

  return (await response.json()) as T;
}

export function fetchForumTopics(token: string): Promise<ForumTopic[]> {
  return request<ForumTopic[]>(token, "/api/forum/topics");
}

export async function createForumPost(
  token: string,
  input: { topicId?: string; topicSlug?: string; title: string; content: string; tags: string[] },
): Promise<ForumPost> {
  const response = await fetch(`${API_URL}/api/forum/posts`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || "Não foi possível publicar o post.");
  }

  return (await response.json()) as ForumPost;
}

export function fetchForumPosts(
  token: string,
  topicId: string,
  page = 1,
  limit = 20,
): Promise<ForumPostsResponse> {
  const query = new URLSearchParams({ topicId, page: String(page), limit: String(limit) });
  return request<ForumPostsResponse>(token, `/api/forum/posts?${query.toString()}`);
}

export function fetchForumPost(token: string, postId: string): Promise<ForumPost> {
  return request<ForumPost>(token, `/api/forum/posts/${postId}`);
}

export function fetchForumComments(token: string, postId: string): Promise<ForumComment[]> {
  return request<ForumComment[]>(token, `/api/forum/posts/${postId}/comments`);
}

const forumPostCacheKey = (postId: string): string => `connectadev:forum-post:${postId}`;

export async function cacheForumPost(post: ForumPost, comments: ForumComment[]): Promise<void> {
  await AsyncStorage.setItem(forumPostCacheKey(post.id), JSON.stringify({ post, comments }));
}

export async function getCachedForumPost(postId: string): Promise<{ post: ForumPost; comments: ForumComment[] } | null> {
  const value = await AsyncStorage.getItem(forumPostCacheKey(postId));
  if (!value) return null;
  try {
    const cached = JSON.parse(value) as { post?: ForumPost; comments?: ForumComment[] };
    if (!cached.post || !Array.isArray(cached.comments)) return null;
    return { post: cached.post, comments: cached.comments };
  } catch {
    return null;
  }
}

export async function createForumComment(
  token: string,
  postId: string,
  content: string,
): Promise<ForumComment> {
  const response = await fetch(`${API_URL}/api/forum/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ForumApiError(body?.message || "Não foi possível publicar seu comentário.", response.status);
  }

  return (await response.json()) as ForumComment;
}

export async function updateForumPost(
  token: string,
  postId: string,
  input: { title: string; content: string },
): Promise<ForumPost> {
  const response = await fetch(`${API_URL}/api/forum/posts/${postId}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || "Não foi possível editar o post.");
  }

  return (await response.json()) as ForumPost;
}

export async function deleteForumPost(token: string, postId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/forum/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || "Não foi possível excluir o post.");
  }
}

export async function updateForumComment(
  token: string,
  commentId: string,
  content: string,
): Promise<ForumComment> {
  const response = await fetch(`${API_URL}/api/forum/comments/${commentId}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || "Não foi possível editar o comentário.");
  }

  return (await response.json()) as ForumComment;
}

export async function deleteForumComment(token: string, commentId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/forum/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || "Não foi possível excluir o comentário.");
  }
}

export async function reactToForumPost(
  token: string,
  postId: string,
  value: ForumReactionValue,
): Promise<{ likes: number; dislikes: number; myReaction: ForumReactionValue | null }> {
  const response = await fetch(`${API_URL}/api/forum/posts/${postId}/reactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ value }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || "Não foi possível registrar sua avaliação.");
  }

  return (await response.json()) as { likes: number; dislikes: number; myReaction: ForumReactionValue | null };
}