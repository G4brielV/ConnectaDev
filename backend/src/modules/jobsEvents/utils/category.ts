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

export function inferCategory(title: string): string {
  const t = title.toLocaleLowerCase("pt-BR");
  for (const [label, kws] of CATEGORY_KEYWORDS) {
    if (kws.some((k) => t.includes(k))) return label;
  }
  return "Tecnologia";
}