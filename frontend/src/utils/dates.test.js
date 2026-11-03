import { describe, it, expect } from "vitest";
import { sungAgo, isRecent, todayISO } from "./dates";

const now = new Date(2026, 10, 3); // 3 Nov 2026

describe("sungAgo", () => {
  it.each([
    ["2026-11-03", "azi"],
    ["2026-11-02", "ieri"],
    ["2026-10-29", "acum 5 zile"],
    ["2026-10-27", "acum o săptămână"],
    ["2026-10-13", "acum 3 săptămâni"],
    ["2026-09-25", "acum o lună"],
    ["2026-05-03", "acum 6 luni"],
    ["2025-11-03", "acum un an"],
    ["2004-11-03", "acum 22 de ani"],
  ])("%s -> %s", (date, expected) => {
    expect(sungAgo(date, now)).toBe(expected);
  });
});

describe("isRecent", () => {
  it("is true within the last 30 days only", () => {
    expect(isRecent("2026-10-10", now)).toBe(true);
    expect(isRecent("2026-10-01", now)).toBe(false);
    expect(isRecent(null, now)).toBe(false);
  });
});

describe("todayISO", () => {
  it("formats the local date", () => {
    expect(todayISO(now)).toBe("2026-11-03");
  });
});
