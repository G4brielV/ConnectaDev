import { describe, it, expect, vi } from "vitest";
import {
  GamificationSummaryRepository,
  getGamificationSummaryService,
} from "../src/modules/gamification/services/getGamificationSummary.service";
import { LEVEL_NAME } from "../src/modules/gamification/constants/xpLevel";

function makeRepository(
  overrides: Partial<GamificationSummaryRepository> = {},
): GamificationSummaryRepository {
  return {
    findGamification: vi.fn().mockResolvedValue(null),
    countCompletedReviews: vi.fn().mockResolvedValue(0),
    ...overrides,
  };
}

describe("getGamificationSummaryService", () => {
  it("retorna zeros para um usuário sem registro de gamificação", async () => {
    const repository = makeRepository();

    const summary = await getGamificationSummaryService("user-1", repository);

    expect(summary).toEqual({
      totalXp: 0,
      currentLevel: 1,
      levelName: LEVEL_NAME,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      completedReviews: 0,
    });

    expect(repository.findGamification).toHaveBeenCalledWith("user-1");
    expect(repository.countCompletedReviews).toHaveBeenCalledWith("user-1");
  });

  it("mapeia o registro armazenado e a contagem de reviews concluídas", async () => {
    const repository = makeRepository({
      findGamification: vi.fn().mockResolvedValue({
        totalXp: 120,
        currentLevel: 2,
        currentStreak: 3,
        longestStreak: 7,
        lastActivityDate: new Date("2026-09-17T10:00:00Z"),
      }),
      countCompletedReviews: vi.fn().mockResolvedValue(4),
    });

    // Mesmo dia da última atividade: a ofensiva gravada continua valendo.
    const summary = await getGamificationSummaryService(
      "user-1",
      repository,
      new Date("2026-09-17T15:00:00Z"),
    );

    expect(summary).toEqual({
      totalXp: 120,
      currentLevel: 2,
      levelName: LEVEL_NAME,
      currentStreak: 3,
      longestStreak: 7,
      lastActivityDate: "2026-09-17T10:00:00.000Z",
      completedReviews: 4,
    });

    expect(repository.findGamification).toHaveBeenCalledWith("user-1");
    expect(repository.countCompletedReviews).toHaveBeenCalledWith("user-1");
  });

  it("zera a ofensiva de quem faltou um dia, sem mexer no recorde", async () => {
    const repository = makeRepository({
      findGamification: vi.fn().mockResolvedValue({
        totalXp: 120,
        currentLevel: 2,
        currentStreak: 3,
        longestStreak: 7,
        lastActivityDate: new Date("2026-09-17T10:00:00Z"),
      }),
    });

    const summary = await getGamificationSummaryService(
      "user-1",
      repository,
      new Date("2026-09-19T15:00:00Z"),
    );

    expect(summary.currentStreak).toBe(0);
    expect(summary.longestStreak).toBe(7);
  });
});
