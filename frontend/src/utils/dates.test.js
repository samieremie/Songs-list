import { describe, it, expect } from "vitest";
import {
  sungAgo,
  isRecent,
  todayISO,
  formatServiceDate,
  formatDayMonth,
  untilLabel,
  nextWeekday,
  nextMondayAfter,
} from "./dates";

describe("service dates", () => {
  const tuesday = new Date(2026, 10, 3); // Tue 3 Nov 2026

  it("formats a date the Romanian way", () => {
    expect(formatServiceDate("2026-11-09")).toBe("Luni, 9 noiembrie");
    expect(formatDayMonth("2026-11-09")).toBe("9 noiembrie");
  });

  it("says how far away a date is", () => {
    expect(untilLabel("2026-11-03", tuesday)).toBe("azi");
    expect(untilLabel("2026-11-04", tuesday)).toBe("mâine");
    expect(untilLabel("2026-11-09", tuesday)).toBe("în 6 zile");
    expect(untilLabel("2026-11-23", tuesday)).toBe("în 20 de zile");
  });

  it("finds the next Monday, today included", () => {
    expect(nextWeekday(1, tuesday)).toBe("2026-11-09");
    expect(nextWeekday(1, new Date(2026, 10, 9))).toBe("2026-11-09");
  });
});

describe("nextMondayAfter", () => {
  it.each([
    // [list date, today, expected]
    ["2026-11-09", new Date(2026, 10, 10), "2026-11-16"], // Monday list -> next Monday
    ["2026-11-05", new Date(2026, 10, 6), "2026-11-09"], // Thursday list -> following Monday
    ["2026-11-02", new Date(2026, 10, 12), "2026-11-16"], // late close -> next upcoming Monday
    ["2026-11-02", new Date(2026, 10, 9), "2026-11-09"], // today is that Monday -> today
  ])("from %s on %s gives %s", (date, today, expected) => {
    expect(nextMondayAfter(date, today)).toBe(expected);
  });
});

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
