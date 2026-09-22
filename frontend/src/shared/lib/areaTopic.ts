export const AREA_TOPIC_PREFIX = "area-topic-";

/**
 * Normalizes an area name to a URL-safe slug (lowercase, no accents, hyphen-separated).
 * Must stay in sync with the backend `slugifyArea` in modules/reviews/utils/areaTopic.ts.
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
