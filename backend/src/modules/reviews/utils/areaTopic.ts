import { SUPPORTED_AREAS, SupportedArea } from "../../quiz/constants/areas";

export const AREA_TOPIC_PREFIX = "area-topic-";
export const COURSE_TOPIC_PREFIX = "course-topic-";

/**
 * Normalizes an area name to a URL-safe slug (lowercase, no accents, hyphen-separated).
 * Must stay in sync with the frontend `slugifyArea` in shared/lib/areaTopic.ts.
 */
export function slugifyArea(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function areaTopicId(area: string): string {
  return `${AREA_TOPIC_PREFIX}${slugifyArea(area)}`;
}

export function resolveAreaFromSlug(slug: string): SupportedArea | null {
  return SUPPORTED_AREAS.find((area) => slugifyArea(area) === slug) ?? null;
}
