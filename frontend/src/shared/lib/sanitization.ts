/**
 * Sanitiza o campo de nome, removendo scripts executáveis, estilos,
 * tags HTML, entidades maliciosas e caracteres de controle,
 * preservando acentos, hífens, apóstrofos e pontuações válidas em nomes.
 */
export function sanitizeName(name: string | null | undefined): string {
  if (typeof name !== "string") return "";

  let sanitized = name;

  // 1. Remove blocos executáveis/embutidos junto com seu conteúdo interno
  sanitized = sanitized.replace(
    /<(script|style|iframe|object|embed|svg)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi,
    ""
  );

  // 2. Remove tags executáveis não fechadas ou malformadas até o delimitador
  sanitized = sanitized.replace(
    /<(script|style|iframe|object|embed|svg)\b[^>]*>?/gi,
    ""
  );

  // 3. Remove recursivamente todas as tags HTML restantes (<...>) para tratar tags aninhadas
  let prev: string;
  do {
    prev = sanitized;
    sanitized = sanitized.replace(/<[^>]*>/g, "");
  } while (sanitized !== prev);

  // 4. Remove caracteres < e > avulsos e caracteres de controle (null bytes, etc)
  sanitized = sanitized.replace(/[<>]/g, "");
  sanitized = sanitized.replace(/[\u0000-\u001f\u007f-\u009f]/g, "");

  // 5. Normaliza espaços múltiplos e aplica trim
  return sanitized.replace(/\s+/g, " ").trim();
}
