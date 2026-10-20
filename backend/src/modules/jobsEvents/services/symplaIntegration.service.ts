import { prisma } from "../../../lib/auth";
import { scrapeSymplaEvents } from "./symplaScraper";
import type { EventsRepository } from "../types/EventsTypes";

export class SymplaIntegrationService {
  constructor(
    private readonly repository: EventsRepository =
      prisma as unknown as EventsRepository,
    private readonly scraper = scrapeSymplaEvents,
  ) {}

  async synchronize() {
    const scraped = await this.scraper();
    const ids = new Set(scraped.map((e) => e.externalId));

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

      // 2) expira: (a) eventos passados OU (b) sumidos da Sympla
      const now = new Date();
      const expiredResult = await tx.event.updateMany({
        where: {
          isExpired: false,
          OR: [
            { startsAt: { lt: now } },                     // já aconteceu
            { externalId: { notIn: [...ids] } },           // não está mais na lista
          ],
        },
        data: { isExpired: true },
      });
      deactivated = expiredResult.count;
    };

    if (this.repository.$transaction) {
      await this.repository.$transaction(apply);
    } else {
      await apply(this.repository);
    }

    return { fetched: scraped.length, inserted, updated, deactivated };
  }
}