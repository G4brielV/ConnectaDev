import assert from "node:assert/strict";
import test from "node:test";
import { areaTopicId, slugifyArea } from "./areaTopic";

test("slugifyArea produces the same slugs as the backend for every catalog area", () => {
  const expected: Record<string, string> = {
    "Desenvolvimento de Software": "desenvolvimento-de-software",
    "Dados e Inteligência Artificial": "dados-e-inteligencia-artificial",
    "Design e Experiência do Usuário": "design-e-experiencia-do-usuario",
    "Infraestrutura e Redes": "infraestrutura-e-redes",
    "Cibersegurança": "ciberseguranca",
    "Gestão de Produtos de Tecnologia": "gestao-de-produtos-de-tecnologia",
  };
  for (const [area, slug] of Object.entries(expected)) {
    assert.equal(slugifyArea(area), slug);
  }
});

test("areaTopicId prefixes the slug with area-topic-", () => {
  assert.equal(areaTopicId("Cibersegurança"), "area-topic-ciberseguranca");
});
