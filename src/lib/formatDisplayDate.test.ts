import { describe, expect, it } from "vitest";
import { formatDisplayDate, formatDisplayDateTime } from "./formatDisplayDate";

const zones = {
  UTC: ["2026/03/18 23:59", "2026/03/19 00:00"],
  "Africa/Johannesburg": ["2026/03/19 01:59", "2026/03/19 02:00"],
  "America/New_York": ["2026/03/18 19:59", "2026/03/18 20:00"],
};
const boundaryInstants = ["2026-03-18T23:59:59.999Z", "2026-03-19T00:00:00.001Z"];

describe("display dates (never serialize these values)", () => {
  it.each(["2026-03-18", "2024-02-29", "2000-02-29", "0099-01-02"])("preserves the literal day of %s in every timezone", (value) => {
    expect(formatDisplayDate(value)).toBe(value.replace(/-/g, "/"));
    expect(formatDisplayDate(value, { timeZone: "America/New_York" })).toBe(value.replace(/-/g, "/"));
  });

  it.each(Object.entries(zones))("keeps the existing calendar day around UTC midnight in %s", (timeZone, expected) => {
    boundaryInstants.forEach((iso, i) => {
      for (const value of [iso, Date.parse(iso), new Date(iso)]) {
        expect(formatDisplayDate(value, { timeZone })).toBe(expected[i].slice(0, 10));
        expect(formatDisplayDateTime(value, { timeZone })).toBe(expected[i]);
      }
    });
  });

  it("keeps browser-local timestamps on the same day as the old local displays", () => {
    for (const iso of [...boundaryInstants, "2026-03-18T21:59:59Z", "2026-03-18T22:00:00Z"]) {
      const date = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, "0");
      const oldCalendarDay = `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
      expect(formatDisplayDate(date.getTime())).toBe(oldCalendarDay);
      expect(formatDisplayDate(iso)).toBe(oldCalendarDay);
      expect(formatDisplayDateTime(iso)).toBe(`${oldCalendarDay} ${pad(date.getHours())}:${pad(date.getMinutes())}`);
    }
  });

  it("formats a local-midnight timestamp without converting it to UTC", () => {
    expect(formatDisplayDate(new Date(2026, 2, 18).getTime())).toBe("2026/03/18");
  });

  it("preserves the instant when ISO offsets cross a day boundary", () => {
    expect(formatDisplayDate("2026-03-18T00:30:00+02:00", { timeZone: "UTC" })).toBe("2026/03/17");
    expect(formatDisplayDate("2026-03-18T00:30:00+02:00", { timeZone: "Africa/Johannesburg" })).toBe("2026/03/18");
  });

  it("uses SAST bucket days independently of the QA machine timezone", () => {
    expect(formatDisplayDate(Date.parse("2026-08-31T22:00:00Z"), { timeZone: "Africa/Johannesburg" })).toBe("2026/09/01");
  });

  it("keeps UTC contract heading days and build times on their original UTC day", () => {
    expect(formatDisplayDate(Date.parse(boundaryInstants[0]), { timeZone: "UTC" })).toBe("2026/03/18");
    expect(formatDisplayDateTime(boundaryInstants[1], { timeZone: "UTC" })).toBe("2026/03/19 00:00");
  });

  it.each([null, undefined, "", "  ", "invalid", NaN, Infinity, new Date(NaN), "2026-02-29", "2026-02-30", "2026-13-01", "2026-00-01", "2026-03-00"])("handles empty/invalid %s with the caller's fallback", (value) => {
    expect(formatDisplayDate(value)).toBe("—");
    expect(formatDisplayDateTime(value)).toBe("—");
    expect(formatDisplayDate(value, { fallback: "" })).toBe("");
    expect(formatDisplayDateTime(value, { fallback: "Never" })).toBe("Never");
  });

  it("supports epoch zero where callers treat it as a real date", () => {
    expect(formatDisplayDate(0, { timeZone: "UTC" })).toBe("1970/01/01");
    expect(formatDisplayDateTime(0, { timeZone: "UTC" })).toBe("1970/01/01 00:00");
  });

  it("pads single-digit dates/times and does not mutate Date inputs", () => {
    const date = new Date("2026-01-02T03:04:05Z");
    const before = date.getTime();
    expect(formatDisplayDateTime(date, { timeZone: "UTC" })).toBe("2026/01/02 03:04");
    expect(date.getTime()).toBe(before);
  });
});
