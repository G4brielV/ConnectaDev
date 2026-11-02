import { z } from "zod";

export const postIdParamsSchema = z.object({
  postId: z.string().uuid("O ID do post deve ser um UUID válido."),
});

export const commentIdParamsSchema = z.object({
  commentId: z.string().uuid("O ID do comentário deve ser um UUID válido."),
});

const postBodyFields = {
  topicId: z.string().uuid("O tópico deve ser um UUID válido.").optional(),
  topicSlug: z.string().min(1).optional(),
  title: z.string().trim().min(1, "O título é obrigatório.").max(100, "O título deve ter no máximo 100 caracteres."),
  content: z.string().trim().min(1, "O conteúdo é obrigatório.").max(2000, "O conteúdo deve ter no máximo 2000 caracteres."),
  tags: z.array(z.string().trim().min(1).max(40)).max(10, "Você pode adicionar no máximo 10 tags.").default([]),
} as const;

export const createPostBodySchema = z.object(postBodyFields).refine(
  (body) => Boolean(body.topicId || body.topicSlug),
  "O tópico é obrigatório.",
);

export const updatePostBodySchema = z.object(postBodyFields).partial().refine(
  (body) => Object.keys(body).length > 0,
  "Informe ao menos um campo para atualizar.",
);

export const createCommentBodySchema = z.object({
  content: z.string().trim().min(1, "O comentário não pode ser vazio.").max(1000, "Limite máximo de 1000 caracteres excedido."),
});

export const updateCommentBodySchema = createCommentBodySchema;

export const postReactionBodySchema = z.object({
  value: z.enum(["LIKE", "DISLIKE"]),
});

export const listPostsQuerySchema = z.object({
  topicId: z.string().uuid("O tópico deve ser um UUID válido.").optional(),
  topic: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePostBody = z.infer<typeof createPostBodySchema>;
export type UpdatePostBody = z.infer<typeof updatePostBodySchema>;
export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;
export type PostReactionBody = z.infer<typeof postReactionBodySchema>;