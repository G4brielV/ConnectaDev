// src/modules/events/services/symplaScraper.ts
import puppeteer, { type Browser } from "puppeteer";
import * as cheerio from "cheerio";
import { detectFormat, toFilter } from "../utils/formatEvent";
import { ScrapedEvent } from "../types/EventsTypes";
import { parseDateAndTime } from "../utils/parseDate";
import { isInRecifeMetro } from "../utils/geo";
import { inferCategory, isTechnologyEvent } from "../utils/category";

// Sites bloqueam requisições "vazias". Simular um Chrome real evita bloqueio.
const SYMPLA_URL =
  "https://www.sympla.com.br/eventos/recife-pe/tecnologia?category=collection";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export async function scrapeSymplaEvents(
  url = SYMPLA_URL,
): Promise<ScrapedEvent[]> {
  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      // Chrome sem janela visível
      headless: true,
      //Desativa bloqueio do chrome 
      args: [
        //O navegador pede um sandbox para rodar, mas o ambiente do servidor não tem suporte a isso.
        //Com essa flag o chrome roda sem o sandbox, mas é menos seguro.
        "--no-sandbox", 
        //Se o navegador não recebe o sandbox, ele tenta usar o setuid sandbox
        // ele tenta buscar o arquivo chrome-sandbox, mas também não tem acesso a ele (por falta de permissão),
        //  então desabilitamos o setuid sandbox também.
        "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    //Espera a página parar de fazer requisições de rede antes de continuar, para garantir que o conteúdo carregou.
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });

    // A listagem é dinâmica e substitui os cards anteriores durante a rolagem.
    // Por isso, cada lote precisa ser preservado antes de avançar.
    await page.waitForSelector('a[href*="/evento/"]', { timeout: 15_000 });

    const snapshots: string[] = [];
    for (let index = 0; index < 8; index += 1) {
      //Vai dando push no array de snapshots, que é o conteúdo da página a cada scroll, 
      // para depois fazer o parse de todos os eventos.
      snapshots.push(await page.content());
      await page.evaluate(() => {
        //Simula o scroll do usuário para carregar mais eventos. 
        // A página carrega mais eventos quando o usuário chega perto do final da página.
        window.scrollBy(0, Math.max(window.innerHeight * 0.8, 600));
      });
      //Após a rolagem, espera um tempo para a página carregar os novos eventos antes de tirar o próximo snapshot.
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const events: ScrapedEvent[] = [];
    //A rolagem carrega eventos duplicados, então precisamos filtrar por externalId.
    const seen = new Set<string>();

    for (const snapshot of snapshots) {
      //Transforma a string do HTML em um objeto manipulável pelo Cheerio,
      //que é uma biblioteca que permite selecionar elementos do HTML de forma semelhante ao jQuery.
      //cheerio.load() recebe uma string HTML (o que o Puppeteer te deu em page.content() e esta em snapshot) 
      // e devolve uma função $ que funciona quase igual ao jQuery.
      const $ = cheerio.load(snapshot);
      //Antes de escrever selectors, abra o site no Chrome, F12 → inspecione o card → veja o atributo mais estável
      // O $ não é a página, é uma fábrica de buscas dentro daquele HTML.
      // Cada vez que você chama $("alguma-coisa"), ele procura naquele HTML carregado.

      //Me dê todos os elementos <a> (links) cujo atributo href contenha a substring /evento/
      // retorna um objeto Cheerio tipo "coleção".
      // $(...) busca na página inteira 
      $('a[href*="/evento/"]').each((_, element) => {

        //element é o nó HTML bruto, precisamos transformá-lo em um objeto 
        // Cheerio para poder usar os métodos de busca e manipulação.
        // O $(element) transforma o nó HTML em um objeto Cheerio.
        const el = $(element);
        const href = el.attr("href")?.trim();
        if (!href) return;
        /* 
        Baseia o link completo no href do link, se não tiver http, adiciona o domínio da Sympla.
        Exemplo :
          href = "/evento/meetup-js/111"

          link = href.startsWith("http")   // false
            ? href
            : `https://www.sympla.com.br${href}`
          // → "https://www.sympla.com.br/evento/meetup-js/111"
        */

        const link = href.startsWith("http")
          ? href
          : `https://www.sympla.com.br${href}`;

        // Usa o último segmento do caminho, sem query string, como identificador estável.

        /**
          * Exemplo: /evento/meetup-js/111
          * O último segmento do caminho é "111", que é o externalId.
          * O externalId é usado para identificar eventos de forma única, mesmo que o título ou a data mudem.
          * Se o externalId já foi visto ou não existe, ignora o evento (evita duplicatas). 
        */
        const externalId =
          new URL(link)
            .pathname
              .split("/")
              .filter(Boolean)
              .pop() ?? "";
        if (!externalId || seen.has(externalId)) return;
        //el.find busca dentrodo elemento atual (o card do evento) por elementos filhos que correspondam ao seletor CSS.
        const title = el
          //Em CSS, vírgula = "OU". A busca retorna qualquer elemento que case com QUALQUER um dos seletores.
          .find('h3, [class*="event-card__title"], [class*="event-name"]')
          .first()
          .text()
          .trim();
        if (!title) return;
        if (!isTechnologyEvent(title)) return;

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
    }

    return events;
  } finally {
    await browser?.close();
  }
}