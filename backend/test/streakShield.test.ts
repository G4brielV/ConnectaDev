import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { applyStudyActivity } from "../src/modules/gamification/services/gamification.service";
import {
  availableXp,
  effectiveStreak,
  MAX_STREAK_SHIELDS,
  resolveShieldGap,
  STREAK_SHIELD_COST,
  STREAK_SHIELD_PURCHASE_SOURCE,
} from "../src/modules/gamification/services/streakRules";
import {
  purchaseStreakShield,
  reconcileStreakShields,
  StoredGamificationForShield,
  StreakShieldError,
  StreakShieldTx,
} from "../src/modules/gamification/services/streakShield.service";
import { toStudyDay } from "../src/modules/gamification/services/studyDay";

describe("regras do escudo de ofensiva", () => {
  const wednesday = new Date("2026-09-23T15:00:00Z"); // quarta, 12h em Recife
  const monday = new Date("2026-09-21T15:00:00Z"); // segunda, 12h em Recife
  const sunday = new Date("2026-09-20T15:00:00Z"); // domingo, 12h em Recife
  const saturday = new Date("2026-09-19T15:00:00Z"); // sábado, 12h em Recife

  it("calcula XP disponível sem permitir saldo negativo", () => {
    expect(availableXp(320, 0)).toBe(320);
    expect(availableXp(320, 150)).toBe(170);
    expect(availableXp(100, 150)).toBe(0);
  });

  it("effectiveStreak considera escudos suficientes para manter a ofensiva viva", () => {
    // 1 dia perdido (terça): 0 escudos quebra, 1 escudo mantém
    expect(effectiveStreak(5, monday, wednesday, 0)).toBe(0);
    expect(effectiveStreak(5, monday, wednesday, 1)).toBe(5);
    // 2 dias perdidos (segunda e terça): precisa de 2 escudos
    expect(effectiveStreak(5, sunday, wednesday, 1)).toBe(0);
    expect(effectiveStreak(5, sunday, wednesday, 2)).toBe(5);
  });

  it("cobre 1 dia perdido com 1 escudo e ancora no dia protegido em Recife", () => {
    const res = resolveShieldGap(5, monday, 1, wednesday);
    expect(res.status).toBe("SHIELDED");
    expect(res.daysToShield).toEqual(["2026-09-22"]);
    expect(res.remainingShields).toBe(0);
    expect(res.effectiveLastActivityDate).not.toBeNull();
    expect(toStudyDay(res.effectiveLastActivityDate!)).toBe("2026-09-22");
  });

  it("cobre 2 dias perdidos com 2 escudos", () => {
    const res = resolveShieldGap(5, sunday, 2, wednesday);
    expect(res.status).toBe("SHIELDED");
    expect(res.daysToShield).toEqual(["2026-09-21", "2026-09-22"]);
    expect(res.remainingShields).toBe(0);
    expect(toStudyDay(res.effectiveLastActivityDate!)).toBe("2026-09-22");
  });

  it("NÃO desperdiça escudos se a ausência for maior que o estoque", () => {
    // 3 dias perdidos (domingo, segunda, terça) com 2 escudos -> ofensiva expira e escudos ficam salvos
    const res = resolveShieldGap(5, saturday, 2, wednesday);
    expect(res.status).toBe("EXPIRED");
    expect(res.daysToShield).toEqual([]);
    expect(res.remainingShields).toBe(2);
  });

  it("não consome escudo quando não há ofensiva ativa", () => {
    const res = resolveShieldGap(0, monday, 2, wednesday);
    expect(res.status).toBe("NONE");
    expect(res.daysToShield).toEqual([]);
    expect(res.remainingShields).toBe(2);
  });
});

function makeShieldTx(
  stored: StoredGamificationForShield | null,
  casCount = 1,
) {
  const updateMany = vi.fn().mockResolvedValue({ count: casCount });
  const createMany = vi.fn().mockResolvedValue({ count: 1 });
  const xpCreate = vi.fn().mockResolvedValue({});
  const tx: StreakShieldTx = {
    userGamification: {
      findUnique: vi.fn().mockResolvedValue(stored),
      updateMany,
    },
    userActivityDay: { createMany },
    xpEvent: { create: xpCreate },
  };
  const run = async <T>(cb: (client: StreakShieldTx) => Promise<T>) => cb(tx);
  return { tx, run, updateMany, createMany, xpCreate };
}

