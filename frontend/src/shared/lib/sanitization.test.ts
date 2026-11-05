import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeName } from "./sanitization";

test("sanitizeName remove blocos <script> e seu conteudo interno", () => {
  const input = '<script>alert("xss")</script>Maria Silva';
  assert.equal(sanitizeName(input), "Maria Silva");
});

test("sanitizeName remove tags <script> com atributos e case insensitive", () => {
  const input = '<SCRIPT type="text/javascript" src="evil.js">bad()</SCRIPT>João Pedro';
  assert.equal(sanitizeName(input), "João Pedro");
});

test("sanitizeName remove tags HTML normais mantendo o texto legitimo", () => {
  const input = "<b>Carlos</b> <i>Eduardo</i> <span>Ferreira</span>";
  assert.equal(sanitizeName(input), "Carlos Eduardo Ferreira");
});

test("sanitizeName remove tags com handlers de evento", () => {
  const input = '<img src="x" onerror="alert(1)">Ana Paula';
  assert.equal(sanitizeName(input), "Ana Paula");
});

test("sanitizeName remove blocos executaveis de style, iframe, svg com conteudo", () => {
  assert.equal(sanitizeName("<style>body { color: red; }</style>Lucas"), "Lucas");
  assert.equal(sanitizeName('<iframe src="http://evil.com">hidden text</iframe>Lucas'), "Lucas");
  assert.equal(sanitizeName("<svg><script>alert(1)</script></svg>Lucas"), "Lucas");
});

test("sanitizeName trata tags aninhadas ou malformadas", () => {
  const input = "<<script>script>alert(1)</script>Beatriz";
  assert.equal(sanitizeName(input), "Beatriz");
});

test("sanitizeName remove caracteres de controle e caracteres < e > avulsos", () => {
  assert.equal(sanitizeName("Maria\u0000Clara\u001f"), "MariaClara");
  assert.equal(sanitizeName("João < Silva"), "João Silva");
  assert.equal(sanitizeName("João > Silva"), "João Silva");
});

test("sanitizeName normaliza espacos e faz trim", () => {
  const input = "   Mariana    de   Albuquerque   ";
  assert.equal(sanitizeName(input), "Mariana de Albuquerque");
});

test("sanitizeName preserva acentuacao em portugues, hifens e apostrofos", () => {
  const input = "José d'Ávila Gonçalves-Sousa Jr.";
  assert.equal(sanitizeName(input), "José d'Ávila Gonçalves-Sousa Jr.");
});

test("sanitizeName retorna string vazia quando a entrada contem apenas tags ou scripts", () => {
  assert.equal(sanitizeName("<script>alert(1)</script>"), "");
  assert.equal(sanitizeName("<b></b>"), "");
  assert.equal(sanitizeName("   "), "");
  assert.equal(sanitizeName(null), "");
  assert.equal(sanitizeName(undefined), "");
});
