// src/modules/events/utils/category.ts
const CATEGORY_KEYWORDS: Array<[string, string[]]> = [
  ["Inteligência Artificial", ["ia", "inteligencia artificial", "machine learning", "llm", "chatgpt"]],
  ["Frontend", ["frontend", "front-end", "react", "vue", "angular", "css"]],
  ["Backend", ["backend", "back-end", "node", "java", "python", "api"]],
  ["Dados", ["dados", "data", "analytics", "sql", "bi"]],
  ["Segurança", ["seguranca", "cyber", "pentest"]],
  ["Cloud/DevOps", ["cloud", "devops", "aws", "kubernetes", "docker"]],
  ["Carreira", ["carreira", "carreiras", "entrevista", "curriculo"]],
];

const TECHNOLOGY_KEYWORDS = [
  "tecnologia",
  "tech",
  "digital",
  "programacao",
  "desenvolvimento",
  "software",
  "sistemas",
  "dados",
  "data",
  "analytics",
  "sql",
  "python",
  "java",
  "node",
  "react",
  "vue",
  "angular",
  "frontend",
  "backend",
  "api",
  "ia",
  "inteligencia artificial",
  "machine learning",
  "llm",
  "chatgpt",
  "qiskit",
  "cyber",
  "seguranca da informacao",
  "pentest",
  "cloud",
  "devops",
  "aws",
  "kubernetes",
  "docker",
  "robotica",
  "automacao",
  "eletronica",
  "inovacao",
  "startup",
];

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isTechnologyEvent(title: string): boolean {
  const normalizedTitle = normalizeText(title);
  const titleWords = new Set(normalizedTitle.split(/[^a-z0-9]+/).filter(Boolean));

  return TECHNOLOGY_KEYWORDS.some((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedKeyword.includes(" ")) {
      return normalizedTitle.includes(normalizedKeyword);
    }
    return titleWords.has(normalizedKeyword);
  });
}

export function inferCategory(title: string): string {
  const t = normalizeText(title);
  for (const [label, kws] of CATEGORY_KEYWORDS) {
    if (kws.some((k) => t.includes(normalizeText(k)))) return label;
  }
  return "Tecnologia";
}