import "dotenv/config";
import { prisma } from "../src/lib/auth";
import { ensurePhaseQuestions } from "../src/modules/gamification/services/getTrailPhase.service";
import { PHASE_EXAM_MIN_QUESTIONS } from "../src/modules/reviews/services/generateReviewQuestions.service";

/**
 * Pré-gera a prova das fases que ainda não têm questões.
 *
 * A geração leva ~45s por fase, então deixá-la acontecer quando o estudante
 * abre a fase seria uma espera inaceitável. Este comando roda fora do caminho
 * do usuário (depois do seed, ou num deploy) e as questões ficam cacheadas.
 *
 *   npm run trails:exams              # fases sem prova ou abaixo do mínimo
 *   npm run trails:exams -- --unit 1  # só a unidade N
 *   npm run trails:exams -- --force   # refaz mesmo as provas já completas
 */
const MAX_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A API de IA falha de forma intermitente (503 de sobrecarga, JSON truncado).
 * Numa geração em lote isso é normal, então cada fase tem novas chances com
 * espera crescente antes de ser dada como perdida.
 */
async function withRetry<T>(label: string, run: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        // O provedor costuma dizer exatamente quanto esperar no rate limit;
        // obedecer isso é muito melhor que um backoff fixo no chute.
        const suggested = extractRetryAfterMs(error);
        const waitMs = suggested ?? attempt * 5_000;
        console.log(
          `  ...  ${label} — tentativa ${attempt} falhou, repetindo em ${(waitMs / 1000).toFixed(1)}s`,
        );
        await sleep(waitMs);
      }
    }
  }

  throw lastError;
}

function extractRetryAfterMs(error: unknown): number | null {
  const details = (error as { details?: { retryAfterMs?: number } })?.details;
  if (typeof details?.retryAfterMs === "number") {
    // Margem de 250ms: o limite é por janela e chegar no limiar exato repete a falha.
    return details.retryAfterMs + 250;
  }
  return null;
}

async function main(): Promise<void> {
  const unitArgIndex = process.argv.indexOf("--unit");
  const unitFilter = unitArgIndex >= 0 ? Number(process.argv[unitArgIndex + 1]) : null;

  const force = process.argv.includes("--force");

  const candidates = await prisma.trailLesson.findMany({
    where: {
      isActive: true,
      trail: { isActive: true },
      unit: unitFilter ? { sequence: unitFilter } : { isNot: null },
    },
    orderBy: { sequence: "asc" },
    include: {
      unit: { select: { title: true, sequence: true } },
      trail: { select: { area: true } },
      resources: { orderBy: { sequence: "asc" }, select: { title: true } },
      _count: { select: { questions: { where: { isActive: true } } } },
    },
  });

  // Provas geradas antes do piso de 10 perguntas também entram na fila.
  const phases = candidates.filter(
    (phase) => force || phase._count.questions < PHASE_EXAM_MIN_QUESTIONS,
  );

  if (phases.length === 0) {
    console.log(
      `Nenhuma fase pendente: todas já têm ao menos ${PHASE_EXAM_MIN_QUESTIONS} perguntas.`,
    );
    return;
  }

  const incomplete = phases.filter((phase) => phase._count.questions > 0).length;
  console.log(
    `${phases.length} fase(s) a gerar (${incomplete} com prova abaixo de ${PHASE_EXAM_MIN_QUESTIONS} perguntas). Isso leva ~1min por fase...`,
  );
  let generated = 0;
  let failed = 0;

  for (const phase of phases) {
    const label = `U${phase.unit?.sequence ?? "?"} F${phase.sequence} ${phase.title}`;
    const startedAt = Date.now();
    try {
      if (phase._count.questions > 0) {
        await prisma.trailQuestion.deleteMany({ where: { lessonId: phase.id } });
      }

      const questions = await withRetry(label, () =>
        ensurePhaseQuestions(phase.id, {
          title: phase.title,
          description: phase.description,
          unitTitle: phase.unit?.title ?? phase.title,
          area: phase.trail.area ?? "Tecnologia",
          resourceTitles: phase.resources.map((resource) => resource.title),
        }),
      );
      generated += 1;
      console.log(
        `  ok   ${label} — ${questions.length} questões em ${Math.round((Date.now() - startedAt) / 1000)}s`,
      );
    } catch (error) {
      failed += 1;
      console.warn(
        `  FALHA ${label} — ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log(`\nConcluído: ${generated} gerada(s), ${failed} falha(s).`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error("Falha ao gerar as provas das fases.", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
