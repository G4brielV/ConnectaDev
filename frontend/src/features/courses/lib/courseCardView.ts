export interface LevelTone {
  background: string;
  border: string;
  text: string;
}

// Mesmas famílias de cor do Stitch: azul para iniciante, âmbar para intermediário.
const LEVEL_TONES: Record<string, LevelTone> = {
  iniciante: { background: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
  intermediario: { background: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
};

const NEUTRAL_TONE: LevelTone = { background: '#F1F5F9', border: '#E2E8F0', text: '#334155' };

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/** Cor do selo de nível; níveis novos no catálogo caem no tom neutro. */
export function levelTone(level: string): LevelTone {
  return LEVEL_TONES[normalize(level)] ?? NEUTRAL_TONE;
}

/** Linha de categoria sobre a imagem do card ("HTML5 & CSS3"). */
export function courseCategory(tags: readonly string[]): string {
  return tags.slice(0, 2).join(' & ').toUpperCase();
}

/** Iniciais do avatar: até duas do nome; sem nome, a do e-mail. */
export function userInitials(name?: string | null, email?: string | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const first = words[0][0] ?? '';
    const last = words.length > 1 ? words[words.length - 1][0] ?? '' : '';
    return `${first}${last}`.toUpperCase();
  }
  const fromEmail = (email ?? '').trim()[0];
  return fromEmail ? fromEmail.toUpperCase() : '?';
}
