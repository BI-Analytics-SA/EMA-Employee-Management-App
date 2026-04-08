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

/** Format a UTC Date as YYYY-MM-DD using UTC getters (avoids timezone day-shift) */
function formatUTCDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Excel serial date to YYYY-MM-DD string */
function excelDateToString(val: unknown): string | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "string") {
    const isoMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return val;
    const d = new Date(val);
    if (isNaN(d.getTime())) return undefined;
    return formatUTCDate(d);
  }
  if (typeof val === "number" && !Number.isNaN(val)) {
    const date = XLSXSerialToDate(val);
    return date ? formatUTCDate(date) : undefined;
  }
  return undefined;
}

/** Convert Excel serial number to Date (Excel epoch is 1899-12-30) */
function XLSXSerialToDate(serial: number): Date | null {
  const utcDays = Math.floor(serial);
  const fraction = serial - utcDays;
  const date = new Date(Date.UTC(1899, 11, 30 + utcDays));
  if (isNaN(date.getTime())) return null;
  const ms = Math.round(fraction * 24 * 60 * 60 * 1000);
  date.setUTCMilliseconds(date.getUTCMilliseconds() + ms);
  return date;
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

/** Prepare a raw row for Zod: coerce date-like values to strings, normalise enum casing */
function prepareRow(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };
  // Ensure idNumber is always a string so Zod's custom messages apply
  if (out.idNumber === undefined || out.idNumber === null) {
    out.idNumber = "";
  } else if (typeof out.idNumber === "number") {
    out.idNumber = String(out.idNumber);
  }
  for (const field of DATE_FIELDS) {
    const v = out[field];
    if (v !== undefined && v !== null && v !== "") {
      const str = excelDateToString(v);
      if (str) out[field] = str;
    }
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
        out.branchCode = BRANCH_CODES[canonical] ?? undefined;
      }
    }
  }
  return out;
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
    const prepared = prepareRow(rawRows[i]);

    const result = employeeFormSchema.safeParse(prepared);
    if (result.success) {
      valid.push({ rowIndex, data: result.data });
    } else {
      for (const issue of result.error.issues) {
        const baseMessage = issue.message ?? "Validation failed";
        const field = issue.path?.[0] as string | undefined;
        const rawValue = field ? prepared[field] : undefined;
        const message =
          rawValue !== undefined && rawValue !== ""
            ? `${baseMessage} (${String(rawValue)})`
            : baseMessage;
        errors.push({ row: rowIndex, message, field });
      }
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
