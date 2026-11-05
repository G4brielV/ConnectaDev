import type { StreakOverview } from '@/shared/api/streakApi';

/** Cabeçalho do calendário do Stitch: a semana começa no domingo. */
export const MONTH_WEEKDAY_HEADERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

// Nomes fixos em vez de Intl: o Hermes não garante dados de locale pt-BR.
const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export interface CalendarCell {
  /** YYYY-MM-DD; null nas casas vazias antes/depois do mês */
  day: string | null;
  dayOfMonth: number | null;
}

function parseMonth(month: string): { year: number; monthIndex: number } {
  const [year, monthNumber] = month.split('-').map(Number);
  return { year, monthIndex: monthNumber - 1 };
}

/** Semanas do mês (domingo a sábado), completando com casas vazias. */
export function buildMonthGrid(month: string): CalendarCell[][] {
  const { year, monthIndex } = parseMonth(month);
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const cells: CalendarCell[] = [
    ...Array.from({ length: firstWeekday }, () => ({ day: null, dayOfMonth: null })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({
      day: `${month}-${String(index + 1).padStart(2, '0')}`,
      dayOfMonth: index + 1,
    })),
  ];
  while (cells.length % 7 !== 0) cells.push({ day: null, dayOfMonth: null });

  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

export function monthTitle(month: string): string {
  const { year, monthIndex } = parseMonth(month);
  return `${MONTH_NAMES[monthIndex]} de ${year}`;
}

export function shiftMonth(month: string, amount: number): string {
  const { year, monthIndex } = parseMonth(month);
  const shifted = new Date(Date.UTC(year, monthIndex + amount, 1));
  return shifted.toISOString().slice(0, 7);
}

export type DayCellState = 'todayActive' | 'today' | 'active' | 'past' | 'future';

export function dayCellState(day: string, activeDays: ReadonlySet<string>, today: string): DayCellState {
  if (day === today) return activeDays.has(day) ? 'todayActive' : 'today';
  if (activeDays.has(day)) return 'active';
  return day < today ? 'past' : 'future';
}

export function streakHeadline(currentStreak: number): string {
  if (currentStreak === 0) return 'Nenhuma ofensiva ativa';
  return currentStreak === 1 ? '1 dia de ofensiva!' : `${currentStreak} dias de ofensiva!`;
}

/** Mensagem do topo conforme o que a pessoa precisa fazer hoje. */
export function streakMessage(overview: Pick<StreakOverview, 'currentStreak' | 'activeToday' | 'atRisk'>): string {
  if (overview.activeToday) {
    return overview.currentStreak > 1
      ? `Você estudou ${overview.currentStreak} dias seguidos. Volte amanhã para manter o fogo aceso!`
      : 'Primeiro dia registrado! Volte amanhã para a ofensiva crescer.';
  }
  if (overview.atRisk) {
    return `Estude hoje para não perder sua ofensiva de ${overview.currentStreak} ${
      overview.currentStreak === 1 ? 'dia' : 'dias'
    }.`;
  }
  return 'Complete uma fase ou revisão hoje para acender sua ofensiva.';
}

export function weekDoneCount(week: StreakOverview['week']): number {
  return week.filter((day) => day.status === 'done').length;
}
