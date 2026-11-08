import { describe, expect, it } from "vitest";
import { isInRecifeMetro } from "../src/modules/jobsEvents/utils/geo";
import { parseDateAndTime } from "../src/modules/jobsEvents/utils/parseDate";
import { isTechnologyEvent } from "../src/modules/jobsEvents/utils/category";

describe("event utilities", () => {
  it("interpreta corretamente data e horário exibidos pela Sympla", () => {
    const parsed = parseDateAndTime("Segunda, 23 de Nov às 09:00");

    expect(parsed).not.toBeNull();
    expect(parsed).toMatchObject({
      day: "23",
      month: "Nov",
      time: "09:00",
    });
    expect(parsed?.startsAt.getHours()).toBe(9);
    expect(parsed?.startsAt.getDate()).toBe(23);
    expect(parsed?.startsAt.getMonth()).toBe(10);
  });

  it("não confunde o dia do mês com o horário", () => {
    const parsed = parseDateAndTime("25 OUT");

    expect(parsed?.time).toBe("19:00");
    expect(parsed?.startsAt.getHours()).toBe(19);
  });

  it("mantém somente localidades da Região Metropolitana do Recife", () => {
    expect(isInRecifeMetro("Porto Digital, Recife, PE")).toBe(true);
    expect(isInRecifeMetro("Olinda, PE")).toBe(true);
    expect(isInRecifeMetro("São Paulo, SP")).toBe(false);
  });

  it("rejeita eventos sem sinais de tecnologia no título", () => {
    expect(isTechnologyEvent("Qiskit Fall Fest Brazil 2026")).toBe(true);
    expect(isTechnologyEvent("Recife Data Saturday")).toBe(true);
    expect(isTechnologyEvent("Tour - Ilha do Retiro")).toBe(false);
    expect(isTechnologyEvent("IMERSÃO BEAUTY 360 paradise")).toBe(false);
  });
});
