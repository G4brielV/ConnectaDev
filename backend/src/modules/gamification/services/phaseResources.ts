export interface ExtraCourseCandidate {
  id: string;
  title: string;
  provider: string;
  thumbnail: string;
  externalUrl: string;
  tags: string[];
  areas: string[];
}

export interface LearnerProfile {
  /** tecnologiasSugeridas do diagnóstico vocacional */
  technologies: string[];
  areasSecundarias: string[];
}

export interface ExtraResource {
  id: string;
  title: string;
  url: string;
  kind: "COURSE";
  thumbnail: string;
  provider: string;
  /** Por que este curso apareceu para esta pessoa. */
  reason: string;
}

export const MAX_EXTRA_RESOURCES = 2;

/** Colunas Json de tags/áreas chegam como `unknown`; aqui viram string[]. */
export function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/** Compara tags ignorando caixa e acento ("Lógica" == "logica"). */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function intersect(source: string[], target: string[]): string[] {
  const wanted = new Set(target.map(normalize));
  return source.filter((item) => wanted.has(normalize(item)));
}

/**
 * Cursos do catálogo para aprofundar a fase, na ordem do perfil do quiz.
 *
 * Só entra curso com ao menos uma tag da fase — sem isso a sugestão sairia do
 * tema. Entre os relevantes, pesa mais o que bate com as tecnologias sugeridas
 * no diagnóstico e depois o que é de uma das áreas secundárias.
 */
export function pickExtraResources(
  courses: readonly ExtraCourseCandidate[],
  phaseTags: readonly string[],
  profile: LearnerProfile,
  excludeUrls: readonly string[] = [],
  limit: number = MAX_EXTRA_RESOURCES,
): ExtraResource[] {
  if (phaseTags.length === 0) return [];
  const excluded = new Set(excludeUrls);

  return courses
    .filter((course) => !excluded.has(course.externalUrl))
    .map((course) => {
      const topicMatches = intersect(course.tags, [...phaseTags]);
      const techMatches = intersect(course.tags, profile.technologies);
      const secondaryArea = intersect(course.areas, profile.areasSecundarias)[0] ?? null;
      const score = topicMatches.length * 2 + techMatches.length * 3 + (secondaryArea ? 1 : 0);
      return { course, topicMatches, techMatches, secondaryArea, score };
    })
    .filter(({ topicMatches }) => topicMatches.length > 0)
    .sort((left, right) => right.score - left.score || left.course.title.localeCompare(right.course.title))
    .slice(0, limit)
    .map(({ course, topicMatches, techMatches, secondaryArea }) => ({
      id: course.id,
      title: course.title,
      url: course.externalUrl,
      kind: "COURSE",
      thumbnail: course.thumbnail,
      provider: course.provider,
      reason: buildReason(topicMatches, techMatches, secondaryArea),
    }));
}

function buildReason(
  topicMatches: string[],
  techMatches: string[],
  secondaryArea: string | null,
): string {
  if (techMatches.length > 0) {
    return `Seu quiz indicou ${techMatches.slice(0, 2).join(" e ")}.`;
  }
  if (secondaryArea) {
    return `Conecta com ${secondaryArea}, uma das suas áreas secundárias.`;
  }
  return `Curso completo para aprofundar ${topicMatches[0]}.`;
}

const YOUTUBE_ID = /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([\w-]{11})/;

/** Os vídeos das fases não guardam thumbnail: o YouTube a serve pelo id. */
export function youtubeThumbnail(url: string): string | null {
  const match = YOUTUBE_ID.exec(url);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : null;
}
