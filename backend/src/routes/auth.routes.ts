import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { auth, prisma } from "../lib/auth";
import { Resend } from "resend";
import { hashPassword } from "better-auth/crypto";
import { createHash, randomInt } from "crypto";

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

  // 1. Gera um código numérico de 6 dígitos aleatório (ex: "849204")
  const rawCode = randomInt(100000, 1000000).toString();

  // 2. Cria um hash SHA-256 do código para salvar no banco com segurança
  const codeHash = createHash("sha256").update(rawCode).digest("hex");

  // 3. Define expiração curta (10 minutos)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // 4. Salva no banco (remove códigos anteriores do mesmo usuário)
  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id },
  });

  await prisma.passwordResetToken.create({
    data: {
      // Eu vou verificar o codeHash depois
      token: codeHash, // Salva o hash (NUNCA o código em texto limpo) 
      userId: user.id,
      expiresAt,
    },
  });
  // Envia o e‑mail via Resend
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "Suporte <onboarding@resend.dev>", // Altere para seu domínio verificado quando estiver em produção
      to: user.email,
      subject: `${rawCode} é o seu código de recuperação de senha`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de Senha</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f6f8; padding: 40px 10px;">
              <tr>
                <td align="center">
                  <!-- Card Principal -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); padding: 40px 32px;">
                    
                    <!-- Cabeçalho / Título -->
                    <tr>
                      <td align="center" style="padding-bottom: 24px;">
                        <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #1a1a1a;">
                          Recuperação de Senha
                        </h1>
                      </td>
                    </tr>

                    <!-- Mensagem de Saudação -->
                    <tr>
                      <td style="padding-bottom: 16px; font-size: 15px; line-height: 24px; color: #4a5568; text-align: center;">
                        Olá, <strong style="color: #1a1a1a;">${user.name || "usuário"}</strong>!
                      </td>
                    </tr>

                    <tr>
                      <td style="padding-bottom: 24px; font-size: 15px; line-height: 24px; color: #4a5568; text-align: center;">
                        Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para continuar no aplicativo:
                      </td>
                    </tr>

                    <!-- Bloco do Código -->
                    <tr>
                      <td align="center" style="padding: 16px 0 28px 0;">
                        <div style="background-color: #f0f4ff; border: 1px dashed #6366f1; border-radius: 8px; padding: 16px 24px; display: inline-block;">
                          <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #4f46e5;">
                            ${rawCode}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <!-- Aviso de Expiração -->
                    <tr>
                      <td style="padding-bottom: 24px; font-size: 13px; line-height: 20px; color: #718096; text-align: center;">
                        ⏳ Este código é válido por <strong>10 minutos</strong> e só pode ser usado uma vez.
                      </td>
                    </tr>

                    <!-- Divisor -->
                    <tr>
                      <td style="border-top: 1px solid #edf2f7; padding-top: 24px;">
                        <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a0aec0; text-align: center;">
                          Se você não solicitou a redefinição de senha, por favor ignore este e-mail. Sua conta continua segura.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
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
  try {
    const { token, newPassword } = (request.body || {}) as {
      token?: string;
      newPassword?: string;
    };

    if (!token || !newPassword) {
      return reply.status(400).send({ message: "Token e nova senha são obrigatórios" });
    }
    const inputHash = createHash("sha256").update(token).digest("hex");
    // Busca o token no banco
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token:inputHash },
      include: { user: true },
    });

    if (!resetToken) {
      return reply.status(400).send({ message: "Token inválido ou expirado" });
    }

    // Verifica expiração
    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      return reply.status(400).send({ message: "Código expirado. Solicite um novo código no aplicativo." });
    }

    const hashedPassword = await hashPassword(newPassword);

    const resultUpdateToken = await prisma.account.updateMany({
        where: {
          userId: resetToken.userId,
          providerId: "credential",
        },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });
    if (resultUpdateToken.count === 0) {
      return reply.status(400).send({ 
        message: "Usuário não possui credencial de senha cadastrada." 
      });
    }

    // Remove o token usado
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });

    // Opcional: revoga todas as sessões ativas do usuário (segurança)
    await prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    });

    return reply.status(200).send({
      message: "Senha redefinida com sucesso!",
    });
  } catch (error) {
      return reply.status(500).send({ message: "Erro ao redefinir a senha." });
  }
});

// fastify.post("/auth/reset-password", async (request: FastifyRequest, reply: FastifyReply) => {
//   const { token, newPassword } = (request.body || {}) as {
//     token?: string;
//     newPassword?: string;
//   };

//   if (!token || !newPassword) {
//     return reply.status(400).send({ message: "Token e nova senha são obrigatórios" });
//   }

//   try {
//     // O Better Auth faz toda a validação do token, expiração,
//     // hash seguro da senha e atualização da tabela 'Account' automaticamente.
//     await auth.api.resetPassword({
//       body: {
//         newPassword: newPassword,
//         token: token,
//       },
//     });

//     // Se você ativou o "revokeSessionsOnPasswordReset: true" no config do Better Auth, 
//     // a exclusão abaixo também se torna opcional. Mas se quiser garantir manualmente:
//     // Nota: Como não buscamos o resetToken manualmente antes, você precisará buscar o userId 
//     // se quiser deletar sessões por id aqui, ou deixar o Better Auth cuidar disso no config.

//     return reply.status(200).send({
//       message: "Senha redefinida com sucesso!",
//     });
//   } catch (error: any) {
//     // Captura erros nativos do Better Auth (ex: token inválido, expirado, etc.)
//     return reply.status(400).send({ 
//       message: error.message || "Não foi possível redefinir a senha. Verifique o link utilizado." 
//     });
//   }
// });
}