import { PrismaClient, PublicInfrastructure } from "@prisma/client";
import { GetInfrastructureQuery, CreateInfrastructureInput } from "../schemas/infrastructure.schemas";

export interface InfrastructureWithDistance extends PublicInfrastructure {
  distanceKm?: number;
}

/**
 * Calcula a distância geográfica entre dois pontos na Terra usando a fórmula Haversine.
 * Retorna a distância em quilômetros arredondada para 1 casa decimal.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

export class InfrastructureService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: GetInfrastructureQuery): Promise<InfrastructureWithDistance[]> {
    const where: Record<string, unknown> = {
      status: "ACTIVE",
    };

    if (query.hasComputers !== undefined) {
      where.hasComputers = query.hasComputers;
    }

    if (query.type) {
      where.type = query.type.toUpperCase();
    }

    if (query.city) {
      where.city = {
        contains: query.city,
        mode: "insensitive",
      };
    }

    const items = await this.prisma.publicInfrastructure.findMany({
      where,
      orderBy: [{ city: "asc" }, { name: "asc" }],
    });

    if (query.lat !== undefined && query.lng !== undefined) {
      const withDistance: InfrastructureWithDistance[] = items.map((item) => ({
        ...item,
        distanceKm: calculateDistanceKm(
          query.lat!,
          query.lng!,
          item.latitude,
          item.longitude
        ),
      }));

      // Ordena por proximidade (menor distância primeiro)
      withDistance.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
      return withDistance;
    }

    return items;
  }

  async create(data: CreateInfrastructureInput): Promise<PublicInfrastructure> {
    return this.prisma.publicInfrastructure.create({
      data: {
        name: data.name,
        type: data.type,
        address: data.address,
        neighborhood: data.neighborhood,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        hasComputers: data.hasComputers,
        hasWifi: data.hasWifi,
        hasStudyTables: data.hasStudyTables,
        openingHours: data.openingHours || null,
        accessRules: data.accessRules || null,
        status: data.status,
      },
    });
  }
}
