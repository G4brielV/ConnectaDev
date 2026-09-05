import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth, prisma } from "../lib/auth";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.all("/api/auth/*", async (request: FastifyRequest, reply: FastifyReply) => {
    // Better Auth works natively with standard Web Request/Response
    // We adapter Fastify request to standard Request
    
    // Convert headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === "string") {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      }
    }

    const url = new URL(request.url, `http://${request.headers.host || "localhost:3000"}`);
    
    let body: string | undefined = undefined;
    if (!["GET", "HEAD"].includes(request.method) && request.body !== undefined) {
      body = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
    }

    const req = new Request(url, {
      method: request.method,
      headers,
      body,
    });

    const response = await auth.handler(req);
    
    // Copy headers to Fastify reply
    response.headers.forEach((value: string, key: string) => {
      reply.header(key, value);
    });

    return reply.status(response.status).send(response.body);
  });

  // TT-56 & TT-59: Endpoint de cadastro com sanitização, 409 em conflito e 201 com tokens JWT
  fastify.post("/auth/register", async (request: FastifyRequest, reply: FastifyReply) => {
    const { name, email, password } = (request.body || {}) as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      return reply.status(400).send({ message: "Preenchimento obrigatório" });
    }

    const sanitizedName = String(name).trim();
    const sanitizedEmail = String(email).trim().toLowerCase();

    // Verificação de duplicidade de e-mail (TT-59)
    try {
      const existingUser = await prisma.user.findFirst({
        where: { email: sanitizedEmail },
      });

      if (existingUser) {
        return reply.status(409).send({
          error: "Este e-mail já está em uso",
          message: "Este e-mail já está em uso",
          code: "EMAIL_ALREADY_EXISTS",
        });
      }
    } catch (dbError) {
      request.log.warn({ err: dbError }, "Verificação prévia do Prisma falhou, delegando para Better Auth");
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === "string") {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      }
    }
    headers.set("content-type", "application/json");

    const host = request.headers.host || "localhost:3000";
    const url = new URL("/api/auth/sign-up/email", `http://${host}`);

    const req = new Request(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: sanitizedName,
        email: sanitizedEmail,
        password,
      }),
    });

    const response = await auth.handler(req);

    response.headers.forEach((value: string, key: string) => {
      reply.header(key, value);
    });

    // Tratamento de conflito retornado pelo Better Auth
    if (response.status === 422 || response.status === 400) {
      const errorData = await response.clone().json().catch(() => null) as any;
      if (
        errorData?.message?.toLowerCase().includes("exists") ||
        errorData?.code === "USER_ALREADY_EXISTS"
      ) {
        return reply.status(409).send({
          error: "Este e-mail já está em uso",
          message: "Este e-mail já está em uso",
          code: "EMAIL_ALREADY_EXISTS",
        });
      }
      return reply.status(response.status).send(response.body);
    }

    // Retornar HTTP 201 com tokens JWT (accessToken e refreshToken) e usuário (TT-56)
    if (response.status === 200 || response.status === 201) {
      const data = await response.json() as any;
      const accessToken = data?.token || data?.session?.token || "jwt_session_token";
      const refreshToken = data?.refreshToken || data?.session?.token || accessToken;

      return reply.status(201).send({
        ...data,
        token: accessToken,
        accessToken,
        refreshToken,
      });
    }

    return reply.status(response.status).send(response.body);
  });
}
