import { z } from "zod";
import { employeeFormSchema } from "@/lib/validations/employee";
import { BANK_NAMES, BRANCH_CODES } from "@/lib/constants/bankDetails";

export type ImportRow = z.infer<typeof employeeFormSchema>;

export interface ValidatedRow {
  rowIndex: number;
  data: ImportRow;
}

export interface ImportError {
  row: number;
  message: string;
  field?: string;
}

const DATE_FIELDS = [
  "dateOfBirth",
  "dateRegistered",
  "dateEngaged",
  "lastDateWorked",
  "uifEndDate",
] as const;

/**
 * Human-readable statement of the only accepted text date format. Appended to
 * every date error so the client can fix the file without contacting support.
 */
export const DATE_FORMAT_HINT =
  "dates must be year first: use 2026-03-26 (2026/03/26 and 2026.03.26 also work)";

/** Earliest plausible calendar year for an employee date */
const MIN_DATE_YEAR = 1900;
/** Latest plausible calendar year, relative to today (guards typos like 2620) */
const MAX_YEARS_AHEAD = 50;

/**
 * Year-first text date: YYYY<sep>M<sep>D with a consistent separator of - / or .
 * The `\2` backreference rejects mixed separators such as "2026-03/26".
 * An optional time suffix (T or space followed by anything) is ignored, so
 * database exports like "2026-03-26 00:00:00" are accepted.
 */
const YEAR_FIRST_DATE_RE = /^(\d{4})([-/.])(\d{1,2})\2(\d{1,2})(?:[T ].*)?$/;

type DateParseResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

/** Format a UTC Date as YYYY-MM-DD using UTC getters (avoids timezone day-shift) */
function formatUTCDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Reject dates outside the plausible range for employee records */
function checkYearRange(year: number): string | undefined {
  const maxYear = new Date().getFullYear() + MAX_YEARS_AHEAD;
  if (year < MIN_DATE_YEAR || year > maxYear) {
    return `Date out of range — year must be between ${MIN_DATE_YEAR} and ${maxYear}`;
  }
  return undefined;
}

/**
 * Convert an Excel serial day count to a calendar date (Excel epoch 1899-12-30).
 *
 * Rounds to the nearest whole day rather than truncating: these fields are pure
 * calendar dates, and a serial produced from a text date carries the reader's
 * UTC offset as a fraction (e.g. "2026-03-26" in a CSV arrives as 46107.0833 at
 * UTC+2, and as 46106.79 at UTC-5). Truncating would shift the day backwards for
 * any user in a UTC-negative timezone.
 */
function excelSerialToDate(serial: number): Date | null {
  const days = Math.round(serial);
  if (days <= 0) return null;
  const date = new Date(Date.UTC(1899, 11, 30 + days));
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Normalise one raw date cell to a YYYY-MM-DD string, or explain why it cannot be.
 *
 * Two accepted shapes:
 *  - number: a real Excel date cell (serial day count). Unambiguous — Excel
 *    resolved the day/month order against the author's locale on entry.
 *  - string: year-first text only. Day-first and month-first text (26/03/2026,
 *    03/26/2026) is rejected rather than guessed, because a single value cannot
 *    distinguish them and a wrong guess silently corrupts the record.
 *
 * Never parses text via `new Date()`: that yields local midnight, and reading it
 * back with UTC getters is what shifted every imported date back one day.
 */
export function parseImportDate(val: unknown): DateParseResult {
  if (typeof val === "number" && !Number.isNaN(val)) {
    const date = excelSerialToDate(val);
    if (!date) return { ok: false, message: `Invalid Excel date value (${val})` };
    const rangeError = checkYearRange(date.getUTCFullYear());
    if (rangeError) return { ok: false, message: `${rangeError} (${val})` };
    return { ok: true, value: formatUTCDate(date) };
  }

  if (typeof val === "string") {
    const raw = val.trim();
    const match = raw.match(YEAR_FIRST_DATE_RE);
    if (!match) return { ok: false, message: `Unrecognised date "${raw}" — ${DATE_FORMAT_HINT}` };

    const year = Number(match[1]);
    const month = Number(match[3]);
    const day = Number(match[4]);

    const rangeError = checkYearRange(year);
    if (rangeError) return { ok: false, message: `${rangeError} ("${raw}")` };
    if (month < 1 || month > 12) {
      return { ok: false, message: `Invalid month in "${raw}" — ${DATE_FORMAT_HINT}` };
    }
    // Build in UTC and compare back to catch non-existent days (e.g. 2026-02-30)
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return { ok: false, message: `"${raw}" is not a real calendar date` };
    }
    return { ok: true, value: formatUTCDate(date) };
  }

  return { ok: false, message: `unrecognised date value — ${DATE_FORMAT_HINT}` };
}

/** Today as YYYY-MM-DD in the user's own timezone, for comparing calendar dates */
function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Case-insensitive lookup: lowercase bank name → canonical Title Case name */
const BANK_NAME_LOOKUP = new Map<string, string>(
  BANK_NAMES.map((name) => [name.toLowerCase(), name])
);

