import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, jwt } from "better-auth/plugins";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { sanitizeName } from "../shared/utils/sanitization";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: (req) => [
    "http://localhost:8081",
    "http://localhost:3000",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:3000",
    req?.headers.get("origin") || null,
  ],
  advanced: {
    disableCSRFCheck: true,
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return {
            data: {
              ...user,
              name: typeof user.name === "string" ? sanitizeName(user.name) : user.name,
            },
          };
        },
      },
      update: {
        before: async (user) => {
          return {
            data: {
              ...user,
              name: typeof user.name === "string" ? sanitizeName(user.name) : user.name,
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    bearer(),
    jwt({
      jwt: {
        expirationTime: "7d",
      },
    }),
  ]
});

export async function ensureDevelopmentUser(): Promise<string> {
  const userId = "development-user";
  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      name: "Development User",
      email: "development-user@connectadev.local",
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: {},
  });
  return userId;
}
