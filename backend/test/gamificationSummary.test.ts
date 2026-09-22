import assert from "node:assert/strict";
import test from "node:test";
import {
  GamificationSummaryRepository,
  getGamificationSummaryService,
} from "../src/modules/gamification/services/getGamificationSummary.service";
import { LEVEL_NAME } from "../src/modules/gamification/constants/xpLevel";

test("getGamificationSummaryService returns zeros for a user without gamification record", async () => {
  const repository: GamificationSummaryRepository = {
    findGamification: async () => null,
    countCompletedReviews: async () => 0,
  };

  const summary = await getGamificationSummaryService("user-1", repository);

  assert.deepEqual(summary, {
    totalXp: 0,
    currentLevel: 1,
    levelName: LEVEL_NAME,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    completedReviews: 0,
  });
});

test("getGamificationSummaryService maps the stored record and completed review count", async () => {
  const repository: GamificationSummaryRepository = {
    findGamification: async (userId) => {
      assert.equal(userId, "user-1");
      return {
        totalXp: 120,
        currentLevel: 2,
        currentStreak: 3,
        longestStreak: 7,
        lastActivityDate: new Date("2026-09-17T10:00:00Z"),
      };
    },
    countCompletedReviews: async () => 4,
  };

  const summary = await getGamificationSummaryService("user-1", repository);

  assert.deepEqual(summary, {
    totalXp: 120,
    currentLevel: 2,
    levelName: LEVEL_NAME,
    currentStreak: 3,
    longestStreak: 7,
    lastActivityDate: "2026-09-17T10:00:00.000Z",
    completedReviews: 4,
  });
});
