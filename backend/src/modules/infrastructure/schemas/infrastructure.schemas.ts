import { z } from "zod";

export const getInfrastructureQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  hasComputers: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  type: z.string().optional(),
  city: z.string().optional(),
});

export type GetInfrastructureQuery = z.infer<typeof getInfrastructureQuerySchema>;

export const createInfrastructureSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  type: z.enum(["COMPAZ", "LIBRARY", "INNOVATION_HUB", "PUBLIC_WIFI"]),
  address: z.string().min(5, "Endereço deve ter no mínimo 5 caracteres"),
  neighborhood: z.string().min(2, "Bairro deve ter no mínimo 2 caracteres"),
  city: z.string().min(2, "Cidade deve ter no mínimo 2 caracteres"),
  latitude: z.number({ message: "Latitude é obrigatória" }),
  longitude: z.number({ message: "Longitude é obrigatória" }),
  hasComputers: z.boolean().default(false),
  hasWifi: z.boolean().default(true),
  hasStudyTables: z.boolean().default(true),
  openingHours: z.string().optional(),
  accessRules: z.string().optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]).default("ACTIVE"),
});

export type CreateInfrastructureInput = z.infer<typeof createInfrastructureSchema>;
