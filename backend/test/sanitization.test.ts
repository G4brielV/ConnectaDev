import { describe, it, expect } from "vitest";
import { sanitizeName } from "../src/shared/utils/sanitization";

describe("sanitizeName", () => {
  it("remove blocos <script> e seu conteúdo interno", () => {
    const input = '<script>alert("xss")</script>Maria Silva';
    expect(sanitizeName(input)).toBe("Maria Silva");
  });

  it("remove tags <script> com atributos e case insensitive", () => {
    const input = '<SCRIPT type="text/javascript" src="evil.js">bad()</SCRIPT>João Pedro';
    expect(sanitizeName(input)).toBe("João Pedro");
  });

  it("remove tags HTML normais mantendo o texto interno legítimo", () => {
    const input = "<b>Carlos</b> <i>Eduardo</i> <span>Ferreira</span>";
    expect(sanitizeName(input)).toBe("Carlos Eduardo Ferreira");
  });

  it("remove tags com handlers de evento (ex: img onerror)", () => {
    const input = '<img src="x" onerror="alert(1)">Ana Paula';
    expect(sanitizeName(input)).toBe("Ana Paula");
  });

  it("remove links e javascript: pseudo-protocolos em tags", () => {
    const input = '<a href="javascript:alert(1)">Pedro Henrique</a>';
    expect(sanitizeName(input)).toBe("Pedro Henrique");
  });

  it("remove blocos de style, iframe, object, embed e svg com seu conteúdo", () => {
    expect(sanitizeName("<style>body { color: red; }</style>Lucas")).toBe("Lucas");
    expect(sanitizeName('<iframe src="http://evil.com">hidden text</iframe>Lucas')).toBe("Lucas");
    expect(sanitizeName("<svg><script>alert(1)</script></svg>Lucas")).toBe("Lucas");
  });

  it("trata tags aninhadas ou malformadas (bypass attempt)", () => {
    const input = "<<script>script>alert(1)</script>Beatriz";
    expect(sanitizeName(input)).toBe("Beatriz");
  });

  it("remove caracteres de controle e nulos", () => {
    const input = "Maria\u0000Clara\u001f";
    expect(sanitizeName(input)).toBe("MariaClara");
  });

  it("remove caracteres < e > avulsos", () => {
    expect(sanitizeName("João < Silva")).toBe("João Silva");
    expect(sanitizeName("João > Silva")).toBe("João Silva");
  });

  it("normaliza espaços excessivos e faz trim", () => {
    const input = "   Mariana    de   Albuquerque   ";
    expect(sanitizeName(input)).toBe("Mariana de Albuquerque");
  });

  it("preserva acentuação em português, hífens, apóstrofos e abreviações", () => {
    const input = "José d'Ávila Gonçalves-Sousa Jr.";
    expect(sanitizeName(input)).toBe("José d'Ávila Gonçalves-Sousa Jr.");
  });

  it("retorna string vazia quando a entrada contém apenas tags ou scripts", () => {
    expect(sanitizeName("<script>alert(1)</script>")).toBe("");
    expect(sanitizeName("<b></b>")).toBe("");
    expect(sanitizeName("   ")).toBe("");
  });

  it("retorna string vazia para valores nulos, indefinidos ou tipos não-string", () => {
    expect(sanitizeName(null)).toBe("");
    expect(sanitizeName(undefined)).toBe("");
    // @ts-expect-error teste de robustez em tempo de execução
    expect(sanitizeName(12345)).toBe("");
  });
});
