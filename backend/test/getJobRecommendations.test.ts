import { describe, expect, it, vi } from "vitest";
import { getJobRecommendations } from "../src/modules/jobs/services/getJobRecommendations.service";

describe("getJobRecommendations", () => {
  it("retorna vagas técnicas da área, priorizando estágio e júnior", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "senior",
        externalId: "senior",
        title: "Desenvolvedor Sênior",
        company: "Tech",
        location: "Recife",
        description: "Backend",
        salary: null,
        link: "https://example.com/senior",
        category: "Backend",
        updatedAt: new Date("2026-09-24T12:00:00Z"),
      },
      {
        id: "junior",
        externalId: "junior",
        title: "Desenvolvedor Backend Júnior",
        company: "Tech",
        location: "Recife",
        description: "APIs e Node.js",
        salary: null,
        link: "https://example.com/junior",
        category: "Backend",
        updatedAt: new Date("2026-09-24T13:00:00Z"),
      },
      {
        id: "internship",
        externalId: "internship",
        title: "Estágio em Desenvolvimento",
        company: "Tech",
        location: "Recife",
        description: "Frontend",
        salary: null,
        link: "https://example.com/internship",
        category: "Frontend",
        updatedAt: new Date("2026-09-24T10:00:00Z"),
      },
      {
        id: "non-tech",
        externalId: "non-tech",
        title: "Estágio Administrativo",
        company: "Empresa",
        location: "Recife",
        description: "Rotinas administrativas",
        salary: null,
        link: "https://example.com/non-tech",
        category: "Backend",
        updatedAt: new Date("2026-09-24T14:00:00Z"),
      },
      {
        id: "library",
        externalId: "library",
        title: "Estágio em Biblioteca - PE",
        company: "Cesumar",
        location: "Recife, PE",
        description: "Atendimento e organização de acervo",
        salary: null,
        link: "https://example.com/library",
        category: "Frontend",
        updatedAt: new Date("2026-09-24T15:00:00Z"),
      },
      {
        id: "administrative",
        externalId: "administrative",
        title: "Estágio Administrativo (Trabalhista)",
        company: "Bernhoeft GRT",
        location: "Recife, PE",
        description: "Rotinas administrativas",
        salary: null,
        link: "https://example.com/administrative",
        category: "Mobile",
        updatedAt: new Date("2026-09-24T16:00:00Z"),
      },
    ]);
    const repository = {
      vocationalDiagnosis: {
        findUnique: vi.fn().mockResolvedValue({
          areaPrincipal: "Desenvolvimento de Software",
        }),
      },
      job: { findMany },
    };

    const result = await getJobRecommendations("user-1", repository);

    expect(result.jobs.map((job) => [job.id, job.contractType])).toEqual([
      ["internship", "Estágio"],
      ["junior", "Júnior"],
      ["senior", "Sênior"],
    ]);
  });

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
