/**
 * Clearable employee columns for bulk clear feature.
 * Excludes: _id, organizationId, idNumber, createdAt, updatedAt, createdBy,
 * auto-computed fields (taxYearStart, newUifStartDate, repAddr1-3, repPostCode, fullNames),
 * and image fields (imageStorageId, imageUrl).
 */

export type ClearableColumnCategory =
  | "personal"
  | "contact"
  | "address"
  | "statusDates"
  | "work"
  | "health"
  | "banking";

export interface ClearableColumnDef {
  id: string;
  label: string;
  category: ClearableColumnCategory;
}

const CATEGORY_LABELS: Record<ClearableColumnCategory, string> = {
  personal: "Personal",
  contact: "Contact",
  address: "Address",
  statusDates: "Status & Dates",
  work: "Work",
  health: "Health",
  banking: "Banking",
};

export const CLEARABLE_COLUMNS: ClearableColumnDef[] = [
  // Personal
  { id: "employeeNo", label: "Employee #", category: "personal" },
  { id: "title", label: "Title", category: "personal" },
  { id: "initials", label: "Initials", category: "personal" },
  { id: "firstName", label: "First Name", category: "personal" },
  { id: "secondName", label: "Second Name", category: "personal" },
  { id: "lastName", label: "Last Name", category: "personal" },
  { id: "knownAs", label: "Known As", category: "personal" },
  { id: "dateOfBirth", label: "Date of Birth", category: "personal" },
  { id: "gender", label: "Gender", category: "personal" },
  { id: "ethnicGroup", label: "Ethnic Group", category: "personal" },
  { id: "language", label: "Language", category: "personal" },
  // Contact
  { id: "cellNumber", label: "Cell Number", category: "contact" },
  { id: "alternativeNumber", label: "Alternative Number", category: "contact" },
  // Address
  { id: "resUnit", label: "Res Unit", category: "address" },
  { id: "resComplex", label: "Res Complex", category: "address" },
  { id: "resStreetNo", label: "Street No", category: "address" },
  { id: "resStreetName", label: "Street Name", category: "address" },
  { id: "resSuburb", label: "Suburb", category: "address" },
  { id: "resCity", label: "City", category: "address" },
  { id: "resPostCode", label: "Post Code", category: "address" },
  { id: "residentialCountry", label: "Residential Country", category: "address" },
  // Status & Dates
  { id: "dateRegistered", label: "Date Registered", category: "statusDates" },
  { id: "dateEngaged", label: "Date Engaged", category: "statusDates" },
  { id: "lastDateWorked", label: "Last Date Worked", category: "statusDates" },
  { id: "uifEndDate", label: "UIF End Date", category: "statusDates" },
  { id: "taxNumber", label: "Tax Number", category: "statusDates" },
  { id: "certificate", label: "Certificate", category: "statusDates" },
  // Work
  { id: "hrsPerPeriod", label: "Hours per Period", category: "work" },
  { id: "hoursPerDay", label: "Hours per Day", category: "work" },
  { id: "workAddressCode", label: "Work Address Code", category: "work" },
  { id: "training", label: "Training", category: "work" },
  { id: "shift", label: "Shift", category: "work" },
  { id: "shiftAllocation", label: "Shift Allocation", category: "work" },
  { id: "deptGroup", label: "Department Group", category: "work" },
  { id: "departmentWorked", label: "Department Worked", category: "work" },
  { id: "department", label: "Department", category: "work" },
  { id: "maritalStatus", label: "Marital Status", category: "work" },
  // Health
  { id: "illnessCondition", label: "Illness Condition", category: "health" },
  // Banking
  { id: "payMethod", label: "Pay Method", category: "banking" },
  { id: "bankAccType", label: "Bank Account Type", category: "banking" },
  { id: "bankAccNo", label: "Bank Account No", category: "banking" },
  { id: "bankName", label: "Bank Name", category: "banking" },
  { id: "branchCode", label: "Branch Code", category: "banking" },
  { id: "accHolder", label: "Account Holder", category: "banking" },
  { id: "accRelationship", label: "Account Relationship", category: "banking" },
];

/** Allowlist of column IDs accepted by the backend bulkClearColumns mutation */
export const CLEARABLE_COLUMN_IDS = CLEARABLE_COLUMNS.map((c) => c.id);

export function getCategoryLabel(category: ClearableColumnCategory): string {
  return CATEGORY_LABELS[category];
}

export function getColumnsByCategory(): Map<ClearableColumnCategory, ClearableColumnDef[]> {
  const map = new Map<ClearableColumnCategory, ClearableColumnDef[]>();
  const order: ClearableColumnCategory[] = [
    "personal",
    "contact",
    "address",
    "statusDates",
    "work",
    "health",
    "banking",
  ];
  for (const cat of order) {
    map.set(cat, CLEARABLE_COLUMNS.filter((c) => c.category === cat));
  }
  return map;
}
