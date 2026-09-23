import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { createHash } from "node:crypto";

// ---------- Tipos ----------
type EmailArgs = { from: string; to: string; subject: string; html: string };
type EmailResult = { id: string };

// ---------- Mocks compartilhados (hoisted) ----------
// vi.hoisted sobe a declaração acima dos imports, para que as factories
// de vi.mock() possam referenciar os mesmos vi.fn() que os testes.
const m = vi.hoisted(() => ({
  authHandler: vi.fn<(req: Request) => Promise<Response>>(),
  findFirst: vi.fn<(args: { where: { email: string } }) => Promise<unknown>>(),
  findUnique: vi.fn<(args: { where: { email: string } }) => Promise<unknown>>(),
  prtDeleteMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(),
  prtCreate: vi.fn<(args: any) => Promise<unknown>>(),
  prtFindUnique: vi.fn<(args: any) => Promise<unknown>>(),
  prtDelete: vi.fn<(args: any) => Promise<unknown>>(),
  sessionDeleteMany: vi.fn<(args: any) => Promise<{ count: number }>>(),
  accountUpdateMany: vi.fn<(args: any) => Promise<{ count: number }>>(),
  emailsSend: vi.fn<(args: EmailArgs) => Promise<EmailResult>>(),
  hashPassword: vi.fn<(pw: string) => Promise<string>>(),
}));

vi.mock("../src/lib/auth", () => ({
  auth: { handler: m.authHandler },
  prisma: {
    user: { findFirst: m.findFirst, findUnique: m.findUnique },
    passwordResetToken: {
      deleteMany: m.prtDeleteMany,
      create: m.prtCreate,
      findUnique: m.prtFindUnique,
      delete: m.prtDelete,
    },
    session: { deleteMany: m.sessionDeleteMany },
    account: { updateMany: m.accountUpdateMany },
  },
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: m.emailsSend };
  },
}));

vi.mock("better-auth/crypto", () => ({
  hashPassword: m.hashPassword,
}));

// ---------- Import DEPOIS dos mocks (que são hoisted) ----------
import { authRoutes } from "../src/routes/auth.routes";

// ---------- Helpers ----------
function jsonResponse(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// ---------- Ciclo de vida ----------
let app: FastifyInstance;

beforeEach(async () => {
  vi.resetAllMocks();

  // Defaults — cada teste sobrescreve só o que precisa com *Once().
  m.authHandler.mockResolvedValue(jsonResponse(200, {}));
  m.findFirst.mockResolvedValue(null);
  m.findUnique.mockResolvedValue(null);
  m.prtDeleteMany.mockResolvedValue({ count: 0 });
  m.prtCreate.mockResolvedValue({});
  m.prtFindUnique.mockResolvedValue(null);
  m.prtDelete.mockResolvedValue({});
  m.sessionDeleteMany.mockResolvedValue({ count: 0 });
  m.accountUpdateMany.mockResolvedValue({ count: 1 });
  m.emailsSend.mockResolvedValue({ id: "email_123" });
  m.hashPassword.mockImplementation(async (pw) => `hashed:${pw}`);

  app = Fastify();
  await app.register(authRoutes);
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

// =====================================================================
// POST /auth/register
// =====================================================================
describe("POST /auth/register", () => {
  it("400 quando falta campo obrigatório", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Ana", email: "ana@example.com" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().message).toBe("Preenchimento obrigatório");
  });

  it("409 quando Prisma já encontra o e-mail (pre-check)", async () => {
    m.findFirst.mockResolvedValueOnce({ id: "u1", email: "ana@example.com" });

    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Ana", email: "ANA@Example.com ", password: "Sup3rSecret!" },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("EMAIL_ALREADY_EXISTS");
    expect(m.findFirst).toHaveBeenCalledWith({ where: { email: "ana@example.com" } });
    expect(m.authHandler).not.toHaveBeenCalled();
  });

  it("cai no Better Auth quando o pre-check do Prisma falha, e ainda dá 201", async () => {
    m.findFirst.mockRejectedValueOnce(new Error("db down"));
    m.authHandler.mockResolvedValueOnce(
      jsonResponse(200, { token: "tok_1", user: { id: "u1" } }),
    );

    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Ana", email: "ana@example.com", password: "Sup3rSecret!" },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().accessToken).toBe("tok_1");
  });

  it("201 com accessToken/refreshToken no sucesso", async () => {
    m.authHandler.mockImplementationOnce(async (req) => {
      const body = await req.json();
      expect(body.email).toBe("ana@example.com");
      expect(body.name).toBe("Ana");
      return jsonResponse(200, {
        token: "tok_abc",
        user: { id: "u1", email: "ana@example.com" },
      });
    });

    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: " Ana ", email: " ANA@example.com ", password: "Sup3rSecret!" },
    });

    expect(res.statusCode).toBe(201);
    const json = res.json();
    expect(json.token).toBe("tok_abc");
    expect(json.accessToken).toBe("tok_abc");
    expect(json.refreshToken).toBe("tok_abc");
    expect(json.user.id).toBe("u1");
  });

  it("409 quando o próprio Better Auth reporta e-mail já existente", async () => {
    m.authHandler.mockResolvedValueOnce(
      jsonResponse(422, { code: "USER_ALREADY_EXISTS", message: "user exists" }),
    );

    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Ana", email: "ana@example.com", password: "Sup3rSecret!" },
    });

    expect(res.statusCode).toBe(409);
    expect(res.json().code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("repassa outros status de erro do Better Auth inalterados", async () => {
    m.authHandler.mockResolvedValueOnce(jsonResponse(400, { message: "senha fraca" }));

    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Ana", email: "ana@example.com", password: "123" },
    });

    expect(res.statusCode).toBe(400);
  });
});

