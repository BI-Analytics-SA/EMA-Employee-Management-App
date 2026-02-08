import { z } from "zod";

export const contractFormSchema = z.object({
  nameSurname: z.string().min(1, "Name and surname required"),
  idNumber: z.string().min(1, "ID number required"),
  signedDate: z
    .string()
    .min(1, "Signed date required")
    .transform((s) => new Date(s).getTime()),
  startDate: z
    .string()
    .min(1, "Start date required")
    .transform((s) => new Date(s).getTime()),
  employeeNo: z.string().min(1, "Employee number required"),
  dateEngaged: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s).getTime() : undefined)),
  contractHeading: z.string().optional(),
  contractCategory: z.string().optional(),
  placeOfSignature: z.string().optional(),
  termsAndConditionsHtml: z.string().optional(),
});

export type ContractFormValues = z.infer<typeof contractFormSchema>;
export type ContractFormInput = z.input<typeof contractFormSchema>;

/** Format a stored timestamp to YYYY-MM-DD for date inputs */
export function timestampToDateString(ts: number | undefined): string {
  if (ts == null || ts === 0) return "";
  const d = new Date(ts);
  return d.toISOString().slice(0, 10);
}
