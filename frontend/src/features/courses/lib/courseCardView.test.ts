import assert from "node:assert/strict";
import test from "node:test";
import { courseCategory, levelTone, userInitials } from "./courseCardView";

test("o selo de nível usa azul no iniciante, âmbar no intermediário e neutro no resto", () => {
  assert.equal(levelTone("Iniciante").text, "#1E40AF");
  assert.equal(levelTone("Intermediário").text, "#92400E");
  assert.equal(levelTone("intermediario").text, "#92400E");
  assert.equal(levelTone("Avançado").text, "#334155");
});

test("a categoria junta as duas primeiras tags em caixa alta", () => {
  assert.equal(courseCategory(["HTML5", "CSS3", "JavaScript"]), "HTML5 & CSS3");
  assert.equal(courseCategory(["Python"]), "PYTHON");
  assert.equal(courseCategory([]), "");
});

test("as iniciais do avatar vêm do nome e, sem ele, do e-mail", () => {
  assert.equal(userInitials("Thalyson Kauan Araújo", "t@x.com"), "TA");
  assert.equal(userInitials("maria", null), "M");
  assert.equal(userInitials("  ", "joao@x.com"), "J");
  assert.equal(userInitials(undefined, undefined), "?");
});