describe("purchaseStreakShield", () => {
  const now = new Date("2026-09-23T15:00:00Z"); // quarta, 12h em Recife
  const yesterday = new Date("2026-09-22T15:00:00Z");
  const monday = new Date("2026-09-21T15:00:00Z");

  it("troca 150 XP disponível por 1 escudo sem reduzir totalXp ou nível", async () => {
    const { run, updateMany, xpCreate } = makeShieldTx({
      totalXp: 320,
      xpSpent: 0,
      currentLevel: 4,
      currentStreak: 5,
      longestStreak: 5,
      streakShields: 0,
      lastActivityDate: yesterday,
    });

    const result = await purchaseStreakShield("user-1", now, run);

    expect(result).toEqual({
      streakShields: 1,
      maxShields: MAX_STREAK_SHIELDS,
      shieldCost: STREAK_SHIELD_COST,
      totalXp: 320,
      availableXp: 170,
      currentLevel: 4,
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        xpSpent: 0,
        streakShields: 0,
        lastActivityDate: yesterday,
      },
      data: {
        xpSpent: 150,
        streakShields: 1,
        currentStreak: 5,
        lastActivityDate: yesterday,
      },
    });
    expect(xpCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        source: STREAK_SHIELD_PURCHASE_SOURCE,
        referenceId: "2026-09-23",
        amount: -150,
      },
    });
  });

  it("recusa compra quando o saldo disponível é menor que 150 XP", async () => {
    const { run } = makeShieldTx({
      totalXp: 250,
      xpSpent: 150,
      currentLevel: 3,
      currentStreak: 2,
      longestStreak: 2,
      streakShields: 1,
      lastActivityDate: yesterday,
    });

    await expect(purchaseStreakShield("user-1", now, run)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("recusa compra quando o usuário já tem 2 escudos", async () => {
    const { run } = makeShieldTx({
      totalXp: 500,
      xpSpent: 300,
      currentLevel: 6,
      currentStreak: 4,
      longestStreak: 4,
      streakShields: 2,
      lastActivityDate: yesterday,
    });

    await expect(purchaseStreakShield("user-1", now, run)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("falha com 409 quando outra requisição concorrente altera o saldo antes do CAS", async () => {
    const { run, xpCreate } = makeShieldTx(
      {
        totalXp: 200,
        xpSpent: 0,
        currentLevel: 3,
        currentStreak: 2,
        longestStreak: 2,
        streakShields: 0,
        lastActivityDate: yesterday,
      },
      0,
    );

    await expect(purchaseStreakShield("user-1", now, run)).rejects.toBeInstanceOf(StreakShieldError);
    expect(xpCreate).not.toHaveBeenCalled();
  });

  it("comprar escudo depois de já ter perdido a ofensiva NÃO ressuscita a ofensiva antiga", async () => {
    // Última atividade foi segunda, 0 escudos -> quarta a ofensiva já expirou
    const { run, updateMany } = makeShieldTx({
      totalXp: 300,
      xpSpent: 0,
      currentLevel: 4,
      currentStreak: 8,
      longestStreak: 8,
      streakShields: 0,
      lastActivityDate: monday,
    });

    const result = await purchaseStreakShield("user-1", now, run);

    expect(result.streakShields).toBe(1);
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStreak: 0,
          streakShields: 1,
          xpSpent: 150,
        }),
      }),
    );
  });

  it("reconcileStreakShields grava o dia protegido e consome 1 escudo", async () => {
    const { run, updateMany, createMany } = makeShieldTx({
      totalXp: 300,
      xpSpent: 150,
      currentLevel: 4,
      currentStreak: 6,
      longestStreak: 6,
      streakShields: 1,
      lastActivityDate: monday,
    });

    await reconcileStreakShields("user-1", now, run);

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user-1",
          day: new Date("2026-09-22T00:00:00.000Z"),
          kind: "SHIELD",
        },
      ],
      skipDuplicates: true,
    });
  });
});

describe("applyStudyActivity com escudo de ofensiva", () => {
  it("consome o escudo do dia perdido e incrementa a ofensiva ao estudar hoje", async () => {
    const wednesday = new Date("2026-09-23T15:00:00Z");
    const monday = new Date("2026-09-21T15:00:00Z");
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const upsert = vi.fn().mockResolvedValue({});
    const tx = {
      userGamification: {
        findUnique: vi.fn().mockResolvedValue({
          totalXp: 200,
          currentLevel: 3,
          currentStreak: 4,
          longestStreak: 4,
          streakShields: 1,
          lastActivityDate: monday,
        }),
        upsert,
      },
      userActivityDay: { createMany },
      xpEvent: { create: vi.fn().mockResolvedValue({}) },
    } as unknown as Prisma.TransactionClient;

    const result = await applyStudyActivity(tx, "user-1", 20, wednesday);

    expect(result.currentStreak).toBe(5);
    expect(result.streakStatus).toBe("INCREMENTED");
    // 1ª chamada grava terça como SHIELD; 2ª grava quarta como STUDY
    expect(createMany).toHaveBeenNthCalledWith(1, {
      data: [{ userId: "user-1", day: new Date("2026-09-22T00:00:00.000Z"), kind: "SHIELD" }],
      skipDuplicates: true,
    });
    expect(createMany).toHaveBeenNthCalledWith(2, {
      data: [{ userId: "user-1", day: new Date("2026-09-23T00:00:00.000Z"), kind: "STUDY" }],
      skipDuplicates: true,
    });
    expect(upsert.mock.calls[0]?.[0]).toMatchObject({
      update: { currentStreak: 5, streakShields: 0 },
    });
  });
});
