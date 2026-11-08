import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateDistanceKm,
  InfrastructureService,
} from "../src/modules/infrastructure/services/infrastructure.service";
import type { PrismaClient, PublicInfrastructure } from "@prisma/client";

describe("calculateDistanceKm", () => {
  it("retorna 0 para coordenadas idênticas", () => {
    const dist = calculateDistanceKm(-8.0632, -34.8718, -8.0632, -34.8718);
    expect(dist).toBe(0);
  });

  it("calcula corretamente a distância entre o Marco Zero do Recife e a BPE (Santo Amaro)", () => {
    // Marco Zero: -8.0632, -34.8718
    // BPE (Parque Treze de Maio): -8.0573, -34.8824
    const dist = calculateDistanceKm(-8.0632, -34.8718, -8.0573, -34.8824);
    // Distância real em linha reta ~1.3 km
    expect(dist).toBeGreaterThan(1.0);
    expect(dist).toBeLessThan(1.8);
    expect(dist).toBe(1.3);
  });

  it("calcula a distância até o Compaz Eduardo Campos (Alto Santa Terezinha)", () => {
    // Marco Zero: -8.0632, -34.8718
    // Compaz Eduardo Campos: -8.0055, -34.8988
    const dist = calculateDistanceKm(-8.0632, -34.8718, -8.0055, -34.8988);
    expect(dist).toBe(7.1);
  });
});

describe("InfrastructureService", () => {
  let mockPrisma: any;
  let service: InfrastructureService;

  const samplePoints: PublicInfrastructure[] = [
    {
      id: "point-1",
      name: "Biblioteca Pública do Estado",
      type: "LIBRARY",
      address: "Rua João Lira, s/n",
      neighborhood: "Santo Amaro",
      city: "Recife",
      latitude: -8.0573,
      longitude: -34.8824,
      hasComputers: true,
      hasWifi: true,
      hasStudyTables: true,
      openingHours: "08:00 às 17:00",
      accessRules: "Documento com foto",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "point-2",
      name: "Compaz Governador Eduardo Campos",
      type: "COMPAZ",
      address: "Av. Aníbal Benévolo, s/n",
      neighborhood: "Alto Santa Terezinha",
      city: "Recife",
      latitude: -8.0055,
      longitude: -34.8988,
      hasComputers: true,
      hasWifi: true,
      hasStudyTables: true,
      openingHours: "07:00 às 21:00",
      accessRules: null,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "point-3",
      name: "Polo Conecta Recife - Praça do Derby",
      type: "PUBLIC_WIFI",
      address: "Praça do Derby, s/n",
      neighborhood: "Derby",
      city: "Recife",
      latitude: -8.056,
      longitude: -34.8997,
      hasComputers: false,
      hasWifi: true,
      hasStudyTables: true,
      openingHours: "24h",
      accessRules: null,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockPrisma = {
      publicInfrastructure: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    };
    service = new InfrastructureService(mockPrisma as unknown as PrismaClient);
  });

  it("lista apenas locais ativos por padrão", async () => {
    mockPrisma.publicInfrastructure.findMany.mockResolvedValueOnce(samplePoints);

    const result = await service.list({});

    expect(mockPrisma.publicInfrastructure.findMany).toHaveBeenCalledWith({
      where: { status: "ACTIVE" },
      orderBy: [{ city: "asc" }, { name: "asc" }],
    });
    expect(result).toHaveLength(3);
  });

  it("filtra por hasComputers = true quando solicitado", async () => {
    mockPrisma.publicInfrastructure.findMany.mockResolvedValueOnce([
      samplePoints[0],
      samplePoints[1],
    ]);

    await service.list({ hasComputers: true });

    expect(mockPrisma.publicInfrastructure.findMany).toHaveBeenCalledWith({
      where: {
        status: "ACTIVE",
        hasComputers: true,
      },
      orderBy: [{ city: "asc" }, { name: "asc" }],
    });
  });

  it("filtra por tipo e normaliza para caixa alta", async () => {
    mockPrisma.publicInfrastructure.findMany.mockResolvedValueOnce([samplePoints[1]]);

    await service.list({ type: "compaz" });

    expect(mockPrisma.publicInfrastructure.findMany).toHaveBeenCalledWith({
      where: {
        status: "ACTIVE",
        type: "COMPAZ",
      },
      orderBy: [{ city: "asc" }, { name: "asc" }],
    });
  });

  it("calcula distância e ordena do mais próximo ao mais distante quando fornecidas coordenadas", async () => {
    mockPrisma.publicInfrastructure.findMany.mockResolvedValueOnce(samplePoints);

    // Usuário próximo ao Marco Zero (-8.0632, -34.8718)
    // Distâncias:
    // BPE: ~1.3 km
    // Praça do Derby: ~3.2 km
    // Compaz Eduardo Campos: ~7.1 km
    const result = await service.list({ lat: -8.0632, lng: -34.8718 });

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("point-1"); // BPE mais próxima
    expect(result[0].distanceKm).toBe(1.3);

    expect(result[1].id).toBe("point-3"); // Derby intermediário
    expect(result[1].distanceKm).toBe(3.2);

    expect(result[2].id).toBe("point-2"); // Compaz mais distante do Marco Zero
    expect(result[2].distanceKm).toBe(7.1);
  });

  it("cadastra novo ponto de apoio com os dados informados", async () => {
    const input = {
      name: "Novo Compaz",
      type: "COMPAZ" as const,
      address: "Rua Nova, 123",
      neighborhood: "Boa Vista",
      city: "Recife",
      latitude: -8.055,
      longitude: -34.89,
      hasComputers: true,
      hasWifi: true,
      hasStudyTables: true,
      status: "ACTIVE" as const,
    };

    mockPrisma.publicInfrastructure.create.mockResolvedValueOnce({
      id: "point-new",
      ...input,
      openingHours: null,
      accessRules: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const created = await service.create(input);

    expect(mockPrisma.publicInfrastructure.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Novo Compaz",
        city: "Recife",
        hasWifi: true,
        hasComputers: true,
      }),
    });
    expect(created.id).toBe("point-new");
  });
});
