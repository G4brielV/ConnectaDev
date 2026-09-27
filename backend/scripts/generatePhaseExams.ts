import "dotenv/config";
import { prisma } from "../src/lib/auth";
import {
  ensurePhaseQuestions,
  PHASE_CONTEXT_INCLUDE,
  toPhaseContext,
} from "../src/modules/gamification/services/getTrailPhase.service";
import { PHASE_QUESTION_POOL_TARGET } from "../src/modules/gamification/services/phaseExam";

/**
 * Pré-gera o banco de questões das fases (20 por fase; cada tentativa
 * sorteia 10 delas).
 *
 * Sem isso, a primeira pessoa a abrir cada fase espera a IA gerar a prova.
 * Este comando roda fora do caminho do usuário (depois do seed, ou num
 * deploy) e completa os bancos incompletos sem apagar o que já existe.
 *
 *   npm run trails:exams              # fases com banco incompleto
 *   npm run trails:exams -- --unit 1  # só a unidade N (de todas as áreas)
 *   npm run trails:exams -- --area "Cibersegurança"  # só a trilha da área
 *   npm run trails:exams -- --force   # apaga e refaz todos os bancos
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
  const areaArgIndex = process.argv.indexOf("--area");
  const areaFilter = areaArgIndex >= 0 ? process.argv[areaArgIndex + 1] : null;

  const force = process.argv.includes("--force");

  const candidates = await prisma.trailLesson.findMany({
    where: {
      isActive: true,
      trail: areaFilter ? { isActive: true, area: areaFilter } : { isActive: true },
      unit: unitFilter ? { sequence: unitFilter } : { isNot: null },
    },
    orderBy: [{ trailId: "asc" }, { sequence: "asc" }],
    include: {
      ...PHASE_CONTEXT_INCLUDE,
      _count: { select: { questions: { where: { isActive: true } } } },
    },
  });

  const phases = candidates.filter(
    (phase) => force || phase._count.questions < PHASE_QUESTION_POOL_TARGET,
  );

  if (phases.length === 0) {
    console.log(
      `Nenhuma fase pendente: todas já têm ${PHASE_QUESTION_POOL_TARGET} perguntas no banco.`,
    );
    return;
  }

  const incomplete = phases.filter((phase) => phase._count.questions > 0).length;
  console.log(
    `${phases.length} fase(s) a completar (${incomplete} já com parte do banco). Cada leva de 10 perguntas leva alguns segundos...`,
  );
  let generated = 0;
  let failed = 0;

  for (const phase of phases) {
    const label = `${phase.trail.area ?? "?"} F${phase.sequence} ${phase.title}`;
    const startedAt = Date.now();
    try {
      if (force && phase._count.questions > 0) {
        await prisma.trailQuestion.deleteMany({ where: { lessonId: phase.id } });
      }

      const questions = await withRetry(label, () =>
        ensurePhaseQuestions(phase.id, toPhaseContext(phase), { fillPool: true }),
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
