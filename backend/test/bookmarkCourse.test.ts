import { describe, it, expect, vi } from "vitest";
import { bookmarkCourse } from "../src/modules/courses/services/bookmarkCourse.service";

describe("bookmarkCourse", () => {
  it("cria um bookmark para um curso existente", async () => {
    const repository = {
      findCourse: vi.fn().mockResolvedValue({ id: "course-1" }),
      upsertBookmark: vi.fn().mockResolvedValue({}),
    };

    await bookmarkCourse("user-1", "course-1", repository);

    expect(repository.findCourse).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: "course-1" }
    });

    expect(repository.upsertBookmark).toHaveBeenCalledWith({
      where: { userId_courseId: { userId: "user-1", courseId: "course-1" } },
      create: { userId: "user-1", courseId: "course-1" },
      update: {},
    });
  });

  it("rejeita bookmark para curso inexistente", async () => {
    const repository = {
      findCourse: vi.fn().mockResolvedValue(null),
      upsertBookmark: vi.fn().mockResolvedValue({}),
    };

    await expect(
      bookmarkCourse("user-1", "missing-course", repository),
    ).rejects.toThrow("Curso não encontrado.");

    expect(repository.upsertBookmark).not.toHaveBeenCalled();
  });
});