/** Fields whose values are validated against uppercase enums */
const UPPERCASE_ENUM_FIELDS = [
  "title",
  "gender",
  "ethnicGroup",
  "maritalStatus",
  "bankAccType",
  "accRelationship",
] as const;

/**
 * Prepare a raw row for Zod: normalise date cells to YYYY-MM-DD and enum casing.
 *
 * Date cells that cannot be normalised are reported in `dateErrors` and removed
 * from the output, so the row fails loudly with one clear message instead of
 * being imported with the date silently missing.
 */
function prepareRow(raw: Record<string, unknown>): {
  out: Record<string, unknown>;
  dateErrors: { field: string; message: string }[];
} {
  const out: Record<string, unknown> = { ...raw };
  const dateErrors: { field: string; message: string }[] = [];
  // Ensure idNumber is always a string so Zod's custom messages apply
  if (out.idNumber === undefined || out.idNumber === null) {
    out.idNumber = "";
  } else if (typeof out.idNumber === "number") {
    out.idNumber = String(out.idNumber);
  }
  for (const field of DATE_FIELDS) {
    const v = out[field];
    // Blank or whitespace-only cells mean "no change" and are never an error.
    // Remove the key so the field is treated as absent rather than as bad input.
    if (v === undefined || v === null || String(v).trim() === "") {
      delete out[field];
      continue;
    }
    const parsed = parseImportDate(v);
    if (!parsed.ok) {
      dateErrors.push({ field, message: parsed.message });
      delete out[field];
      continue;
    }
    if (field === "dateOfBirth" && parsed.value > todayLocalISO()) {
      dateErrors.push({
        field,
        message: `Date of birth cannot be in the future (${parsed.value})`,
      });
      delete out[field];
      continue;
    }
    out[field] = parsed.value;
  }
  for (const field of UPPERCASE_ENUM_FIELDS) {
    const v = out[field];
    if (typeof v === "string" && v !== "") {
      out[field] = v.toUpperCase();
    }
  }
  // Normalise bank name to canonical Title Case (case-insensitive match)
  const rawBank = out.bankName;
  if (typeof rawBank === "string" && rawBank !== "") {
    const canonical = BANK_NAME_LOOKUP.get(rawBank.toLowerCase().trim());
    if (canonical) {
      out.bankName = canonical;
      // Auto-populate branchCode if not provided
      if (!out.branchCode) {
        out.branchCode = BRANCH_CODES[canonical];
      }
    }
  }
  return { out, dateErrors };
}

/**
 * Validate parsed import rows against the employee schema.
 * Returns valid rows with row index (1-based file row) and per-row errors.
 */
export function validateImportRows(
  rawRows: Record<string, unknown>[]
): { valid: ValidatedRow[]; errors: ImportError[] } {
  const valid: ValidatedRow[] = [];
  const errors: ImportError[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const rowIndex = i + 1;
    const { out: prepared, dateErrors } = prepareRow(rawRows[i]);

    const result = employeeFormSchema.safeParse(prepared);

    // A malformed date always fails the row. Zod issues for other fields are
    // still reported alongside so the user sees every problem in one pass.
    for (const e of dateErrors) {
      errors.push({ row: rowIndex, message: e.message, field: e.field });
    }

    if (result.success) {
      if (dateErrors.length === 0) {
        valid.push({ rowIndex, data: result.data });
      }
      continue;
    }

    for (const issue of result.error.issues) {
      const field = issue.path?.[0] as string | undefined;
      // Already reported with a clearer, format-specific message
      if (field && dateErrors.some((e) => e.field === field)) continue;
      const baseMessage = issue.message ?? "Validation failed";
      const rawValue = field ? prepared[field] : undefined;
      const message =
        rawValue !== undefined && rawValue !== ""
          ? `${baseMessage} (${String(rawValue)})`
          : baseMessage;
      errors.push({ row: rowIndex, message, field });
    }
  }

  return { valid, errors };
}

/** Existing employee lookup: idNumber -> _id (for classification) */
export type ExistingIdMap = Map<string, { _id: string }>;

/**
 * Classify validated rows into toCreate (new) and toUpdate (existing by idNumber).
 * existingIdNumbers: from getEmployeeIdNumbers query, e.g. [{ idNumber, _id }, ...]
 */
export function classifyRows(
  validRows: ValidatedRow[],
  existingIdNumbers: { idNumber: string; _id: string }[]
): {
  toCreate: ValidatedRow[];
  toUpdate: { validated: ValidatedRow; _id: string }[];
} {
  const existingMap = new Map<string, string>(
    existingIdNumbers.map((e) => [e.idNumber, e._id])
  );
  const toCreate: ValidatedRow[] = [];
  const toUpdate: { validated: ValidatedRow; _id: string }[] = [];

  for (const validated of validRows) {
    const id = existingMap.get(validated.data.idNumber);
    if (id) {
      toUpdate.push({ validated, _id: id });
    } else {
      toCreate.push(validated);
    }
  }

  return { toCreate, toUpdate };
}
