import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth } from "../lib/auth";

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

    const url = new URL(request.url, `http://${request.headers.host}`);
    
    const req = new Request(url, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body as any,
    });

    const response = await auth.handler(req);
    
    // Copy headers to Fastify reply
    response.headers.forEach((value: string, key: string) => {
      reply.header(key, value);
    });

    return reply.status(response.status).send(response.body);
  });

  fastify.post("/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
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
    const url = new URL("/api/auth/sign-in/email", `http://${host}`);

    const req = new Request(url, {
      method: "POST",
      headers,
      body: JSON.stringify(request.body),
    });

    const response = await auth.handler(req);

    response.headers.forEach((value: string, key: string) => {
      reply.header(key, value);
    });

    return reply.status(response.status).send(response.body);
  });
}
