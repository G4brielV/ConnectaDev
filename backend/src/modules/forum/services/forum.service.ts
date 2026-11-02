import { prisma } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import { FORUM_CONTENT_STATUS, FORUM_TOPICS } from "../constants/forumTopics";
import type { CreateCommentBody, CreatePostBody, PostReactionBody, UpdatePostBody } from "../schemas/forum.schema";

const authorSelect = { id: true, name: true, image: true } as const;

async function findActiveTopic(topicId: string | undefined, topicSlug?: string) {
  const topic = await prisma.forumTopic.findFirst({
    where: { isActive: true, ...(topicId ? { id: topicId } : { slug: topicSlug }) },
  });
  if (!topic) throw new AppError("Tópico do fórum inválido.", 400);
  return topic;
}

function assertOwner(authorId: string, ownerId: string): void {
  if (authorId !== ownerId) throw new AppError("Você só pode alterar seu próprio conteúdo.", 403);
}

export async function listTopics() {
  const topics = await prisma.forumTopic.findMany({
    where: { isActive: true },
    orderBy: [{ sequence: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      posts: {
        where: { status: FORUM_CONTENT_STATUS.PUBLISHED },
        select: { _count: { select: { comments: { where: { status: FORUM_CONTENT_STATUS.PUBLISHED } } } } },
      },
    },
  });
  return topics.map(({ posts, ...topic }) => ({
    ...topic,
    icon: FORUM_TOPICS.find((item) => item.slug === topic.slug)?.icon ?? "•",
    discussionsCount: posts.length,
    repliesCount: posts.reduce((total, post) => total + post._count.comments, 0),
  }));
}

export async function listPosts(topicId: string | undefined, topicSlug: string | undefined, page: number, limit: number, userId?: string) {
  const topic = topicId || topicSlug ? await findActiveTopic(topicId, topicSlug) : undefined;
  const where = {
    status: FORUM_CONTENT_STATUS.PUBLISHED,
    ...(topic ? { topicId: topic.id } : {}),
  };
  const [postsWithReactions, total] = await prisma.$transaction([
    prisma.forumPost.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * limit, take: limit, include: { author: { select: authorSelect }, topic: { select: { slug: true } }, reactions: { select: { value: true, userId: true } }, _count: { select: { comments: { where: { status: FORUM_CONTENT_STATUS.PUBLISHED } } } } } }),
    prisma.forumPost.count({ where }),
  ]);
  const posts = postsWithReactions.map(({ reactions, topic: postTopic, ...post }) => ({
    ...post,
    topicSlug: postTopic?.slug || post.topicSlug,
    reactionCounts: {
      likes: reactions.filter((reaction) => reaction.value === "LIKE").length,
      dislikes: reactions.filter((reaction) => reaction.value === "DISLIKE").length,
    },
    myReaction: reactions.find((reaction) => reaction.userId === userId)?.value || null,
  }));
  return { data: posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getPost(postId: string, userId?: string) {
  const postWithReactions = await prisma.forumPost.findFirst({ where: { id: postId, status: FORUM_CONTENT_STATUS.PUBLISHED }, include: { author: { select: authorSelect }, topic: { select: { slug: true } }, reactions: { select: { value: true, userId: true } }, _count: { select: { comments: { where: { status: FORUM_CONTENT_STATUS.PUBLISHED } } } } } });
  if (!postWithReactions) throw new AppError("Post não encontrado.", 404);
  const { reactions, topic: postTopic, ...post } = postWithReactions;
  return {
    ...post,
    topicSlug: postTopic?.slug || post.topicSlug,
    reactionCounts: {
      likes: reactions.filter((reaction) => reaction.value === "LIKE").length,
      dislikes: reactions.filter((reaction) => reaction.value === "DISLIKE").length,
    },
    myReaction: reactions.find((reaction) => reaction.userId === userId)?.value || null,
  };
}

export async function reactToPost(postId: string, userId: string, input: PostReactionBody) {
  const post = await prisma.forumPost.findFirst({ where: { id: postId, status: FORUM_CONTENT_STATUS.PUBLISHED }, select: { id: true } });
  if (!post) throw new AppError("Post não encontrado.", 404);

  const existingReaction = await prisma.forumPostReaction.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  let myReaction: PostReactionBody["value"] | null = input.value;
  if (existingReaction?.value === input.value) {
    await prisma.forumPostReaction.delete({ where: { id: existingReaction.id } });
    myReaction = null;
  } else if (existingReaction) {
    await prisma.forumPostReaction.update({ where: { id: existingReaction.id }, data: { value: input.value } });
  } else {
    await prisma.forumPostReaction.create({ data: { postId, userId, value: input.value } });
  }

  const reactions = await prisma.forumPostReaction.findMany({ where: { postId }, select: { value: true } });
  return {
    likes: reactions.filter((reaction) => reaction.value === "LIKE").length,
    dislikes: reactions.filter((reaction) => reaction.value === "DISLIKE").length,
    myReaction,
  };
}

export async function createPost(authorId: string, input: CreatePostBody) {
  const topic = await findActiveTopic(input.topicId, input.topicSlug);
  const duplicateSince = new Date(Date.now() - 30_000);
  const duplicate = await prisma.forumPost.findFirst({
    where: {
      authorId,
      title: input.title,
      content: input.content,
      createdAt: { gte: duplicateSince },
      status: FORUM_CONTENT_STATUS.PUBLISHED,
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new AppError("Você já enviou uma publicação idêntica recentemente. Aguarde alguns instantes.", 429);
  }
  return prisma.forumPost.create({
    data: { topicSlug: topic.slug, topicId: topic.id, title: input.title, content: input.content, tags: input.tags, authorId },
    include: { author: { select: authorSelect }, topic: { select: { slug: true } } },
  });
}

export async function updatePost(postId: string, authorId: string, input: UpdatePostBody) {
  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post || post.status === FORUM_CONTENT_STATUS.REMOVED) throw new AppError("Post não encontrado.", 404);
  assertOwner(post.authorId, authorId);
  const topic = input.topicId || input.topicSlug ? await findActiveTopic(input.topicId, input.topicSlug) : undefined;
  return prisma.forumPost.update({
    where: { id: postId },
    data: {
      ...(input.title ? { title: input.title } : {}),
      ...(input.content ? { content: input.content } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
      ...(topic ? { topicId: topic.id, topicSlug: topic.slug } : {}),
    },
    include: { author: { select: authorSelect }, topic: { select: { slug: true } } },
  });
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
  const duplicateSince = new Date(Date.now() - 30_000);
  const duplicate = await prisma.forumComment.findFirst({
    where: {
      postId,
      authorId,
      content: input.content,
      status: FORUM_CONTENT_STATUS.PUBLISHED,
      createdAt: { gte: duplicateSince },
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new AppError("Você já enviou este comentário recentemente. Aguarde alguns instantes.", 429);
  }
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