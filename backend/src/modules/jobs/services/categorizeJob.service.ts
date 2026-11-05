export const JOB_CATEGORIES = [
  "Backend",
  "Frontend",
  "Mobile",
  "Dados",
  "Segurança",
  "Infraestrutura",
  "QA",
  "Produto",
  "TECNOLOGIA_GERAL",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

interface CategoryRule {
  category: JobCategory;
  keywords: readonly KeywordRule[];
}

interface KeywordRule {
  keyword: string;
  tag: string;
}

const CATEGORY_RULES: readonly CategoryRule[] = [
  {
    category: "Segurança",
    keywords: [
      { keyword: "cybersecurity", tag: "Cybersecurity" },
      { keyword: "ciberseguranca", tag: "Cybersecurity" },
      { keyword: "seguranca da informacao", tag: "Segurança" },
      { keyword: "security", tag: "Security" },
      { keyword: "pentest", tag: "Pentest" },
      { keyword: "soc", tag: "SOC" },
    ],
  },
  {
    category: "Dados",
    keywords: [
      { keyword: "data science", tag: "Data Science" },
      { keyword: "cientista de dados", tag: "Data Science" },
      { keyword: "engenharia de dados", tag: "Engenharia de Dados" },
      { keyword: "analytics", tag: "Analytics" },
      { keyword: "pandas", tag: "Pandas" },
      { keyword: "sql", tag: "SQL" },
      { keyword: "bi", tag: "BI" },
    ],
  },
  {
    category: "Frontend",
    keywords: [
      { keyword: "frontend", tag: "Frontend" },
      { keyword: "front-end", tag: "Frontend" },
      { keyword: "react", tag: "React" },
      { keyword: "angular", tag: "Angular" },
      { keyword: "vue", tag: "Vue" },
      { keyword: "javascript", tag: "JavaScript" },
      { keyword: "typescript", tag: "TypeScript" },
      { keyword: "html", tag: "HTML" },
      { keyword: "css", tag: "CSS" },
    ],
  },
  {
    category: "Mobile",
    keywords: [
      { keyword: "mobile", tag: "Mobile" },
      { keyword: "android", tag: "Android" },
      { keyword: "ios", tag: "iOS" },
      { keyword: "flutter", tag: "Flutter" },
      { keyword: "react native", tag: "React Native" },
      { keyword: "kotlin", tag: "Kotlin" },
      { keyword: "swift", tag: "Swift" },
    ],
  },
  {
    category: "Backend",
    keywords: [
      { keyword: "backend", tag: "Backend" },
      { keyword: "back-end", tag: "Backend" },
      { keyword: "api", tag: "API" },
      { keyword: "apis", tag: "API" },
      { keyword: "node", tag: "Node.js" },
      { keyword: "java", tag: "Java" },
      { keyword: "python", tag: "Python" },
      { keyword: "go", tag: "Go" },
      { keyword: "c#", tag: "C#" },
      { keyword: ".net", tag: ".NET" },
      { keyword: "servidor", tag: "Backend" },
    ],
  },
  {
    category: "Infraestrutura",
    keywords: [
      { keyword: "devops", tag: "DevOps" },
      { keyword: "cloud", tag: "Cloud" },
      { keyword: "aws", tag: "AWS" },
      { keyword: "azure", tag: "Azure" },
      { keyword: "infraestrutura", tag: "Infraestrutura" },
      { keyword: "redes", tag: "Redes" },
      { keyword: "linux", tag: "Linux" },
      { keyword: "docker", tag: "Docker" },
      { keyword: "kubernetes", tag: "Kubernetes" },
    ],
  },
  {
    category: "QA",
    keywords: [
      { keyword: "qa", tag: "QA" },
      { keyword: "quality assurance", tag: "QA" },
      { keyword: "teste de software", tag: "Testes" },
      { keyword: "testes automatizados", tag: "Testes" },
      { keyword: "automacao de testes", tag: "Testes" },
    ],
  },
  {
    category: "Produto",
    keywords: [
      { keyword: "product manager", tag: "Produto" },
      { keyword: "product owner", tag: "Produto" },
      { keyword: "gestao de produto", tag: "Produto" },
      { keyword: "produto digital", tag: "Produto" },
    ],
  },
];

const GENERIC_KEYWORDS = [
  { keyword: "ti", tag: "TI" },
  { keyword: "tecnologia", tag: "Tecnologia" },
  { keyword: "desenvolvimento", tag: "Desenvolvimento" },
  { keyword: "suporte tecnico", tag: "Suporte Técnico" },
  { keyword: "help desk", tag: "Help Desk" },
  { keyword: "informatica", tag: "Informática" },
] as const;

export interface JobCategorization {
  category: JobCategory;
  tags: string[];
}

export function categorizeJob(title: string, description: string): JobCategorization {
  const searchableText = normalize(`${title} ${description}`);
  const matchedRules = CATEGORY_RULES.filter((rule) =>
    rule.keywords.some(({ keyword }) => includesKeyword(searchableText, keyword)),
  );

  const primaryRule = matchedRules[0];
  const tags = deduplicate(
    matchedRules.flatMap((rule) =>
      rule.keywords
        .filter(({ keyword }) => includesKeyword(searchableText, keyword))
        .map(({ tag }) => tag),
    ),
  );

  if (!primaryRule) {
    return {
      category: "TECNOLOGIA_GERAL",
      tags: GENERIC_KEYWORDS
        .filter(({ keyword }) => includesKeyword(searchableText, keyword))
        .map(({ tag }) => tag),
    };
  }

  return {
    category: primaryRule.category,
    tags,
  };
}

function deduplicate(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesKeyword(value: string, keyword: string): boolean {
  const normalizedKeyword = normalize(keyword).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${normalizedKeyword}($|[^a-z0-9])`).test(value);
}
