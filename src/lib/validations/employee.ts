import { z } from "zod";

/** South African ID number: 13 digits */
const idNumberSchema = z
  .string()
  .length(13, "ID number must be exactly 13 digits")
  .regex(/^\d+$/, "ID number must contain only digits");

export const employeeTitleEnum = z.enum(["MR", "MISS", "MRS", "MS"]);
export const genderEnum = z.enum(["M", "F"]);
export const ethnicGroupEnum = z.enum(["A", "C", "W", "I", "B"]);
export const payMethodEnum = z.enum(["02", "03"]);
export const bankAccTypeEnum = z.enum(["S", "C"]);
export const accRelationshipEnum = z.enum(["O", "T"]);

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
  language: z.string().optional(),
  cellNumber: z.string().min(1, "Cell number required"),
  alternativeNumber: z.string().optional(),
  resUnit: z.string().optional(),
  resComplex: z.string().optional(),
  resStreetNo: z.string().min(1, "Street number required"),
  resStreetName: z.string().min(1, "Street name required"),
  resSuburb: z.string().min(1, "Suburb required"),
  resCity: z.string().min(1, "City required"),
  resPostCode: z.string().min(1, "Postal code required"),
  residentialCountry: z.string().optional(),
  dateRegistered: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s).getTime() : undefined)),
  dateEngaged: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s).getTime() : undefined)),
  lastDateWorked: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s).getTime() : undefined)),
  taxNumber: z.string().optional(),
  certificate: z.string().optional(),
  hrsPerPeriod: z
    .union([z.string(), z.number()])
    .optional()
    .transform((s) => {
      if (s === "" || s === undefined || s === null) return undefined;
      const n = typeof s === "number" ? s : Number(s);
      return Number.isNaN(n) ? undefined : n;
    }),
  hoursPerDay: z
    .union([z.string(), z.number()])
    .optional()
    .transform((s) => {
      if (s === "" || s === undefined || s === null) return undefined;
      const n = typeof s === "number" ? s : Number(s);
      return Number.isNaN(n) ? undefined : n;
    }),
  workAddressCode: z
    .union([z.string(), z.number()])
    .optional()
    .transform((s) => {
      if (s === "" || s === undefined || s === null) return undefined;
      const n = typeof s === "number" ? s : Number(s);
      return Number.isNaN(n) ? undefined : n;
    }),
  illnessCondition: z.string().optional(),
  payMethod: z
    .union([payMethodEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  bankAccType: z
    .union([bankAccTypeEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  bankAccNo: z.string().optional(),
  bankName: z.string().optional(),
  branchCode: z.string().optional(),
  accHolder: z.string().optional(),
  accRelationship: z
    .union([accRelationshipEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
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
