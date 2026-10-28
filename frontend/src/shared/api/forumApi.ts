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