import { prisma } from "../../../lib/auth";
import { scrapeSymplaEvents } from "./symplaScraper";
import type { EventsRepository } from "../types/EventsTypes";
import { isTechnologyEvent } from "../utils/category";

export class SymplaIntegrationService {
  constructor(
    private readonly repository: EventsRepository =
      prisma as unknown as EventsRepository,
    private readonly scraper = scrapeSymplaEvents,
  ) {}

  async synchronize() {
    const scraped = await this.scraper();
    if (scraped.length === 0) {
      throw new Error("Sympla returned no events; synchronization was aborted.");
    }

    let inserted = 0;
    let updated = 0;
    let deactivated = 0;

    const apply = async (tx: EventsRepository) => {
      // 1) upsert (idempotente)
      for (const ev of scraped) {
        const exists = await tx.event.findMany({
          where: { externalId: ev.externalId },
          select: { externalId: true },
          take: 1,
        });
        if (exists.length > 0) updated += 1;
        else inserted += 1;

        await tx.event.upsert({
          where: { externalId: ev.externalId },
          create: { ...ev, isExpired: false },
          update: { ...ev, isExpired: false },
        });
      }

      // 2) Expira somente eventos passados. A listagem da Sympla é paginada
      // e pode retornar apenas parte dos eventos durante uma instabilidade.
      const now = new Date();
      const expiredResult = await tx.event.updateMany({
        where: {
          isExpired: false,
          startsAt: { lt: now },
        },
        data: { isExpired: true },
      });
      deactivated = expiredResult.count;

      const activeEvents = await tx.event.findMany({
        where: { isExpired: false },
        select: { externalId: true, title: true },
      });
      for (const event of activeEvents) {
        if (!isTechnologyEvent(event.title)) {
          await tx.event.updateMany({
            where: { externalId: event.externalId },
            data: { isExpired: true },
          });
          deactivated += 1;
        }
      }
    };

    if (this.repository.$transaction) {
      await this.repository.$transaction(apply);
    } else {
      await apply(this.repository);
    }

    return { fetched: scraped.length, inserted, updated, deactivated };
  }
}