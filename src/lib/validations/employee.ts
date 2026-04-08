import { z } from "zod";
import { parseLocalDate, formatDateInput } from "@/lib/dateUtils";
import { BANK_NAMES } from "@/lib/constants/bankDetails";

/** South African ID number: 13 digits */
const idNumberSchema = z
  .string()
  .length(13, "ID number must be exactly 13 digits")
  .regex(/^\d+$/, "ID number must contain only digits");

/** Reusable schema: optional string that normalises "" to undefined */
const optionalString = z
  .string()
  .optional()
  .transform((s) => (s ? s : undefined));

/** Reusable schema: accepts string|number, returns number or undefined */
const optionalNumeric = z
  .union([z.string(), z.number()])
  .optional()
  .transform((s) => {
    if (s === "" || s === undefined || s === null) return undefined;
    const n = typeof s === "number" ? s : Number(s);
    return Number.isNaN(n) ? undefined : n;
  });

/** Reusable schema: optional date string → timestamp, guards against invalid dates */
const optionalDateTimestamp = z
  .string()
  .optional()
  .transform((s) => {
    if (!s) return undefined;
    return parseLocalDate(s);
  });

export const employeeTitleEnum = z.enum(["MR", "MISS", "MRS", "MS", "DR", "PROF", "REV"]);
export const genderEnum = z.enum(["M", "F"]);
export const ethnicGroupEnum = z.enum(["A", "C", "W", "I", "B"]);
export const payMethodEnum = z.enum(["02", "03"]);
export const bankAccTypeEnum = z.enum(["S", "C"]);
export const accRelationshipEnum = z.enum(["O", "T"]);
export const maritalStatusEnum = z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "SEPARATED"]);

export const employeeFormSchema = z.object({
  idNumber: idNumberSchema,
  employeeNo: optionalString,
  title: z
    .union([employeeTitleEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  initials: z.string().max(10).optional().transform((s) => (s ? s : undefined)),
  firstName: optionalString,
  secondName: optionalString,
  lastName: optionalString,
  knownAs: optionalString,
  dateOfBirth: optionalDateTimestamp,
  gender: z
    .union([genderEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  ethnicGroup: z
    .union([ethnicGroupEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  language: optionalString,
  cellNumber: optionalString,
  alternativeNumber: optionalString,
  email: z.string().email("Invalid email address").optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  resUnit: optionalString,
  resComplex: optionalString,
  resStreetNo: optionalString,
  resStreetName: optionalString,
  resSuburb: optionalString,
  resCity: optionalString,
  resPostCode: optionalString,
  residentialCountry: optionalString,
  dateRegistered: optionalDateTimestamp,
  dateEngaged: optionalDateTimestamp,
  lastDateWorked: optionalDateTimestamp,
  uifEndDate: optionalDateTimestamp,
  taxNumber: optionalString,
  certificate: optionalString,
  hrsPerPeriod: optionalNumeric,
  hoursPerDay: optionalNumeric,
  workAddressCode: optionalNumeric,
  companyNumber: optionalString,
  training: z
    .union([z.boolean(), z.enum(["true", "false"]), z.literal("")])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return undefined;
      if (typeof v === "boolean") return v;
      return v === "true";
    }),
  shift: optionalString,
  shiftAllocation: optionalString,
  deptGroup: optionalString,
  departmentWorked: optionalString,
  department: optionalString,
  maritalStatus: z
    .union([maritalStatusEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  illnessCondition: optionalString,
  payMethod: z
    .union([payMethodEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  bankAccType: z
    .union([bankAccTypeEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  bankAccNo: optionalString,
  bankName: z
    .union([z.enum(BANK_NAMES), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  branchCode: optionalString,
  accHolder: optionalString,
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
  return parseLocalDate(value) ?? 0;
}

/** Format a stored timestamp to YYYY-MM-DD for input[type="date"] */
export function timestampToDateString(ts: number | undefined): string {
  if (ts == null || ts === 0) return "";
  return formatDateInput(ts);
}
