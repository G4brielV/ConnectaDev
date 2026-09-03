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
    
    const requestBody =
      request.body === undefined || request.body === null
        ? undefined
        : typeof request.body === "string"
          ? request.body
          : JSON.stringify(request.body);

    const req = new Request(url, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : requestBody,
    });

    const response = await auth.handler(req);
    
    // Copy headers to Fastify reply
    response.headers.forEach((value: string, key: string) => {
      reply.header(key, value);
    });

    const responseBody = await response.text();
    return reply.status(response.status).send(responseBody);
  });
}
