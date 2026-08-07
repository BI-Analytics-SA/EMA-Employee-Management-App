import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseImportDate, validateImportRows } from "./importValidation";
import { parseLocalDate, formatDateInput } from "@/lib/dateUtils";

/**
 * PEPL-49 regression suite.
 *
 * The original bug: imported dates landed one day early. `new Date("2026/03/26")`
 * yields local midnight, which is 22:00 UTC the previous day in South Africa
 * (UTC+2); reading it back with UTC getters then produced 2026-03-25.
 *
 * These assertions are timezone-invariant: they must hold under any TZ. Verified
 * green under Africa/Johannesburg, UTC, America/New_York, America/Anchorage,
 * Pacific/Kiritimati (UTC+14), Asia/Kolkata (+05:30) and Pacific/Chatham (+12:45).
 * To re-check a zone: `TZ=America/New_York npx vitest run importValidation`.
 */

const TARGET = "2026-03-26";
/** Excel serial day count for 2026-03-26 */
const TARGET_SERIAL = 46107;

/** Round-trip a value the way the app does: normalise → store → display */
function roundTrip(cell: unknown): string | { error: string } {
  const parsed = parseImportDate(cell);
  if (!parsed.ok) return { error: parsed.message };
  const ts = parseLocalDate(parsed.value);
  if (ts === undefined) return { error: "parseLocalDate rejected normalised value" };
  return formatDateInput(ts);
}

/** Build an .xlsx in memory with the given cells in one column, then read it back
 *  exactly as parseImportFile does, returning the values that reach validation. */
function throughXlsx(cells: { text?: string; serial?: number }[]): unknown[] {
  const ws = XLSX.utils.aoa_to_sheet([["Date Engaged"]]);
  cells.forEach((c, i) => {
    const ref = "A" + (i + 2);
    ws[ref] = c.serial !== undefined
      ? { t: "n", v: c.serial, z: "m/d/yy" }
      : { t: "s", v: c.text as string };
  });
  ws["!ref"] = `A1:A${cells.length + 1}`;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "S");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const rows = XLSX.utils.sheet_to_json<unknown[]>(
    XLSX.read(buf, { type: "array", raw: false }).Sheets["S"],
    { header: 1, defval: "" }
  );
  return rows.slice(1).map((r) => r[0]);
}

/** Read a CSV the way parseImportFile does */
function throughCsv(value: string): unknown {
  const wb = XLSX.read(`Date Engaged\n${value}\n`, { type: "string", raw: false });
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], {
    header: 1,
    defval: "",
  });
  return rows[1][0];
}

describe("parseImportDate — accepted year-first text", () => {
  const accepted = [
    "2026-03-26",
    "2026/03/26",
    "2026.03.26",
    "2026-3-26",
    "2026-03-26T00:00:00",
    "2026-03-26 00:00:00",
    "2026-03-26T23:59:59.999Z",
    "  2026-03-26  ",
  ];

  it.each(accepted)("accepts %j and yields the intended calendar date", (input) => {
    expect(roundTrip(input)).toBe(TARGET);
  });

  const singleDigit: [string, string][] = [
    ["2026-03-6", "2026-03-06"],
    ["2026-3-6", "2026-03-06"],
    ["2026/3/6", "2026-03-06"],
    ["2026.3.6", "2026-03-06"],
    ["1990-1-1", "1990-01-01"],
  ];

  it.each(singleDigit)("pads single-digit %j to %s", (input, expected) => {
    expect(roundTrip(input)).toBe(expected);
  });
});

