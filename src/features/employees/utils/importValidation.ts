import { z } from "zod";
import { employeeFormSchema } from "@/lib/validations/employee";

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

/** Excel serial date to YYYY-MM-DD string */
function excelDateToString(val: unknown): string | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "string") {
    const t = new Date(val).getTime();
    return isNaN(t) ? undefined : new Date(t).toISOString().slice(0, 10);
  }
  if (typeof val === "number" && !Number.isNaN(val)) {
    const date = XLSXSerialToDate(val);
    return date ? date.toISOString().slice(0, 10) : undefined;
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

/** Prepare a raw row for Zod: coerce date-like values to strings, ensure strings where needed */
function prepareRow(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };
  for (const field of DATE_FIELDS) {
    const v = out[field];
    if (v !== undefined && v !== null && v !== "") {
      const str = excelDateToString(v);
      if (str) out[field] = str;
    }
  }
  if (typeof out.dateOfBirth === "number") {
    const str = excelDateToString(out.dateOfBirth);
    if (str) out.dateOfBirth = str;
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
      const first = result.error.issues[0];
      const message = first?.message ?? "Validation failed";
      const field = first?.path?.[0] as string | undefined;
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
