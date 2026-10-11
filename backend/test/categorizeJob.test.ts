import { describe, expect, it } from "vitest";
import { categorizeJob } from "../src/modules/jobs/services/categorizeJob.service";

describe("categorizeJob", () => {
  it.each([
    ["Desenvolvedor Java", "Construção de APIs REST", "Backend", ["API", "Java"]],
    ["Frontend React", "Interfaces com TypeScript", "Frontend", ["Frontend", "React", "TypeScript"]],
    ["Analista de dados", "SQL e Python para analytics", "Dados", ["Analytics", "SQL", "Python"]],
    ["Analista de Cybersecurity", "Atuação em SOC", "Segurança", ["Cybersecurity", "SOC"]],
  ])("classifica %s", (title, description, category, tags) => {
    expect(categorizeJob(title, description)).toEqual({ category, tags });
  });

  it("combina tags de regras diferentes sem duplicá-las", () => {
    expect(categorizeJob("Engenheiro Backend", "Java, Python e SQL")).toEqual({
      category: "Dados",
      tags: ["SQL", "Backend", "Java", "Python"],
    });
  });
});
