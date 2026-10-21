import { toSastDateString } from "../lib/calendarDates";

/** Fields used by the app, rather than internal record/storage metadata. */
const metadataFields = new Set([
  "_id", "_creationTime", "organizationId", "createdAt", "updatedAt",
  "createdBy", "imageStorageId", "imageUrl",
]);

const dateFields = new Set([
  "dateOfBirth", "dateRegistered", "dateEngaged", "lastDateWorked",
  "uifEndDate", "taxYearStart", "newUifStartDate",
]);

const displayLabels: Record<string, Record<string, string>> = {
  gender: { M: "Male", F: "Female" },
  ethnicGroup: { A: "African", C: "Coloured", W: "White", I: "Indian", B: "Black" },
  payMethod: { "02": "Cash", "03": "Electronic Payment" },
  bankAccType: { S: "Savings", C: "Cheque" },
  accRelationship: { O: "Own", T: "3rd Party" },
};

/** Match every search term against any employee field, including formatted dates. */
export function matchesEmployeeSearch(employee: Record<string, unknown>, query: string): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return false;

  const values = Object.entries(employee).flatMap(([field, value]) => {
    if (metadataFields.has(field) || value == null) return [];
    if (dateFields.has(field) && typeof value === "number") {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return [];
      const iso = toSastDateString(value);
      const [year, month, day] = iso.split("-");
      return [iso, `${day}/${month}/${year}`, `${day}-${month}-${year}`];
    }
    if (typeof value === "boolean") return [String(value), value ? "yes" : "no"];
    if (typeof value !== "string" && typeof value !== "number") return [];
    return [String(value).toLowerCase(), displayLabels[field]?.[String(value)]?.toLowerCase() ?? ""];
  });

  return terms.every((term) => values.some((value) => value.includes(term)));
}
