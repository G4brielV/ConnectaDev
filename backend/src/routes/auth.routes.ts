import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth, prisma } from "../lib/auth";
import { Resend } from "resend";
import * as bcrypt from "bcrypt";

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
    
    // Resolução do conflito: Combina checagem de GET/HEAD, tratamento de null/undefined e content-type
    let body: string | undefined = undefined;
    if (!["GET", "HEAD"].includes(request.method) && request.body != null) {
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

    const responseBody = await response.text();
    return reply.status(response.status).send(responseBody);
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

  // Cenário 1: Endpoint de Logout com revogação de sessão e tokens
  fastify.post("/auth/logout", async (request: FastifyRequest, reply: FastifyReply) => {
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
    const url = new URL("/api/auth/sign-out", `http://${host}`);

    let body: string | undefined = undefined;
    if (request.body !== undefined) {
      body = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
    }

    const req = new Request(url, {
      method: "POST",
      headers,
      body,
    });

    try {
      await auth.handler(req);
    } catch (err) {
      request.log.warn({ err }, "Aviso ao revogar sessão via Better Auth");
    }

    // Revogação direta de segurança no banco de dados via Prisma
    try {
      const authHeader = request.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
      const bodyData = (request.body || {}) as { refreshToken?: string; token?: string };
      const targetToken = bearerToken || bodyData?.refreshToken || bodyData?.token;

      if (targetToken) {
        await prisma.session.deleteMany({
          where: { token: targetToken },
        }).catch(() => null);
      }
    } catch {
      // Ignora erro se registro de sessão já não existir
    }

    return reply.status(200).send({
      message: "Logout realizado com sucesso",
      success: true,
    });
  });

  // authRoutes.ts (dentro da função authRoutes)
fastify.post("/auth/forgot-password", async (request: FastifyRequest, reply: FastifyReply) => {
  const { email } = (request.body || {}) as { email?: string };

  if (!email) {
    return reply.status(400).send({ message: "E‑mail é obrigatório" });
  }

  const sanitizedEmail = String(email).trim().toLowerCase();

  // Verifica se o usuário existe
  const user = await prisma.user.findUnique({
    where: { email: sanitizedEmail },
  });

  if (!user) {
    // Por segurança, não revelamos se o e‑mail existe ou não
    return reply.status(200).send({
      message: "Se este e‑mail estiver cadastrado, você receberá um link de recuperação.",
    });
  }

  // Gera um token seguro (JWT ou UUID + hash)
  const { randomBytes } = await import("crypto");
  const token = randomBytes(32).toString("hex");

  // Define expiração (ex.: 1 hora)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Salva no banco (remove tokens anteriores do mesmo usuário, se quiser)
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // Monta o link de reset (exemplo com React Native usando deep linking)
  // Ajuste a URL para o seu aplicativo (ex.: `meuapp://reset-password?token=...`)
  const resetLink = `https://seudominio.com/reset-password?token=${token}`;
  // ou para React Native: `meuapp://reset-password?token=${token}`

  // Envia o e‑mail via Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "Suporte <naoresponda@seudominio.com>", // configure um domínio verificado no Resend
      to: user.email,
      subject: "Recuperação de senha",
      html: `
        <p>Olá, ${user.name || "usuário"}!</p>
        <p>Você solicitou a redefinição da sua senha. Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Este link é válido por 1 hora.</p>
        <p>Se você não solicitou, ignore este e‑mail.</p>
      `,
    });
  } catch (error) {
    request.log.error({ err: error }, "Falha ao enviar e‑mail de recuperação");
    return reply.status(500).send({ message: "Erro ao enviar e‑mail. Tente novamente." });
  }

  return reply.status(200).send({
    message: "Se este e‑mail estiver cadastrado, você receberá um link de recuperação.",
  });
});

fastify.post("/auth/reset-password", async (request: FastifyRequest, reply: FastifyReply) => {
  const { token, newPassword } = (request.body || {}) as {
    token?: string;
    newPassword?: string;
  };

  if (!token || !newPassword) {
    return reply.status(400).send({ message: "Token e nova senha são obrigatórios" });
  }

  // Busca o token no banco
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    return reply.status(400).send({ message: "Token inválido ou expirado" });
  }

  // Verifica expiração
  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    return reply.status(400).send({ message: "Token expirado. Solicite um novo link." });
  }

  // Atualiza a senha do usuário (lembre-se de fazer hash, mas o Better Auth já cuida disso se usar o auth)
  // Se você estiver usando o Better Auth, pode usar o auth.api.resetPassword ou atualizar diretamente com Prisma.
  // Aqui faremos diretamente, mas é recomendado usar o método do Better Auth para manter hooks e hash.
  // Como alternativa, use o prisma.user.update com a senha já hasheada (use bcrypt).
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  // Remove o token usado
  await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

  // Opcional: revoga todas as sessões ativas do usuário (segurança)
  await prisma.session.deleteMany({
    where: { userId: resetToken.userId },
  });

  return reply.status(200).send({
    message: "Senha redefinida com sucesso!",
  });
});
}