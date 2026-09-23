import { describe, expect, it, vi } from "vitest";
import { getJobRecommendations } from "../src/modules/jobs/services/getJobRecommendations.service";

describe("getJobRecommendations", () => {
  it("filtra vagas pela área do diagnóstico e pela RMR", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = {
      vocationalDiagnosis: {
        findUnique: vi.fn().mockResolvedValue({ areaPrincipal: "Backend" }),
      },
      job: { findMany },
    };

    const result = await getJobRecommendations("user-1", repository);

    expect(result).toMatchObject({
      hasDiagnosis: true,
      areaPrincipal: "Backend",
      jobs: [],
      canRetry: true,
    });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        category: { in: ["Backend"] },
        isExpired: false,
      }),
    }));
  });

  it("retorna vagas gerais quando o usuário não possui diagnóstico", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = {
      vocationalDiagnosis: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      job: { findMany },
    };

    const result = await getJobRecommendations("user-1", repository);

    expect(result).toMatchObject({
      hasDiagnosis: false,
      areaPrincipal: "",
      message: "Não foi possível atualizar as vagas no momento. Volte em breve!",
      canRetry: true,
    });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.not.objectContaining({ category: expect.anything() }),
    }));
  });
});
