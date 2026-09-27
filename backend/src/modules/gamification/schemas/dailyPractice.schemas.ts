import { z } from "zod";

export const practiceSessionParamsSchema = z.object({
  sessionId: z.string().uuid("O ID da prática deve ser um UUID válido."),
});

export const practiceAnswerBodySchema = z.object({
  questionId: z.string().uuid("O ID da pergunta deve ser um UUID válido."),
  selectedOptionId: z.string().min(1, "A alternativa escolhida é obrigatória."),
});

export type PracticeSessionParams = z.infer<typeof practiceSessionParamsSchema>;
export type PracticeAnswerBody = z.infer<typeof practiceAnswerBodySchema>;
