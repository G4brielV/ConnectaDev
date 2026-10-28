import { z } from "zod";

export const postIdParamsSchema = z.object({
  postId: z.string().uuid("O ID do post deve ser um UUID válido."),
});

export const commentIdParamsSchema = z.object({
  commentId: z.string().uuid("O ID do comentário deve ser um UUID válido."),
});

export const createPostBodySchema = z.object({
  topicSlug: z.string().min(1, "O tópico é obrigatório."),
  title: z.string().trim().min(1, "O título é obrigatório.").max(120, "O título deve ter no máximo 120 caracteres."),
  content: z.string().trim().min(1, "O conteúdo é obrigatório.").max(5000, "O post deve ter no máximo 5000 caracteres."),
});

export const updatePostBodySchema = createPostBodySchema.partial().refine(
  (body) => Object.keys(body).length > 0,
  "Informe ao menos um campo para atualizar.",
);

export const createCommentBodySchema = z.object({
  content: z.string().trim().min(1, "O conteúdo é obrigatório.").max(2000, "O comentário deve ter no máximo 2000 caracteres."),
});

export const updateCommentBodySchema = createCommentBodySchema;

export const listPostsQuerySchema = z.object({
  topic: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePostBody = z.infer<typeof createPostBodySchema>;
export type UpdatePostBody = z.infer<typeof updatePostBodySchema>;
export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;