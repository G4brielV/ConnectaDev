import { describe, expect, it, vi } from "vitest";
import {
  JoobleIntegrationService,
  type JobCategory,
} from "../src/modules/jobs/services/joobleIntegration.service";

describe("JoobleIntegrationService", () => {
  it("não persiste resultados do Jooble que não tenham cargo técnico no título", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          jobs: [
            {
              id: 1,
              title: "Estágio em Biblioteca - PE",
              location: "Recife, PE",
              snippet: "Atendimento e organização de acervo",
              link: "https://example.com/library",
            },
            {
              id: 2,
              title: "Estágio Frontend React",
              location: "Recife, PE",
              snippet: "Desenvolvimento de interfaces",
              link: "https://example.com/frontend",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const upsert = vi.fn().mockResolvedValue({});
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const service = new JoobleIntegrationService({
      apiKey: "test-key",
      fetcher,
      categories: ["Frontend"],
      repository: { job: { upsert, updateMany } },
    });

    await service.synchronize();

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { externalId: "2" },
      }),
    );
  });

  it("consulta uma categoria e persiste a vaga pelo identificador externo", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          jobs: [
            {
              id: 123,
              title: "Estágio Backend",
              location: "Recife",
              snippet: "Desenvolvimento de APIs",
              salary: "R$ 1.500",
              link: "https://example.com/job/123",
              company: "Empresa Tech",
              updated: "2026-09-23T12:00:00.000Z",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const upsert = vi.fn().mockResolvedValue({});
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });

    const service = new JoobleIntegrationService({
      apiKey: "test-key",
      apiUrl: "https://br.jooble.org/api",
      fetcher,
      categories: ["Backend" as JobCategory],
      repository: { job: { upsert, updateMany } },
    });

    await expect(service.synchronize()).resolves.toEqual({
      fetched: 1,
      synchronized: 1,
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://br.jooble.org/api/test-key",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"keywords":"estágio junior backend tecnologia"'),
      }),
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { externalId: "123" },
        create: expect.objectContaining({
          externalId: "123",
          category: "Backend",
          tags: ["Backend", "API"],
          isExpired: false,
        }),
      }),
    );
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isExpired: false,
          OR: expect.arrayContaining([
            { location: { contains: "Recife" } },
          ]),
        }),
        data: { isExpired: true },
      }),
    );
  });

  it("inativa vagas que não retornaram no ciclo completo", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ jobs: [{
        id: "current-job",
        title: "Estágio Backend",
        location: "Recife",
        snippet: "Desenvolvimento de APIs",
        link: "https://example.com/job/current",
      }] }), { status: 200 }),
    );
    const upsert = vi.fn().mockResolvedValue({});
    const updateMany = vi.fn().mockResolvedValue({ count: 3 });
    const service = new JoobleIntegrationService({
      apiKey: "test-key",
      fetcher,
      categories: ["Backend"],
      repository: { job: { upsert, updateMany } },
    });

    await service.synchronize();

    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        AND: [{
          OR: expect.arrayContaining([
            { externalId: { notIn: ["current-job"] } },
          ]),
        }],
      }),
      data: { isExpired: true },
    }));
  });

  it("insere uma vaga nova e atualiza a existente pelo mesmo externalId", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        jobs: [{
          id: "same-job",
          title: "Estágio Backend",
          location: "Recife",
          snippet: "Desenvolvimento de APIs",
          link: "https://example.com/job/same-job",
        }],
      }), { status: 200 }),
    );
    const upsert = vi.fn().mockResolvedValue({});
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const service = new JoobleIntegrationService({
      apiKey: "test-key",
      fetcher,
      categories: ["Backend"],
      repository: { job: { upsert, updateMany } },
    });

    await service.synchronize();

    expect(upsert.mock.calls[0]?.[0]).toMatchObject({
      where: { externalId: "same-job" },
      create: { externalId: "same-job", isExpired: false },
      update: { title: "Estágio Backend", isExpired: false },
    });
  });

  it("deduplica o mesmo externalId repetido no retorno do provedor", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        jobs: [
          { id: 42, title: "Estágio Backend", location: "Recife", snippet: "Desenvolvimento de APIs", link: "https://example.com/job/42" },
          { id: 42, title: "Estágio Backend atualizado", location: "Recife", snippet: "Desenvolvimento de APIs", link: "https://example.com/job/42" },
        ],
      }), { status: 200 }),
    );
    const upsert = vi.fn().mockResolvedValue({});
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const service = new JoobleIntegrationService({
      apiKey: "test-key",
      fetcher,
      categories: ["Backend"],
      repository: { job: { upsert, updateMany } },
    });

    await expect(service.synchronize()).resolves.toMatchObject({
      fetched: 2,
      synchronized: 1,
    });
    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it("falha explicitamente quando a API retorna erro", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("rate limit", { status: 429 }),
    );
    const service = new JoobleIntegrationService({
      apiKey: "test-key",
      fetcher,
      categories: ["QA"],
      repository: {
        job: {
          upsert: vi.fn(),
          updateMany: vi.fn(),
        },
      },
    });

    await expect(service.synchronize()).resolves.toEqual({
      fetched: 0,
      synchronized: 0,
    });
  });
});
