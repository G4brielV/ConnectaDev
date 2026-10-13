import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  bestCombo,
  comboBonus,
  DAILY_STREAK_BONUS_XP,
  isPerfect,
  perfectBonus,
  streakReward,
  sumXp,
  xpBreakdown,
} from "../src/modules/gamification/services/bonusRules";
import { applyStudyActivity } from "../src/modules/gamification/services/gamification.service";

describe("bônus de gabarito", () => {
  it("vale metade do XP da fase na primeira vez que sai 100%", () => {
    expect(perfectBonus(20, true, 80)).toBe(10);
    expect(perfectBonus(50, true, 0)).toBe(25);
    expect(perfectBonus(100, true, 90)).toBe(50);
  });

  it("não paga abaixo de 100% nem ao gabaritar de novo", () => {
    expect(perfectBonus(20, false, 0)).toBe(0);
    expect(perfectBonus(20, true, 100)).toBe(0);
  });

  it("gabarito é acertar todas, e prova vazia não conta", () => {
    expect(isPerfect(10, 10)).toBe(true);
    expect(isPerfect(9, 10)).toBe(false);
    expect(isPerfect(0, 0)).toBe(false);
  });
});

describe("combo da prática", () => {
  it("conta a maior sequência de acertos seguidos", () => {
    expect(bestCombo([])).toBe(0);
    expect(bestCombo([true, true, false, true, true, true])).toBe(3);
    expect(bestCombo([true, true, true, true, true])).toBe(5);
    expect(bestCombo([false, true, false, true, false])).toBe(1);
  });

  it("só vale a partir de 3 seguidas, +1 XP por acerto do combo", () => {
    expect(comboBonus(2)).toBe(0);
    expect(comboBonus(3)).toBe(3);
    expect(comboBonus(5)).toBe(5);
  });
});

describe("bônus da ofensiva", () => {
  it("só paga quando a ofensiva sobe: começar, recomeçar e repetir o dia não pagam", () => {
    expect(streakReward("STARTED", 1, 0)).toEqual({ bonuses: [], milestone: null });
    expect(streakReward("RESTARTED", 1, 9)).toEqual({ bonuses: [], milestone: null });
    expect(streakReward("KEPT", 4, 4)).toEqual({ bonuses: [], milestone: null });
  });

  it("dia 2 em diante leva o bônus diário", () => {
    expect(streakReward("INCREMENTED", 2, 1)).toEqual({
      bonuses: [{ kind: "STREAK_DAILY", amount: DAILY_STREAK_BONUS_XP }],
      milestone: null,
    });
  });

  it("bater um marco pela primeira vez soma o bônus do marco", () => {
    expect(streakReward("INCREMENTED", 7, 6)).toEqual({
      bonuses: [
        { kind: "STREAK_DAILY", amount: DAILY_STREAK_BONUS_XP },
        { kind: "STREAK_MILESTONE", amount: 30 },
      ],
      milestone: { days: 7, title: "Fogo!", xp: 30 },
    });
  });

  it("marco já alcançado antes (recorde acima dele) não paga de novo", () => {
    expect(streakReward("INCREMENTED", 7, 12).milestone).toBeNull();
  });
});

describe("extrato de XP", () => {
  it("deixa de fora as linhas zeradas e soma o total", () => {
    const items = xpBreakdown(
      { kind: "LESSON", amount: 20 },
      { kind: "PERFECT", amount: 0 },
      { kind: "STREAK_DAILY", amount: 5 },
    );
    expect(items).toEqual([
      { kind: "LESSON", amount: 20 },
      { kind: "STREAK_DAILY", amount: 5 },
    ]);
    expect(sumXp(items)).toBe(25);
  });
});

interface StoredGamification {
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
}

/** Transação falsa: guarda o que seria escrito no banco. */
function fakeTransaction(previous: StoredGamification | null, firstActivityToday = true) {
  const xpEvents: Array<{ source: string; referenceId: string; amount: number }> = [];
  const upsert = vi.fn().mockResolvedValue({});
  const transaction = {
    userGamification: { findUnique: vi.fn().mockResolvedValue(previous), upsert },
    userActivityDay: {
      createMany: vi.fn().mockResolvedValue({ count: firstActivityToday ? 1 : 0 }),
    },
    xpEvent: {
      create: vi.fn(async ({ data }: { data: (typeof xpEvents)[number] }) => {
        xpEvents.push({ source: data.source, referenceId: data.referenceId, amount: data.amount });
        return data;
      }),
    },
  };
  return { transaction: transaction as unknown as Prisma.TransactionClient, xpEvents, upsert };
}

