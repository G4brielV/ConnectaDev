import { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../../lib/auth";
import { AppError } from "../../../shared/errors/AppError";
import {
  commentIdParamsSchema,
  createCommentBodySchema,
  createPostBodySchema,
  listPostsQuerySchema,
  postIdParamsSchema,
  updateCommentBodySchema,
  updatePostBodySchema,
} from "../schemas/forum.schema";
import {
  createComment,
  createPost,
  getPost,
  listComments,
  listPosts,
  listTopics,
  removeComment,
  removePost,
  updateComment,
  updatePost,
} from "../services/forum.service";

type PostParams = { Params: { postId: string } };
type CommentParams = { Params: { commentId: string } };
type PostBodyRequest<T> = { Params: { postId: string }; Body: T };
type CommentBodyRequest<T> = { Params: { commentId: string }; Body: T };

function requestHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(","));
  }
  return headers;
}

async function authenticatedUser(request: FastifyRequest): Promise<string> {
  const session = await auth.api.getSession({ headers: requestHeaders(request) });
  if (!session) throw new AppError("É necessário estar autenticado para usar o fórum.", 401);
  return session.user.id;
}

function validationMessage(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

export async function listTopicsController(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await listTopics());
}

export async function listPostsController(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listPostsQuerySchema.safeParse(request.query);
  if (!parsed.success) throw new AppError(validationMessage(parsed.error), 400);
  return reply.send(await listPosts(parsed.data.topic, parsed.data.page, parsed.data.limit));
}

export async function getPostController(request: FastifyRequest<PostParams>, reply: FastifyReply) {
  const parsed = postIdParamsSchema.safeParse(request.params);
  if (!parsed.success) throw new AppError(validationMessage(parsed.error), 400);
  return reply.send(await getPost(parsed.data.postId));
}

export async function createPostController(request: FastifyRequest<{ Body: unknown }>, reply: FastifyReply) {
  const authorId = await authenticatedUser(request);
  const parsed = createPostBodySchema.safeParse(request.body);
  if (!parsed.success) throw new AppError(validationMessage(parsed.error), 400);
  return reply.status(201).send(await createPost(authorId, parsed.data));
}

export async function updatePostController(request: FastifyRequest<PostBodyRequest<unknown>>, reply: FastifyReply) {
  const authorId = await authenticatedUser(request);
  const params = postIdParamsSchema.safeParse(request.params);
  const body = updatePostBodySchema.safeParse(request.body);
  if (!params.success) throw new AppError(validationMessage(params.error), 400);
  if (!body.success) throw new AppError(validationMessage(body.error), 400);
  return reply.send(await updatePost(params.data.postId, authorId, body.data));
}

export async function removePostController(request: FastifyRequest<PostParams>, reply: FastifyReply) {
  const authorId = await authenticatedUser(request);
  const parsed = postIdParamsSchema.safeParse(request.params);
  if (!parsed.success) throw new AppError(validationMessage(parsed.error), 400);
  await removePost(parsed.data.postId, authorId);
  return reply.status(204).send();
}

export async function listCommentsController(request: FastifyRequest<PostParams>, reply: FastifyReply) {
  const parsed = postIdParamsSchema.safeParse(request.params);
  if (!parsed.success) throw new AppError(validationMessage(parsed.error), 400);
  return reply.send(await listComments(parsed.data.postId));
}

export async function createCommentController(request: FastifyRequest<PostBodyRequest<unknown>>, reply: FastifyReply) {
  const authorId = await authenticatedUser(request);
  const params = postIdParamsSchema.safeParse(request.params);
  const body = createCommentBodySchema.safeParse(request.body);
  if (!params.success) throw new AppError(validationMessage(params.error), 400);
  if (!body.success) throw new AppError(validationMessage(body.error), 400);
  return reply.status(201).send(await createComment(params.data.postId, authorId, body.data));
}

export async function updateCommentController(request: FastifyRequest<CommentBodyRequest<unknown>>, reply: FastifyReply) {
  const authorId = await authenticatedUser(request);
  const params = commentIdParamsSchema.safeParse(request.params);
  const body = updateCommentBodySchema.safeParse(request.body);
  if (!params.success) throw new AppError(validationMessage(params.error), 400);
  if (!body.success) throw new AppError(validationMessage(body.error), 400);
  return reply.send(await updateComment(params.data.commentId, authorId, body.data.content));
}

export async function removeCommentController(request: FastifyRequest<CommentParams>, reply: FastifyReply) {
  const authorId = await authenticatedUser(request);
  const parsed = commentIdParamsSchema.safeParse(request.params);
  if (!parsed.success) throw new AppError(validationMessage(parsed.error), 400);
  await removeComment(parsed.data.commentId, authorId);
  return reply.status(204).send();
}