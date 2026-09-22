import { z } from "zod";

export const getReviewQuestionsParamsSchema = z.object({
  topicId: z.string().min(1, "O ID do tópico é obrigatório."),
});

export const submitReviewParamsSchema = z.object({
  sessionId: z.string().uuid("O ID da sessão deve ser um UUID válido."),
});

export const submitReviewBodySchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1, "O ID da pergunta é obrigatório."),
      selectedOptionId: z.string().min(1, "A opção selecionada é obrigatória."),
    }),
  ).min(1, "É necessário enviar pelo menos uma resposta."),
});

export type GetReviewQuestionsParams = z.infer<typeof getReviewQuestionsParamsSchema>;
export type SubmitReviewParams = z.infer<typeof submitReviewParamsSchema>;
export type SubmitReviewBody = z.infer<typeof submitReviewBodySchema>;
