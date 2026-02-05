import { z } from "zod";

/** South African ID number: 13 digits */
const idNumberSchema = z
  .string()
  .length(13, "ID number must be exactly 13 digits")
  .regex(/^\d+$/, "ID number must contain only digits");

export const employeeTitleEnum = z.enum(["MR", "MISS", "MRS", "MS"]);
export const genderEnum = z.enum(["M", "F"]);
export const ethnicGroupEnum = z.enum(["A", "C", "W", "I", "B"]);

export const employeeFormSchema = z.object({
  idNumber: idNumberSchema,
  employeeNo: z.string().optional(),
  title: employeeTitleEnum,
  initials: z.string().min(1, "Initials required").max(10),
  firstName: z.string().min(1, "First name required"),
  secondName: z.string().optional(),
  lastName: z.string().min(1, "Last name required"),
  knownAs: z.string().min(1, "Known as required"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth required")
    .transform((s) => new Date(s).getTime()),
  gender: genderEnum,
  ethnicGroup: ethnicGroupEnum,
  cellNumber: z.string().min(1, "Cell number required"),
  resStreetNo: z.string().min(1, "Street number required"),
  resStreetName: z.string().min(1, "Street name required"),
  resSuburb: z.string().min(1, "Suburb required"),
  resCity: z.string().min(1, "City required"),
  resPostCode: z.string().min(1, "Postal code required"),
  dateRegistered: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s).getTime() : undefined)),
  dateEngaged: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s).getTime() : undefined)),
  taxNumber: z.string().optional(),
  certificate: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
/** Form input type (dates as strings for date inputs) */
export type EmployeeFormInput = z.input<typeof employeeFormSchema>;

/** Parse a date string (YYYY-MM-DD) to timestamp for storage */
export function dateStringToTimestamp(value: string): number {
  const d = new Date(value);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

/** Format a stored timestamp to YYYY-MM-DD for input[type="date"] */
export function timestampToDateString(ts: number | undefined): string {
  if (ts == null || ts === 0) return "";
  const d = new Date(ts);
  return d.toISOString().slice(0, 10);
}