describe("parseImportDate — rejected text (fails loudly, never guessed)", () => {
  const rejected: [string, string][] = [
    ["26/03/2026", "day-first"],
    ["03/26/2026", "month-first"],
    ["26-03-2026", "day-first with dashes (previously stored as 1931)"],
    ["03/04/2026", "genuinely ambiguous"],
    ["26 March 2026", "named month"],
    ["26-Mar-2026", "abbreviated month"],
    ["Mar 26 2026", "month name first"],
    ["20260326", "no separators"],
    ["26/03/26", "two-digit year"],
    ["2026-03/26", "mixed separators"],
    ["2026-13-01", "month out of range"],
    ["2026-02-30", "day does not exist"],
    ["not a date", "free text"],
    ["1899-12-31", "before 1900"],
  ];

  it.each(rejected)("rejects %j (%s)", (input) => {
    const result = parseImportDate(input);
    expect(result.ok).toBe(false);
  });

  it("includes the offending value and the required format in the message", () => {
    const result = parseImportDate("26/03/2026");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("26/03/2026");
      expect(result.message).toContain("2026-03-26");
    }
  });
});

describe("parseImportDate — Excel date cells (numeric serials)", () => {
  it("converts a whole serial to the right calendar date", () => {
    expect(roundTrip(TARGET_SERIAL)).toBe(TARGET);
  });

  it("rounds to nearest midnight so a UTC+ offset fraction does not shift the day", () => {
    // "2026-03-26" read as CSV at UTC+2 arrives as 46107.0833
    expect(roundTrip(TARGET_SERIAL + 2 / 24)).toBe(TARGET);
  });

  it("rounds to nearest midnight so a UTC- offset fraction does not shift the day", () => {
    // the same value read at UTC-5 arrives as 46106.7916 — floor() would give 03-25
    expect(roundTrip(TARGET_SERIAL - 5 / 24)).toBe(TARGET);
  });

  it("handles a known historical date", () => {
    expect(roundTrip(33238)).toBe("1990-12-31");
  });

  it("rejects a non-positive serial", () => {
    expect(parseImportDate(0).ok).toBe(false);
    expect(parseImportDate(-5).ok).toBe(false);
  });

  it("rejects an 8-digit number mistaken for a serial", () => {
    // 20260326 as a serial would be year 10113
    expect(parseImportDate(20260326).ok).toBe(false);
  });

  it("rejects a serial far in the future", () => {
    expect(parseImportDate(2958465).ok).toBe(false);
  });
});

describe("end-to-end through the real xlsx/csv reader", () => {
  it("year-first text cells in .xlsx survive intact", () => {
    const values = throughXlsx([
      { text: "2026-03-26" },
      { text: "2026/03/26" },
      { text: "2026.03.26" },
    ]);
    for (const v of values) {
      expect(roundTrip(typeof v === "number" ? v : String(v).trim())).toBe(TARGET);
    }
  });

  it("a real Excel date cell in .xlsx survives intact", () => {
    const [v] = throughXlsx([{ serial: TARGET_SERIAL }]);
    expect(roundTrip(v)).toBe(TARGET);
  });

  it("day-first text cells in .xlsx are rejected, not shifted or dropped", () => {
    const values = throughXlsx([{ text: "26/03/2026" }, { text: "26 March 2026" }]);
    for (const v of values) {
      const cell = typeof v === "number" ? v : String(v).trim();
      expect(parseImportDate(cell).ok).toBe(false);
    }
  });

  it("year-first values in a .csv survive intact", () => {
    for (const input of ["2026-03-26", "2026/03/26", "2026.03.26", "2026-03-26 00:00:00"]) {
      expect(roundTrip(throughCsv(input))).toBe(TARGET);
    }
  });
});

