import { describe, expect, it, vi } from "vitest";
import { getDayDifference } from "../src/modules/gamification/services/gamification.service";
import {
  addDays,
  monthRange,
  studyDayDiff,
  toStudyDay,
  weekStart,
} from "../src/modules/gamification/services/studyDay";
import {
  buildMilestones,
  buildWeek,
  derivedStreakDays,
  effectiveStreak,
  streakTier,
} from "../src/modules/gamification/services/streakRules";
import {
  getStreakOverview,
  InvalidStreakMonthError,
  StreakRepository,
} from "../src/modules/gamification/services/getStreak.service";

describe("dia de estudo em Recife", () => {
  it("23h de Recife ainda é o mesmo dia, mesmo já sendo amanhã em UTC", () => {
    // 2026-09-10 23:30 em Recife = 2026-09-11 02:30 UTC
    expect(toStudyDay(new Date("2026-09-11T02:30:00Z"))).toBe("2026-09-10");
    expect(toStudyDay(new Date("2026-09-11T03:00:00Z"))).toBe("2026-09-11");
  });

  it("a ofensiva não quebra para quem estuda de noite", () => {
    const monday2230 = new Date("2026-09-15T01:30:00Z"); // segunda 22:30 em Recife
    const tuesday2230 = new Date("2026-09-16T01:30:00Z"); // terça 22:30 em Recife
    expect(getDayDifference(tuesday2230, monday2230)).toBe(1);
  });

  it("aritmética de dias atravessa mês e ano", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(studyDayDiff("2026-03-01", "2026-02-27")).toBe(2);
    expect(weekStart("2026-09-27")).toBe("2026-09-21"); // domingo → segunda anterior
    expect(weekStart("2026-09-21")).toBe("2026-09-21");
    expect(monthRange("2026-02")).toEqual({ first: "2026-02-01", last: "2026-02-28" });
  });
});

describe("regras da ofensiva", () => {
  const now = new Date("2026-09-24T15:00:00Z"); // quinta, 12h em Recife

  it("a ofensiva segue viva se a última atividade foi hoje ou ontem", () => {
    expect(effectiveStreak(5, new Date("2026-09-24T12:00:00Z"), now)).toBe(5);
    expect(effectiveStreak(5, new Date("2026-09-23T12:00:00Z"), now)).toBe(5);
  });

  it("faltar um dia zera a ofensiva efetiva", () => {
    expect(effectiveStreak(5, new Date("2026-09-22T12:00:00Z"), now)).toBe(0);
    expect(effectiveStreak(0, null, now)).toBe(0);
  });

  it("reconstrói os dias da última ofensiva a partir do contador", () => {
    expect(derivedStreakDays(3, new Date("2026-09-24T12:00:00Z"))).toEqual([
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
    ]);
    expect(derivedStreakDays(0, new Date())).toEqual([]);
  });

  it("monta a semana de segunda a domingo com o estado de cada dia", () => {
    const week = buildWeek("2026-09-24", new Set(["2026-09-21", "2026-09-22", "2026-09-24"]));
    expect(week.map((day) => day.label)).toEqual(["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]);
    expect(week.map((day) => day.status)).toEqual([
      "done",
      "done",
      "missed",
      "done",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(week[3]?.isToday).toBe(true);
  });

  it("hoje sem estudo fica pendente", () => {
    const week = buildWeek("2026-09-24", new Set());
    expect(week[3]).toMatchObject({ isToday: true, status: "pending" });
  });

  it("marcos usam o recorde e comemoram o que foi batido hoje", () => {
    const milestones = buildMilestones(7, 12, true);
    expect(milestones.map((m) => [m.days, m.achieved, m.isNew, m.progress])).toEqual([
      [3, true, false, 3],
      [7, true, true, 7],
      [14, false, false, 7],
      [30, false, false, 7],
    ]);
  });

  it("o selo acompanha o tamanho da ofensiva", () => {
    expect(streakTier(0)).toBe("Hora de Começar");
    expect(streakTier(7)).toBe("Fase Imparável");
    expect(streakTier(30)).toBe("Lenda da Ofensiva");
  });
});

function makeRepository(overrides: Partial<StreakRepository> = {}): StreakRepository {
  return {
    findGamification: vi.fn().mockResolvedValue(null),
    findActivityDays: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("getStreakOverview", () => {
  const now = new Date("2026-09-24T15:00:00Z");

  it("sem registro nenhum, tudo zerado e o mês atual", async () => {
    const overview = await getStreakOverview("user-1", undefined, makeRepository(), now);

    expect(overview).toMatchObject({
      currentStreak: 0,
      longestStreak: 0,
      today: "2026-09-24",
      activeToday: false,
      atRisk: false,
      tier: "Hora de Começar",
      month: { month: "2026-09", isCurrent: true, activeDays: [] },
    });
  });

  it("junta o histórico com a ofensiva atual e marca o risco de perder", async () => {
    const repository = makeRepository({
      findGamification: vi.fn().mockResolvedValue({
        currentStreak: 2,
        longestStreak: 9,
        lastActivityDate: new Date("2026-09-23T12:00:00Z"),
      }),
      findActivityDays: vi.fn().mockResolvedValue(["2026-09-02", "2026-09-23"]),
    });

    const overview = await getStreakOverview("user-1", undefined, repository, now);

    expect(overview.currentStreak).toBe(2);
    expect(overview.longestStreak).toBe(9);
    expect(overview.atRisk).toBe(true);
    // 22 vem do contador (dia anterior da ofensiva), 02 e 23 do histórico
    expect(overview.month.activeDays).toEqual(["2026-09-02", "2026-09-22", "2026-09-23"]);
    expect(repository.findActivityDays).toHaveBeenCalledWith("user-1", "2026-09-01", "2026-09-30");
    expect(repository.findActivityDays).toHaveBeenCalledWith("user-1", "2026-09-21", "2026-09-27");
  });

  it("mostra meses anteriores, mas recusa futuro e formato inválido", async () => {
    const past = await getStreakOverview("user-1", "2026-08", makeRepository(), now);
    expect(past.month).toMatchObject({ month: "2026-08", isCurrent: false });

    await expect(getStreakOverview("user-1", "2026-10", makeRepository(), now)).rejects.toBeInstanceOf(
      InvalidStreakMonthError,
    );
    await expect(getStreakOverview("user-1", "2026-13", makeRepository(), now)).rejects.toBeInstanceOf(
      InvalidStreakMonthError,
    );
  });
});
