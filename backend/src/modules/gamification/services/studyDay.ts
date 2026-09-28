/**
 * "Dia de estudo" da ofensiva. O público é da RMR, então o dia vira à
 * meia-noite de Recife — em UTC ele viraria às 21h e quem estuda à noite
 * contaria para o dia seguinte. Recife não tem horário de verão.
 */
export const STUDY_TIMEZONE = "America/Recife";

/** Dia no formato YYYY-MM-DD, o mesmo usado nas colunas DATE do banco. */
export type StudyDay = string;

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: STUDY_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toStudyDay(date: Date): StudyDay {
  return dayFormatter.format(date);
}

/** Meia-noite UTC do dia: é assim que o Postgres devolve uma coluna DATE. */
export function studyDayToDate(day: StudyDay): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

/** Dias de calendário entre dois dias de estudo (a - b). */
export function studyDayDiff(a: StudyDay, b: StudyDay): number {
  return Math.round((studyDayToDate(a).getTime() - studyDayToDate(b).getTime()) / MS_PER_DAY);
}

export function addDays(day: StudyDay, amount: number): StudyDay {
  return new Date(studyDayToDate(day).getTime() + amount * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Segunda-feira da semana do dia (a semana da tela vai de segunda a domingo). */
export function weekStart(day: StudyDay): StudyDay {
  const weekday = studyDayToDate(day).getUTCDay(); // 0 = domingo
  return addDays(day, -((weekday + 6) % 7));
}

/** "YYYY-MM" do dia. */
export function monthOf(day: StudyDay): string {
  return day.slice(0, 7);
}

/** Primeiro e último dia de um mês "YYYY-MM". */
export function monthRange(month: string): { first: StudyDay; last: StudyDay } {
  const [year, monthIndex] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, monthIndex, 0)).toISOString().slice(0, 10);
  return { first: `${month}-01`, last };
}
