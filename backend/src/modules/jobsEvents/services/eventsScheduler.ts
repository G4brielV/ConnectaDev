// src/modules/events/services/eventsScheduler.ts
import cron, { type ScheduledTask } from "node-cron";
import { SymplaIntegrationService } from "./symplaIntegration.service";

const DEFAULT_CRON = "0 4 * * *"; // todos os dias às 04:00
const DEFAULT_TZ = "America/Recife";

export function startEventsSynchronization(
  service = new SymplaIntegrationService(),
  logger: Pick<Console, "error" | "info"> = console,
  options: { cronExpression?: string; timezone?: string; runOnStart?: boolean } = {},
): ScheduledTask | undefined {
  const cronExpression =
    options.cronExpression ?? process.env.EVENTS_SYNC_CRON ?? DEFAULT_CRON;
  const timezone =
    options.timezone ?? process.env.EVENTS_SYNC_TIMEZONE ?? DEFAULT_TZ;

  // (1) Valida a expressão — se você errar, o processo não sobe
  if (!cron.validate(cronExpression)) {
    throw new Error(`Expressão cron inválida: ${cronExpression}`);
  }

  // (2) Trava contra execuções sobrepostas (Puppeteer pode levar minutos)
  let running = false;

  const runOnce = async () => {
    if (running) {
      logger.info(JSON.stringify({
        event: "CRON_EVENTS_SYNC_SKIPPED",
        reason: "previous_cycle_running",
        timestamp: new Date().toISOString(),
      }));
      return;
    }
    running = true;
    logger.info(JSON.stringify({
      event: "CRON_EVENTS_SYNC_STARTED",
      timestamp: new Date().toISOString(),
      schedule: cronExpression,
      timezone,
    }));
    try {
      const result = await service.synchronize();
      logger.info(JSON.stringify({
        event: "CRON_EVENTS_SYNC_COMPLETED",
        timestamp: new Date().toISOString(),
        ...result,
      }));
    } catch (err) {
      logger.error(JSON.stringify({
        event: "CRON_EVENTS_SYNC_ERROR",
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? { name: err.name, message: err.message } : err,
      }));
    } finally {
      running = false;
    }
  };

  // (3) Registra o timer. A partir daqui, o Node mantém um "alarme" ativo.
  const task = cron.schedule(cronExpression, () => void runOnce(), { timezone });

  // (4) Se quiser preencher o banco já no boot (default true, como no jobs)
  if (options.runOnStart ?? process.env.EVENTS_SYNC_RUN_ON_START !== "false") {
    void runOnce();
  }

  return task;
}