// =====================================================================
// POST /auth/logout
// =====================================================================
describe("POST /auth/logout", () => {
  it("retorna 200 e revoga a sessão para um bearer token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { authorization: "Bearer session_tok_1" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
    expect(m.sessionDeleteMany).toHaveBeenCalledWith({ where: { token: "session_tok_1" } });
  });

  it("cai para token no body quando não há header bearer", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: { token: "body_tok" },
    });

    expect(res.statusCode).toBe(200);
    expect(m.sessionDeleteMany).toHaveBeenCalledWith({ where: { token: "body_tok" } });
  });

  it("ainda retorna 200 se o handler do Better Auth lançar", async () => {
    m.authHandler.mockRejectedValueOnce(new Error("upstream boom"));

    const res = await app.inject({ method: "POST", url: "/auth/logout" });
    expect(res.statusCode).toBe(200);
  });

  it("não chama session.deleteMany quando não há token", async () => {
    await app.inject({ method: "POST", url: "/auth/logout" });
    expect(m.sessionDeleteMany).not.toHaveBeenCalled();
  });
});

// =====================================================================
// POST /auth/forgot-password
// =====================================================================
describe("POST /auth/forgot-password", () => {
  it("400 quando falta e-mail", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 200 genérico e não envia e-mail para endereço desconhecido", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      payload: { email: "ghost@example.com" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().message).toMatch(/Se este e‑mail estiver cadastrado/);
    expect(m.emailsSend).not.toHaveBeenCalled();
  });

  it("para e-mail conhecido: limpa tokens antigos, salva sha256 do código e envia", async () => {
    m.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "ana@example.com",
      name: "Ana",
    });

    const res = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      payload: { email: " ANA@example.com " },
    });

    expect(res.statusCode).toBe(200);
    expect(m.prtDeleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });

    expect(m.emailsSend).toHaveBeenCalledTimes(1);
    const [sendArgs] = m.emailsSend.mock.calls[0]!;
    expect(sendArgs.to).toBe("ana@example.com");

    const rawCode = sendArgs.subject.match(/^(\d{6})/)![1]!;
    const expectedHash = createHash("sha256").update(rawCode).digest("hex");

    expect(m.prtCreate).toHaveBeenCalledTimes(1);
    const [createArgs] = m.prtCreate.mock.calls[0]!;
    expect(createArgs.data.token).toBe(expectedHash);
    expect(createArgs.data.userId).toBe("u1");
    expect(createArgs.data.token).not.toBe(rawCode);
    expect(createArgs.data.expiresAt).toBeInstanceOf(Date);
  });

  it("500 quando o Resend falha ao enviar", async () => {
    m.findUnique.mockResolvedValueOnce({
      id: "u1",
      email: "ana@example.com",
      name: "Ana",
    });
    m.emailsSend.mockRejectedValueOnce(new Error("resend down"));

    const res = await app.inject({
      method: "POST",
      url: "/auth/forgot-password",
      payload: { email: "ana@example.com" },
    });

    expect(res.statusCode).toBe(500);
  });
});

