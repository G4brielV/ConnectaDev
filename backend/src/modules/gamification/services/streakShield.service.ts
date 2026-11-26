import { prisma } from "../../../lib/auth";
import {
  availableXp,
  MAX_STREAK_SHIELDS,
  resolveShieldGap,
  STREAK_SHIELD_COST,
  STREAK_SHIELD_PURCHASE_SOURCE,
} from "./streakRules";
import { studyDayToDate, toStudyDay } from "./studyDay";

export class StreakShieldError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "StreakShieldError";
    this.statusCode = statusCode;
  }
}

export interface PurchaseStreakShieldResult {
  streakShields: number;
  maxShields: number;
  shieldCost: number;
  totalXp: number;
  availableXp: number;
  currentLevel: number;
}

export interface StoredGamificationForShield {
  totalXp: number;
  xpSpent: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  streakShields: number;
  lastActivityDate: Date | null;
}

export interface StreakShieldTx {
  userGamification: {
    findUnique: (args: {
      where: { userId: string };
      select: {
        totalXp: true;
        xpSpent: true;
        currentLevel: true;
        currentStreak: true;
        longestStreak: true;
        streakShields: true;
        lastActivityDate: true;
      };
    }) => Promise<StoredGamificationForShield | null>;
    updateMany: (args: {
      where: {
        userId: string;
        xpSpent?: number;
        streakShields: number;
        lastActivityDate?: Date | null;
      };
      data: {
        xpSpent?: number;
        streakShields: number;
        currentStreak?: number;
        lastActivityDate?: Date | null;
      };
    }) => Promise<{ count: number }>;
  };
  userActivityDay: {
    createMany: (args: {
      data: Array<{ userId: string; day: Date; kind: string }>;
      skipDuplicates: boolean;
    }) => Promise<{ count: number }>;
  };
  xpEvent: {
    create: (args: {
      data: {
        userId: string;
        source: string;
        referenceId: string;
        amount: number;
      };
    }) => Promise<unknown>;
  };
}

export type RunStreakShieldTransaction = <T>(
  callback: (tx: StreakShieldTx) => Promise<T>,
) => Promise<T>;

const defaultRunTransaction: RunStreakShieldTransaction = (callback) =>
  prisma.$transaction((tx) => callback(tx));

const SHIELD_SELECT = {
  totalXp: true,
  xpSpent: true,
  currentLevel: true,
  currentStreak: true,
  longestStreak: true,
  streakShields: true,
  lastActivityDate: true,
} as const;

/**
 * Materializa escudos que precisam cobrir dias ausentes entre a última
 * atividade e hoje. Usa CAS em `streakShields` + `lastActivityDate` para que
 * duas aberturas simultâneas da tela nunca consumam o mesmo escudo duas vezes.
 */
export async function reconcileStreakShields(
  userId: string,
  now: Date = new Date(),
  runInTransaction: RunStreakShieldTransaction = defaultRunTransaction,
): Promise<void> {
  await runInTransaction(async (tx) => {
    const current = await tx.userGamification.findUnique({
      where: { userId },
      select: SHIELD_SELECT,
    });
    if (!current) return;

    const resolution = resolveShieldGap(
      current.currentStreak,
      current.lastActivityDate,
      current.streakShields,
      now,
    );

    if (resolution.status !== "SHIELDED" || resolution.daysToShield.length === 0) {
      return;
    }

    const updated = await tx.userGamification.updateMany({
      where: {
        userId,
        streakShields: current.streakShields,
        lastActivityDate: current.lastActivityDate,
      },
      data: {
        streakShields: resolution.remainingShields,
        lastActivityDate: resolution.effectiveLastActivityDate,
      },
    });

    if (updated.count === 0) return;

    await tx.userActivityDay.createMany({
      data: resolution.daysToShield.map((day) => ({
        userId,
        day: studyDayToDate(day),
        kind: "SHIELD",
      })),
      skipDuplicates: true,
    });
  });
}

/**
 * Troca XP disponível por 1 Escudo de Ofensiva em transação atômica.
 * - Não altera `totalXp` nem `currentLevel`.
 * - Antes de creditar o escudo, reconcilia lacunas pendentes: se a ofensiva já
 *   estava expirada sem cobertura, zera `currentStreak` para impedir
 *   ressuscitação retroativa.
 */
export async function purchaseStreakShield(
  userId: string,
  now: Date = new Date(),
  runInTransaction: RunStreakShieldTransaction = defaultRunTransaction,
): Promise<PurchaseStreakShieldResult> {
  return runInTransaction(async (tx) => {
    const current = await tx.userGamification.findUnique({
      where: { userId },
      select: SHIELD_SELECT,
    });

    if (!current) {
      throw new StreakShieldError(
        `Você precisa de pelo menos ${STREAK_SHIELD_COST} XP disponíveis para resgatar um escudo.`,
        400,
      );
    }

    const resolution = resolveShieldGap(
      current.currentStreak,
      current.lastActivityDate,
      current.streakShields,
      now,
    );

    const effectiveShieldsBeforePurchase = resolution.remainingShields;
    if (effectiveShieldsBeforePurchase >= MAX_STREAK_SHIELDS) {
      throw new StreakShieldError(
        `Você já atingiu o limite máximo de ${MAX_STREAK_SHIELDS} escudos ativos.`,
        409,
      );
    }

    const currentAvailableXp = availableXp(current.totalXp, current.xpSpent);
    if (currentAvailableXp < STREAK_SHIELD_COST) {
      throw new StreakShieldError(
        `XP insuficiente. Você precisa de ${STREAK_SHIELD_COST} XP disponíveis para resgatar um escudo.`,
        400,
      );
    }

    const nextXpSpent = current.xpSpent + STREAK_SHIELD_COST;
    const nextShields = effectiveShieldsBeforePurchase + 1;
    const nextStreak =
      resolution.status === "EXPIRED" ? 0 : current.currentStreak;
    const nextLastActivityDate =
      resolution.status === "SHIELDED"
        ? resolution.effectiveLastActivityDate
        : current.lastActivityDate;

    const updated = await tx.userGamification.updateMany({
      where: {
        userId,
        xpSpent: current.xpSpent,
        streakShields: current.streakShields,
        lastActivityDate: current.lastActivityDate,
      },
      data: {
        xpSpent: nextXpSpent,
        streakShields: nextShields,
        currentStreak: nextStreak,
        lastActivityDate: nextLastActivityDate,
      },
    });

    if (updated.count === 0) {
      throw new StreakShieldError(
        "Seu saldo foi atualizado agora há pouco. Tente resgatar novamente.",
        409,
      );
    }

    if (resolution.status === "SHIELDED" && resolution.daysToShield.length > 0) {
      await tx.userActivityDay.createMany({
        data: resolution.daysToShield.map((day) => ({
          userId,
          day: studyDayToDate(day),
          kind: "SHIELD",
        })),
        skipDuplicates: true,
      });
    }

    await tx.xpEvent.create({
      data: {
        userId,
        source: STREAK_SHIELD_PURCHASE_SOURCE,
        referenceId: toStudyDay(now),
        amount: -STREAK_SHIELD_COST,
      },
    });

    return {
      streakShields: nextShields,
      maxShields: MAX_STREAK_SHIELDS,
      shieldCost: STREAK_SHIELD_COST,
      totalXp: current.totalXp,
      availableXp: availableXp(current.totalXp, nextXpSpent),
      currentLevel: current.currentLevel,
    };
  });
}
