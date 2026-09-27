import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMonthGrid,
  dayCellState,
  monthTitle,
  shiftMonth,
  streakHeadline,
  streakMessage,
  weekDoneCount,
} from "./streakCalendar";

test("a grade do mês começa no domingo com casas vazias antes do dia 1", () => {
  // setembro de 2026 começa numa terça
  const grid = buildMonthGrid("2026-09");
  assert.deepEqual(
    grid[0]?.map((cell) => cell.dayOfMonth),
    [null, null, 1, 2, 3, 4, 5],
  );
  assert.equal(grid.flat().filter((cell) => cell.day).length, 30);
  assert.ok(grid.every((week) => week.length === 7));
  assert.equal(grid.at(-1)?.find((cell) => cell.dayOfMonth === 30)?.day, "2026-09-30");
});

test("fevereiro de ano bissexto tem 29 dias", () => {
  assert.equal(buildMonthGrid("2028-02").flat().filter((cell) => cell.day).length, 29);
});

test("título do mês em português e navegação que cruza o ano", () => {
  assert.equal(monthTitle("2026-09"), "Setembro de 2026");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
});

test("estado de cada dia do calendário", () => {
  const active = new Set(["2026-09-20", "2026-09-24"]);
  assert.equal(dayCellState("2026-09-24", active, "2026-09-24"), "todayActive");
  assert.equal(dayCellState("2026-09-24", new Set(), "2026-09-24"), "today");
  assert.equal(dayCellState("2026-09-20", active, "2026-09-24"), "active");
  assert.equal(dayCellState("2026-09-21", active, "2026-09-24"), "past");
  assert.equal(dayCellState("2026-09-25", active, "2026-09-24"), "future");
});

test("títulos e mensagens acompanham o estado da ofensiva", () => {
  assert.equal(streakHeadline(0), "Nenhuma ofensiva ativa");
  assert.equal(streakHeadline(1), "1 dia de ofensiva!");
  assert.equal(streakHeadline(7), "7 dias de ofensiva!");

  assert.match(streakMessage({ currentStreak: 7, activeToday: true, atRisk: false }), /7 dias seguidos/);
  assert.match(streakMessage({ currentStreak: 3, activeToday: false, atRisk: true }), /não perder sua ofensiva de 3 dias/);
  assert.match(streakMessage({ currentStreak: 0, activeToday: false, atRisk: false }), /acender/);
});

test("conta os dias feitos na semana", () => {
  const week = ["done", "done", "missed", "pending", "upcoming", "upcoming", "upcoming"].map(
    (status, index) => ({
      day: `2026-09-2${index + 1}`,
      label: "",
      isToday: false,
      status: status as "done" | "pending" | "missed" | "upcoming",
    }),
  );
  assert.equal(weekDoneCount(week), 2);
});
