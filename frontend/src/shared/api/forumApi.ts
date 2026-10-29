import { API_URL } from "../config/api";

export interface ForumTopic {
  slug: string;
  title: string;
}

export interface ForumAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface ForumPost {
  id: string;
  topicSlug: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
  _count: {
    comments: number;
  };
}

export interface ForumComment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
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
    throw new Error("Não foi possível carregar o fórum no momento.");
  }

  return (await response.json()) as T;
}

export function fetchForumTopics(token: string): Promise<ForumTopic[]> {
  return request<ForumTopic[]>(token, "/api/forum/topics");
}

export async function createForumPost(
  token: string,
  input: { topicSlug: string; title: string; content: string },
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
  topicSlug: string,
  page = 1,
  limit = 20,
): Promise<ForumPostsResponse> {
  const query = new URLSearchParams({ topic: topicSlug, page: String(page), limit: String(limit) });
  return request<ForumPostsResponse>(token, `/api/forum/posts?${query.toString()}`);
}

export function fetchForumPost(token: string, postId: string): Promise<ForumPost> {
  return request<ForumPost>(token, `/api/forum/posts/${postId}`);
}

export function fetchForumComments(token: string, postId: string): Promise<ForumComment[]> {
  return request<ForumComment[]>(token, `/api/forum/posts/${postId}/comments`);
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
    throw new Error(body?.message || "Não foi possível publicar seu comentário.");
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