describe("applyStudyActivity", () => {
  const now = new Date("2026-09-24T15:00:00Z"); // quinta, 12h em Recife
  const yesterday = new Date("2026-09-23T15:00:00Z");

  it("primeiro dia de todos: começa a ofensiva sem bônus", async () => {
    const { transaction, xpEvents } = fakeTransaction(null);
    const result = await applyStudyActivity(transaction, "user-1", 20, now);

    expect(result).toMatchObject({
      totalXp: 20,
      currentStreak: 1,
      streakStatus: "STARTED",
      bonuses: [],
      milestone: null,
    });
    expect(xpEvents).toEqual([]);
  });

  it("manter a ofensiva paga o bônus diário e grava o evento do dia", async () => {
    const { transaction, xpEvents, upsert } = fakeTransaction({
      totalXp: 100,
      currentLevel: 2,
      currentStreak: 3,
      longestStreak: 3,
      lastActivityDate: yesterday,
    });
    const result = await applyStudyActivity(transaction, "user-1", 20, now);

    expect(result.currentStreak).toBe(4);
    expect(result.streakStatus).toBe("INCREMENTED");
    expect(result.milestone).toBeNull();
    expect(result.totalXp).toBe(100 + 20 + DAILY_STREAK_BONUS_XP);
    expect(xpEvents).toEqual([
      { source: "STREAK_DAILY", referenceId: "2026-09-24", amount: DAILY_STREAK_BONUS_XP },
    ]);
    expect(upsert.mock.calls[0]?.[0]).toMatchObject({ update: { totalXp: 125, currentStreak: 4 } });
  });

  it("chegar a 3 dias já paga o primeiro marco (Faísca)", async () => {
    const { transaction } = fakeTransaction({
      totalXp: 100,
      currentLevel: 2,
      currentStreak: 2,
      longestStreak: 2,
      lastActivityDate: yesterday,
    });
    const result = await applyStudyActivity(transaction, "user-1", 0, now);

    expect(result.milestone).toEqual({ days: 3, title: "Faísca", xp: 10 });
    expect(result.totalXp).toBe(100 + DAILY_STREAK_BONUS_XP + 10);
  });

  it("se outra atividade já marcou o dia, não paga o bônus de novo", async () => {
    // Dois envios simultâneos leram "ontem"; só quem inseriu o dia leva o bônus.
    const { transaction, xpEvents } = fakeTransaction(
      { totalXp: 100, currentLevel: 2, currentStreak: 2, longestStreak: 2, lastActivityDate: yesterday },
      false,
    );
    const result = await applyStudyActivity(transaction, "user-1", 20, now);

    expect(result.bonuses).toEqual([]);
    expect(result.totalXp).toBe(120);
    expect(xpEvents).toEqual([]);
  });

  it("o 7º dia seguido paga o diário e o marco de uma vez", async () => {
    const { transaction, xpEvents } = fakeTransaction({
      totalXp: 300,
      currentLevel: 4,
      currentStreak: 6,
      longestStreak: 6,
      lastActivityDate: yesterday,
    });
    const result = await applyStudyActivity(transaction, "user-1", 0, now);

    expect(result.milestone).toEqual({ days: 7, title: "Fogo!", xp: 30 });
    expect(result.longestStreak).toBe(7);
    expect(result.totalXp).toBe(300 + DAILY_STREAK_BONUS_XP + 30);
    expect(xpEvents).toEqual([
      { source: "STREAK_DAILY", referenceId: "2026-09-24", amount: DAILY_STREAK_BONUS_XP },
      { source: "STREAK_MILESTONE", referenceId: "7", amount: 30 },
    ]);
  });

  it("voltar depois de perder dias recomeça em 1 e preserva o recorde", async () => {
    const { transaction, xpEvents } = fakeTransaction({
      totalXp: 300,
      currentLevel: 4,
      currentStreak: 5,
      longestStreak: 9,
      lastActivityDate: new Date("2026-09-20T15:00:00Z"),
    });
    const result = await applyStudyActivity(transaction, "user-1", 20, now);

    expect(result).toMatchObject({
      currentStreak: 1,
      longestStreak: 9,
      streakStatus: "RESTARTED",
      bonuses: [],
    });
    expect(xpEvents).toEqual([]);
  });

  it("segunda atividade no mesmo dia mantém a ofensiva sem bônus", async () => {
    const { transaction } = fakeTransaction(
      { totalXp: 125, currentLevel: 2, currentStreak: 3, longestStreak: 3, lastActivityDate: now },
      false,
    );
    const result = await applyStudyActivity(transaction, "user-1", 20, now);

    expect(result).toMatchObject({ currentStreak: 3, streakStatus: "KEPT", bonuses: [], totalXp: 145 });
  });
});
