import { prisma } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { FORUM_CONTENT_STATUS, FORUM_TOPICS, isForumTopic } from "../constants/forumTopics";
import type { CreateCommentBody, CreatePostBody, UpdatePostBody } from "../schemas/forum.schema";

const authorSelect = { id: true, name: true, image: true } as const;

function assertTopic(topicSlug: string): void {
  if (!isForumTopic(topicSlug)) throw new AppError("Tópico do fórum inválido.", 400);
}

function assertOwner(authorId: string, ownerId: string): void {
  if (authorId !== ownerId) throw new AppError("Você só pode alterar seu próprio conteúdo.", 403);
}

export async function listTopics() { return FORUM_TOPICS; }

export async function listPosts(topicSlug: string | undefined, page: number, limit: number) {
  if (topicSlug) assertTopic(topicSlug);
  const where = {
    status: FORUM_CONTENT_STATUS.PUBLISHED,
    ...(topicSlug ? { topicSlug } : {}),
  };
  const [posts, total] = await prisma.$transaction([
    prisma.forumPost.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * limit, take: limit, include: { author: { select: authorSelect }, _count: { select: { comments: { where: { status: FORUM_CONTENT_STATUS.PUBLISHED } } } } } }),
    prisma.forumPost.count({ where }),
  ]);
  return { data: posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getPost(postId: string) {
  const post = await prisma.forumPost.findFirst({ where: { id: postId, status: FORUM_CONTENT_STATUS.PUBLISHED }, include: { author: { select: authorSelect }, _count: { select: { comments: { where: { status: FORUM_CONTENT_STATUS.PUBLISHED } } } } } });
  if (!post) throw new AppError("Post não encontrado.", 404);
  return post;
}

export async function createPost(authorId: string, input: CreatePostBody) {
  assertTopic(input.topicSlug);
  return prisma.forumPost.create({ data: { ...input, authorId }, include: { author: { select: authorSelect } } });
}

export async function updatePost(postId: string, authorId: string, input: UpdatePostBody) {
  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post || post.status === FORUM_CONTENT_STATUS.REMOVED) throw new AppError("Post não encontrado.", 404);
  assertOwner(post.authorId, authorId);
  if (input.topicSlug) assertTopic(input.topicSlug);
  return prisma.forumPost.update({ where: { id: postId }, data: input, include: { author: { select: authorSelect } } });
}

export async function removePost(postId: string, authorId: string) {
  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post || post.status === FORUM_CONTENT_STATUS.REMOVED) throw new AppError("Post não encontrado.", 404);
  assertOwner(post.authorId, authorId);
  const deletedAt = new Date();
  await prisma.$transaction([
    prisma.forumPost.update({ where: { id: postId }, data: { status: FORUM_CONTENT_STATUS.REMOVED, deletedAt } }),
    prisma.forumComment.updateMany({ where: { postId, status: FORUM_CONTENT_STATUS.PUBLISHED }, data: { status: FORUM_CONTENT_STATUS.REMOVED, deletedAt } }),
  ]);
}

export async function listComments(postId: string) {
  const post = await prisma.forumPost.findFirst({ where: { id: postId, status: FORUM_CONTENT_STATUS.PUBLISHED }, select: { id: true } });
  if (!post) throw new AppError("Post não encontrado.", 404);
  return prisma.forumComment.findMany({ where: { postId, status: FORUM_CONTENT_STATUS.PUBLISHED }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], include: { author: { select: authorSelect } } });
}

export async function createComment(postId: string, authorId: string, input: CreateCommentBody) {
  const post = await prisma.forumPost.findFirst({ where: { id: postId, status: FORUM_CONTENT_STATUS.PUBLISHED }, select: { id: true } });
  if (!post) throw new AppError("Post não encontrado.", 404);
  return prisma.forumComment.create({ data: { postId, authorId, content: input.content }, include: { author: { select: authorSelect } } });
}

export async function updateComment(commentId: string, authorId: string, content: string) {
  const comment = await prisma.forumComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.status === FORUM_CONTENT_STATUS.REMOVED) throw new AppError("Comentário não encontrado.", 404);
  assertOwner(comment.authorId, authorId);
  return prisma.forumComment.update({ where: { id: commentId }, data: { content }, include: { author: { select: authorSelect } } });
}

export async function removeComment(commentId: string, authorId: string) {
  const comment = await prisma.forumComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.status === FORUM_CONTENT_STATUS.REMOVED) throw new AppError("Comentário não encontrado.", 404);
  assertOwner(comment.authorId, authorId);
  await prisma.forumComment.update({ where: { id: commentId }, data: { status: FORUM_CONTENT_STATUS.REMOVED, deletedAt: new Date() } });
}