import { describe, expect, it, vi } from "vitest";
import {
  JoobleIntegrationService,
  type JobCategory,
} from "../src/modules/jobs/services/joobleIntegration.service";

describe("JoobleIntegrationService", () => {
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
          isExpired: false,
        }),
      }),
    );
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: "Backend",
          location: { contains: "Recife" },
        }),
        data: { isExpired: true },
      }),
    );
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