describe("validateImportRows — date columns", () => {
  const DATE_FIELDS = [
    "dateOfBirth",
    "dateRegistered",
    "dateEngaged",
    "lastDateWorked",
    "uifEndDate",
  ] as const;

  const ID = "9001015001087";

  it.each(DATE_FIELDS)("normalises %s from every accepted shape", (field) => {
    const { valid, errors } = validateImportRows([
      { idNumber: ID, [field]: "1990/12/31" },
    ]);
    expect(errors).toEqual([]);
    expect(valid).toHaveLength(1);
    expect(formatDateInput(valid[0].data[field] as number)).toBe("1990-12-31");
  });

  it.each(DATE_FIELDS)("fails the row loudly for a bad %s", (field) => {
    const { valid, errors } = validateImportRows([
      { idNumber: ID, [field]: "31/12/1990" },
    ]);
    expect(valid).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe(field);
    expect(errors[0].row).toBe(1);
    expect(errors[0].message).toContain("31/12/1990");
  });

  it("never imports a row with the date silently missing", () => {
    const { valid } = validateImportRows([{ idNumber: ID, dateEngaged: "26/03/2026" }]);
    expect(valid).toHaveLength(0);
  });

  it("treats blank date cells as no-change, not an error", () => {
    const { valid, errors } = validateImportRows([
      { idNumber: ID, dateEngaged: "", dateOfBirth: undefined, uifEndDate: "   " },
    ]);
    expect(errors).toEqual([]);
    expect(valid).toHaveLength(1);
    expect(valid[0].data.dateEngaged).toBeUndefined();
    expect(valid[0].data.dateOfBirth).toBeUndefined();
    expect(valid[0].data.uifEndDate).toBeUndefined();
  });

  it("rejects a future date of birth", () => {
    const nextYear = new Date().getFullYear() + 1;
    const { valid, errors } = validateImportRows([
      { idNumber: ID, dateOfBirth: `${nextYear}-01-01` },
    ]);
    expect(valid).toHaveLength(0);
    expect(errors[0].message).toContain("future");
  });

  it("allows a future engagement date", () => {
    const nextYear = new Date().getFullYear() + 1;
    const { valid, errors } = validateImportRows([
      { idNumber: ID, dateEngaged: `${nextYear}-01-01` },
    ]);
    expect(errors).toEqual([]);
    expect(valid).toHaveLength(1);
  });

  it("reports one error per bad date column and still flags other field errors", () => {
    const { valid, errors } = validateImportRows([
      { idNumber: "123", dateEngaged: "26/03/2026", dateOfBirth: "01/01/1990" },
    ]);
    expect(valid).toHaveLength(0);
    expect(errors.filter((e) => e.field === "dateEngaged")).toHaveLength(1);
    expect(errors.filter((e) => e.field === "dateOfBirth")).toHaveLength(1);
    expect(errors.some((e) => e.field === "idNumber")).toBe(true);
  });

  it("does not double-report a bad date via the schema", () => {
    const { errors } = validateImportRows([{ idNumber: ID, dateEngaged: "26/03/2026" }]);
    expect(errors).toHaveLength(1);
  });

  it("handles all five date columns in one row", () => {
    const { valid, errors } = validateImportRows([
      {
        idNumber: ID,
        dateOfBirth: "1990-01-01",
        dateRegistered: "2020/01/15",
        dateEngaged: "2020.01.15",
        lastDateWorked: 46107,
        uifEndDate: "2026-03-26 00:00:00",
      },
    ]);
    expect(errors).toEqual([]);
    expect(valid).toHaveLength(1);
    const d = valid[0].data;
    expect(formatDateInput(d.dateOfBirth as number)).toBe("1990-01-01");
    expect(formatDateInput(d.dateRegistered as number)).toBe("2020-01-15");
    expect(formatDateInput(d.dateEngaged as number)).toBe("2020-01-15");
    expect(formatDateInput(d.lastDateWorked as number)).toBe(TARGET);
    expect(formatDateInput(d.uifEndDate as number)).toBe(TARGET);
  });
});

describe("parseLocalDate hardening", () => {
  it("rejects day-first strings instead of reading year 26", () => {
    expect(parseLocalDate("26-03-2026")).toBeUndefined();
  });

  it("rejects non-existent days", () => {
    expect(parseLocalDate("2026-02-30")).toBeUndefined();
  });

  it("rejects empty and malformed input", () => {
    expect(parseLocalDate("")).toBeUndefined();
    expect(parseLocalDate("   ")).toBeUndefined();
    expect(parseLocalDate("2026-03")).toBeUndefined();
    expect(parseLocalDate("2026-03-26-01")).toBeUndefined();
  });

  it("round-trips through formatDateInput without shifting", () => {
    for (const d of ["1990-01-01", "2026-03-26", "2026-01-01", "2026-12-31", "2024-02-29"]) {
      expect(formatDateInput(parseLocalDate(d))).toBe(d);
    }
  });
});
