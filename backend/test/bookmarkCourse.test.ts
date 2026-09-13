import assert from "node:assert/strict";
import test from "node:test";
import { bookmarkCourse } from "../src/modules/courses/services/bookmarkCourse.service";

test("creates a bookmark for an existing course", async () => {
  const calls: unknown[] = [];
  const repository = {
    findCourse: async () => ({ id: "course-1" }),
    upsertBookmark: async (args: unknown) => {
      calls.push(args);
      return {};
    },
  };

  await bookmarkCourse("user-1", "course-1", repository);

  assert.deepEqual(calls[0], {
    where: { userId_courseId: { userId: "user-1", courseId: "course-1" } },
    create: { userId: "user-1", courseId: "course-1" },
    update: {},
  });
});

test("rejects bookmarks for missing courses", async () => {
  await assert.rejects(
    () =>
      bookmarkCourse("user-1", "missing-course", {
        findCourse: async () => null,
        upsertBookmark: async () => ({}),
      }),
    { message: "Curso não encontrado." },
  );
});
