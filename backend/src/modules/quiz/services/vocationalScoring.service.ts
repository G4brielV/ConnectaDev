import { SUPPORTED_AREAS, SupportedArea } from "../constants/areas";

export interface ScoringOption {
  id: string;
  targetArea?: unknown;
}

export interface ScoringQuestion {
  id: string;
  options: unknown;
}

export interface VocationalResult {
  primaryArea: SupportedArea;
  secondaryArea: SupportedArea;
  scores: Record<SupportedArea, number>;
  answeredQuestions: number;
}

const TECHNOLOGIES_BY_AREA: Record<SupportedArea, string[]> = {
  "Desenvolvimento de Software": ["TypeScript", "JavaScript", "APIs REST", "Git"],
  "Dados e Inteligência Artificial": ["Python", "SQL", "Pandas", "Machine Learning"],
  "Design e Experiência do Usuário": ["Figma", "UI", "UX", "Acessibilidade"],
  "Infraestrutura e Redes": ["Linux", "Cloud", "Docker", "Redes"],
  Cibersegurança: ["Cibersegurança", "Linux", "Redes", "OWASP"],
  "Gestão de Produtos de Tecnologia": ["Discovery", "Roadmap", "Métricas", "Agile"],
};

export function calculateVocationalResult(
  questions: ScoringQuestion[],
  answers: Record<string, string>,
): VocationalResult {
  const scores = Object.fromEntries(
    SUPPORTED_AREAS.map((area) => [area, 0]),
  ) as Record<SupportedArea, number>;
  const firstSelectedAt = new Map<SupportedArea, number>();
  let answeredQuestions = 0;

  for (const question of questions) {
    if (!Array.isArray(question.options)) {
      continue;
    }

    const selectedOption = question.options.find(
      (option): option is ScoringOption =>
        typeof option === "object" &&
        option !== null &&
        "id" in option &&
        (option as { id?: unknown }).id === answers[question.id],
    );
    const targetArea = selectedOption?.targetArea;
    if (
      typeof targetArea === "string" &&
      SUPPORTED_AREAS.includes(targetArea as SupportedArea)
    ) {
      scores[targetArea as SupportedArea] += 1;
      if (!firstSelectedAt.has(targetArea as SupportedArea)) {
        firstSelectedAt.set(targetArea as SupportedArea, answeredQuestions);
      }
      answeredQuestions += 1;
    }
  }

  const sortedAreas = [...SUPPORTED_AREAS].sort(
    (left, right) =>
      scores[right] - scores[left] ||
      (firstSelectedAt.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (firstSelectedAt.get(right) ?? Number.MAX_SAFE_INTEGER),
  );

  return {
    primaryArea: sortedAreas[0],
    secondaryArea: sortedAreas[1],
    scores,
    answeredQuestions,
  };
}

export function getSuggestedTechnologies(area: SupportedArea): string[] {
  return TECHNOLOGIES_BY_AREA[area];
}
