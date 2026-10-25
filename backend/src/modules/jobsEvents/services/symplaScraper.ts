// src/modules/events/services/symplaScraper.ts
import puppeteer, { type Browser } from "puppeteer";
import * as cheerio from "cheerio";
import { detectFormat, toFilter } from "../utils/formatEvent";
import { ScrapedEvent } from "../types/EventsTypes";
import { parseDateAndTime } from "../utils/parseDate";
import { isInRecifeMetro } from "../utils/geo";
import { inferCategory } from "../utils/category";

const SYMPLA_URL = "https://www.sympla.com.br/eventos/recife-pe/tecnologia";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function scrapeSymplaEvents(
  url = SYMPLA_URL,
): Promise<ScrapedEvent[]> {
  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });

    // 1) Rola para carregar lazy-loaded
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let total = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, 800);
          total += 800;
          if (total >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 120);
      });
    });

    // 2) Espera os cards de evento
    await page.waitForSelector('a[href*="/evento/"]', { timeout: 15_000 });

    const html = await page.content();
    const $ = cheerio.load(html);

    const events: ScrapedEvent[] = [];
    const seen = new Set<string>();

    $('a[href*="/evento/"]').each((_, element) => {
      const el = $(element);
      const href = el.attr("href")?.trim();
      if (!href) return;

      const link = href.startsWith("http")
        ? href
        : `https://www.sympla.com.br${href}`;

      // Usa o último segmento do caminho, sem query string, como identificador estável.
      const externalId =
        new URL(link).pathname.split("/").filter(Boolean).pop() ?? "";
      if (!externalId || seen.has(externalId)) return;

      const title = el
        .find('h3, [class*="event-card__title"], [class*="event-name"]')
        .first()
        .text()
        .trim();
      if (!title) return;

      // Sympla costuma ter estrutura "25 OUT" + "19:00" ou data por extenso
      const dateText = el
        .find('[class*="date"], [class*="event-card__date"], [class*="qtfy"], time')
        .first()
        .text()
        .trim();
      const locationText = el
        .find('[class*="location"], [class*="event-card__location"], address, p')
        .first()
        .text()
        .trim();

      const parsed = parseDateAndTime(dateText);
      if (!parsed) return; // descarta se não conseguir data

      const format = detectFormat(`${el.text()} ${locationText}`);

      // Categoria derivada do título (rápido e sem chamar API)
      const category = inferCategory(title);

      // Só mantém RMR (ou Online, que não tem restrição geográfica)
      const isOnline = format === "Online";
      if (!isOnline && !isInRecifeMetro(locationText)) return;

      seen.add(externalId);
      events.push({
        externalId,
        day: parsed.day,
        month: parsed.month,
        time: parsed.time,
        startsAt: parsed.startsAt,
        title,
        category,
        location: locationText || (isOnline ? "Online" : "Recife, PE"),
        format,
        filter: toFilter(format),
        link,
      });
    });

    return events;
  } finally {
    await browser?.close();
  }
}