// =====================================================================
// POST /auth/reset-password
// =====================================================================
describe("POST /auth/reset-password", () => {
  it("400 quando faltam token ou nova senha", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: { token: "123456" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("400 quando o token hasheado não é encontrado", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: { token: "000000", newPassword: "NewPass123!" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toMatch(/inválido ou expirado/);
  });

  it("400 e apaga o registro quando o token expirou", async () => {
    const rawCode = "654321";
    const tokenHash = createHash("sha256").update(rawCode).digest("hex");
    m.prtFindUnique.mockResolvedValueOnce({
      id: "prt_1",
      userId: "u1",
      token: tokenHash,
      expiresAt: new Date(Date.now() - 60_000),
    });

    const res = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: { token: rawCode, newPassword: "NewPass123!" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toMatch(/Código expirado/);
    expect(m.prtDelete).toHaveBeenCalledWith({ where: { id: "prt_1" } });
    expect(m.accountUpdateMany).not.toHaveBeenCalled();
  });

  it("400 quando o usuário não tem credencial para atualizar (count === 0)", async () => {
    const rawCode = "111222";
    const tokenHash = createHash("sha256").update(rawCode).digest("hex");
    m.prtFindUnique.mockResolvedValueOnce({
      id: "prt_2",
      userId: "u1",
      token: tokenHash,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });
    m.accountUpdateMany.mockResolvedValueOnce({ count: 0 });

    const res = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: { token: rawCode, newPassword: "NewPass123!" },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toMatch(/não possui credencial/);
    // comportamento atual do código: token usado NÃO é limpo neste caminho
    expect(m.prtDelete).not.toHaveBeenCalled();
  });

  it("200 no sucesso: hasheia a senha, atualiza credencial, apaga token e revoga sessões", async () => {
    const rawCode = "999888";
    const tokenHash = createHash("sha256").update(rawCode).digest("hex");
    m.prtFindUnique.mockResolvedValueOnce({
      id: "prt_3",
      userId: "u1",
      token: tokenHash,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });
    m.hashPassword.mockImplementationOnce(async (pw) => `HASHED[${pw}]`);

    const res = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: { token: rawCode, newPassword: "NewPass123!" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().message).toMatch(/Senha redefinida com sucesso/);

    expect(m.hashPassword).toHaveBeenCalledWith("NewPass123!");
    expect(m.accountUpdateMany).toHaveBeenCalledWith({
      where: { userId: "u1", providerId: "credential" },
      data: expect.objectContaining({ password: "HASHED[NewPass123!]" }),
    });
    expect(m.prtDelete).toHaveBeenCalledWith({ where: { id: "prt_3" } });
    expect(m.sessionDeleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("500 quando um erro inesperado é lançado", async () => {
    m.prtFindUnique.mockRejectedValueOnce(new Error("db exploded"));

    const res = await app.inject({
      method: "POST",
      url: "/auth/reset-password",
      payload: { token: "123123", newPassword: "NewPass123!" },
    });

    expect(res.statusCode).toBe(500);
  });
});

// =====================================================================
// fastify.all("/api/auth/*")
// =====================================================================
describe("GET/POST /api/auth/* passthrough", () => {
  it("faz proxy de um GET sem body e copia status/headers/body", async () => {
    m.authHandler.mockImplementationOnce(async (req) => {
      expect(req.method).toBe("GET");
      expect(new URL(req.url).pathname).toBe("/api/auth/session");
      return new Response(JSON.stringify({ user: { id: "u1" } }), {
        status: 200,
        headers: { "content-type": "application/json", "x-custom": "yes" },
      });
    });

    const res = await app.inject({ method: "GET", url: "/api/auth/session" });

    expect(res.statusCode).toBe(200);
    expect(res.headers["x-custom"]).toBe("yes");
    expect(res.json()).toEqual({ user: { id: "u1" } });
    expect(m.authHandler).toHaveBeenCalledTimes(1);
  });

  it("repassa o body JSON para o Better Auth sem alterações", async () => {
    m.authHandler.mockImplementationOnce(async (req) => {
      const body = await req.json();
      expect(body.email).toBe("ana@example.com");
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      payload: { email: "ana@example.com", password: "x" },
    });

    expect(res.statusCode).toBe(200);
  });
});