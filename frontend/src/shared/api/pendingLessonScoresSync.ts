import { scoreLesson, ScoreLessonResult } from "./gamificationApi";
import {
  getPendingLessonScores,
  removePendingLessonScore,
} from "../lib/storage/pendingLessonScores";

export function isRetryableScoreError(error: unknown): boolean {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? (error as { status?: unknown }).status
      : null;

  return status === null || status === 408 || status === 429 || (typeof status === "number" && status >= 500);
}

export async function syncPendingLessonScores(
  token: string,
): Promise<ScoreLessonResult[]> {
  const pendingScores = await getPendingLessonScores();
  const syncedResults: ScoreLessonResult[] = [];

  console.log(
    `[gamification] Sincronização iniciada em ${new Date().toISOString()}. Pendências: ${pendingScores.length}`,
  );

  if (pendingScores.length === 0) {
    console.log("[gamification] Nenhuma pontuação pendente para sincronizar.");
    return syncedResults;
  }

  for (const pendingScore of pendingScores) {
    try {
      console.log(
        `[gamification] Enviando pontuação pendente da lição ${pendingScore.lessonId}.`,
      );
      const result = await scoreLesson(
        token,
        pendingScore.lessonId,
        pendingScore.answers,
      );
      await removePendingLessonScore(pendingScore.lessonId);
      syncedResults.push(result);
      console.log(
        `[gamification] Pontuação da lição ${pendingScore.lessonId} sincronizada em ${new Date().toISOString()}. XP recebido: ${result.xpEarned}.`,
      );
    } catch (error: unknown) {
      if (!isRetryableScoreError(error)) {
        await removePendingLessonScore(pendingScore.lessonId);
        console.warn(
          `[gamification] Pontuação da lição ${pendingScore.lessonId} removida após erro não retentável.`,
          error,
        );
      } else {
        console.warn(
          `[gamification] Falha temporária ao sincronizar a lição ${pendingScore.lessonId}; ela permanecerá na fila.`,
          error,
        );
      }
    }
  }

  console.log(
    `[gamification] Sincronização finalizada em ${new Date().toISOString()}. Sincronizadas: ${syncedResults.length}.`,
  );

  return syncedResults;
}
