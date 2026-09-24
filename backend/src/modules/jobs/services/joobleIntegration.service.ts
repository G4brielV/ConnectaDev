import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../../lib/auth";

const JOOBLE_API_URL = "https://br.jooble.org/api";
const RMR_LOCATION = "Recife, Pernambuco";
const DEFAULT_SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_MAX_PAGES = 2;
const DEFAULT_BATCH_SIZE = 10;

const CATEGORY_KEYWORDS = {
  Backend: "estágio junior backend tecnologia",
  Frontend: "estágio junior frontend tecnologia",
  Mobile: "estágio junior mobile tecnologia",
  Dados: "estágio junior dados tecnologia",
  QA: "estágio junior QA tecnologia",
} as const;

export type JobCategory = keyof typeof CATEGORY_KEYWORDS;

interface JoobleJob {
  id: number | string;
  title: string;
  location: string;
  snippet?: string;
  salary?: string;
  link: string;
  company?: string;
  updated?: string;
}

interface JoobleResponse {
  jobs?: JoobleJob[];
  totalCount?: number;
}

interface JoobleRequest {
  keywords: string;
  location: string;
  radius: string;
  page: number;
  ResultOnPage: number;
  SearchMode: number;
  companysearch: boolean;
}

interface JobsRepository {
  job: Pick<
    PrismaClient["job"],
    "upsert" | "updateMany"
  >;
}

export interface JoobleIntegrationOptions {
  apiKey?: string;
  apiUrl?: string;
  fetcher?: typeof fetch;
  repository?: JobsRepository;
  categories?: readonly JobCategory[];
  pageSize?: number;
  maxPages?: number;
  batchSize?: number;
  logger?: Pick<Console, "error" | "info">;
}

export class JoobleIntegrationService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly repository: JobsRepository;
  private readonly categories: readonly JobCategory[];
  private readonly pageSize: number;
  private readonly maxPages: number;
  private readonly batchSize: number;
  private readonly logger: Pick<Console, "error" | "info">;

  constructor(options: JoobleIntegrationOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.JOOBLE_API_KEY ?? "";
    this.apiUrl = options.apiUrl ?? JOOBLE_API_URL;
    this.fetcher = options.fetcher ?? fetch;
    this.repository = options.repository ?? prisma;
    this.categories = options.categories ?? (Object.keys(CATEGORY_KEYWORDS) as JobCategory[]);
    this.pageSize = options.pageSize ?? 20;
    this.maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
    this.batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    this.logger = options.logger ?? console;
  }

  async synchronize(): Promise<{ fetched: number; synchronized: number }> {
    if (!this.apiKey) {
      throw new Error("JOOBLE_API_KEY não configurada.");
    }

    let fetched = 0;
    let synchronized = 0;

    for (const category of this.categories) {
      try {
        const jobs = (await this.search(category)).filter((job) =>
          isRelevantJob(category, job),
        );
        fetched += jobs.length;
        synchronized += await this.persist(category, jobs);
      } catch (error) {
        this.logger.error("Falha ao sincronizar categoria de vagas via Jooble.", {
          category,
          error,
        });
      }
    }

    return { fetched, synchronized };
  }

  private async search(category: JobCategory): Promise<JoobleJob[]> {
    const jobs: JoobleJob[] = [];
    for (let page = 1; page <= this.maxPages; page += 1) {
      const payload: JoobleRequest = {
        keywords: CATEGORY_KEYWORDS[category],
        location: RMR_LOCATION,
        radius: "40",
        page,
        ResultOnPage: this.pageSize,
        SearchMode: 0,
        companysearch: false,
      };
      const response = await this.fetcher(`${this.apiUrl}/${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Jooble retornou HTTP ${response.status} para ${category} (página ${page}).`);
      }

      const data = (await response.json()) as JoobleResponse;
      const pageJobs = Array.isArray(data.jobs) ? data.jobs : [];
      jobs.push(...pageJobs);
      if (pageJobs.length < this.pageSize || jobs.length >= (data.totalCount ?? jobs.length)) {
        break;
      }
    }
    return jobs;
  }

  private async persist(category: JobCategory, jobs: JoobleJob[]): Promise<number> {
    const externalIds = jobs.map((job) => String(job.id));

    for (let index = 0; index < jobs.length; index += this.batchSize) {
      const batch = jobs.slice(index, index + this.batchSize);
      await Promise.all(batch.map((job) => this.repository.job.upsert({
        where: { externalId: String(job.id) },
        create: {
          externalId: String(job.id),
          title: job.title,
          company: job.company ?? "Empresa não informada",
          location: job.location,
          description: job.snippet ?? "",
          salary: job.salary ?? null,
          link: job.link,
          category,
          isExpired: false,
          updatedAt: parseUpdatedAt(job.updated),
        },
        update: {
          title: job.title,
          company: job.company ?? "Empresa não informada",
          location: job.location,
          description: job.snippet ?? "",
          salary: job.salary ?? null,
          link: job.link,
          category,
          isExpired: false,
          updatedAt: parseUpdatedAt(job.updated),
        },
      })));
    }

    await this.repository.job.updateMany({
      where: {
        category,
        location: { contains: "Recife" },
        ...(externalIds.length > 0 ? { externalId: { notIn: externalIds } } : {}),
      },
      data: { isExpired: true },
    });

    return jobs.length;
  }
}

function parseUpdatedAt(value: string | undefined): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

const CATEGORY_TERMS: Record<JobCategory, readonly string[]> = {
  Backend: ["backend", "back-end", "api", "node", "java", "python", "servidor", "desenvolvimento", "software"],
  Frontend: ["frontend", "front-end", "react", "angular", "vue", "javascript", "typescript", "web", "desenvolvimento", "software"],
  Mobile: ["mobile", "android", "ios", "flutter", "react native", "kotlin", "swift", "desenvolvimento", "software"],
  Dados: ["dados", "data", "python", "sql", "analytics", "pandas", "bi"],
  QA: ["qa", "teste", "testes", "qualidade", "automação", "automatizacao"],
};

const EXCLUDED_TERMS = [
  "administrativ",
  "bibliotec",
  "trabalhist",
  "recepcion",
  "vendedor",
  "comercial",
  "financeir",
  "contabil",
  "juridic",
  "enferm",
  "marketing",
];

function isRelevantJob(category: JobCategory, job: JoobleJob): boolean {
  const title = normalize(job.title);
  const description = normalize(job.snippet ?? "");
  const searchableText = `${title} ${description}`;

  if (EXCLUDED_TERMS.some((term) => searchableText.includes(term))) {
    return false;
  }

  return CATEGORY_TERMS[category].some((term) =>
    title.includes(normalize(term)),
  );
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function startJobsSynchronization(
  service = new JoobleIntegrationService(),
  intervalMs = Number(process.env.JOBS_SYNC_INTERVAL_MS ?? DEFAULT_SYNC_INTERVAL_MS),
  logger: Pick<Console, "error" | "info"> = console,
): NodeJS.Timeout | undefined {
  if (!process.env.JOOBLE_API_KEY) {
    logger.info("Sincronização de vagas desabilitada: JOOBLE_API_KEY não configurada.");
    return undefined;
  }

  const synchronize = async (): Promise<void> => {
    try {
      const result = await service.synchronize();
      logger.info(`Vagas sincronizadas: ${result.synchronized}.`);
    } catch (error) {
      logger.error("Falha na sincronização de vagas via Jooble.", error);
    }
  };

  void synchronize();
  return setInterval(() => void synchronize(), intervalMs);
}
