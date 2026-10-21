export type ExportColumn = {
  id: string;
  source: "database" | "custom";
  dbField?: string;
  label: string;
  dataType: "text" | "number" | "date";
  defaultValue?: string;
  enabled: boolean;
};

export const DEFAULT_DATABASE_COLUMNS: ExportColumn[] = [
  { id: "employeeNo", source: "database", dbField: "employeeNo", label: "Employee No", dataType: "text", enabled: true },
  { id: "idNumber", source: "database", dbField: "idNumber", label: "ID Number", dataType: "text", enabled: true },
  { id: "title", source: "database", dbField: "title", label: "Title", dataType: "text", enabled: true },
  { id: "initials", source: "database", dbField: "initials", label: "Initials", dataType: "text", enabled: true },
  { id: "firstName", source: "database", dbField: "firstName", label: "First Name", dataType: "text", enabled: true },
  { id: "secondName", source: "database", dbField: "secondName", label: "Second Name", dataType: "text", enabled: true },
  { id: "lastName", source: "database", dbField: "lastName", label: "Last Name", dataType: "text", enabled: true },
  { id: "knownAs", source: "database", dbField: "knownAs", label: "Known As", dataType: "text", enabled: true },
  { id: "dateOfBirth", source: "database", dbField: "dateOfBirth", label: "Date of Birth", dataType: "date", enabled: true },
  { id: "gender", source: "database", dbField: "gender", label: "Gender", dataType: "text", enabled: true },
  { id: "ethnicGroup", source: "database", dbField: "ethnicGroup", label: "Ethnic Group", dataType: "text", enabled: true },
  { id: "cellNumber", source: "database", dbField: "cellNumber", label: "Cell Number", dataType: "text", enabled: true },
  { id: "email", source: "database", dbField: "email", label: "Email", dataType: "text", enabled: false },
  { id: "resStreetNo", source: "database", dbField: "resStreetNo", label: "Street No", dataType: "text", enabled: true },
  { id: "resStreetName", source: "database", dbField: "resStreetName", label: "Street Name", dataType: "text", enabled: true },
  { id: "resSuburb", source: "database", dbField: "resSuburb", label: "Suburb", dataType: "text", enabled: true },
  { id: "resCity", source: "database", dbField: "resCity", label: "City", dataType: "text", enabled: true },
  { id: "resPostCode", source: "database", dbField: "resPostCode", label: "Post Code", dataType: "text", enabled: true },
  { id: "dateRegistered", source: "database", dbField: "dateRegistered", label: "Date Registered", dataType: "date", enabled: true },
  { id: "dateEngaged", source: "database", dbField: "dateEngaged", label: "Date Engaged", dataType: "date", enabled: true },
  { id: "taxNumber", source: "database", dbField: "taxNumber", label: "Tax Number", dataType: "text", enabled: true },
  { id: "certificate", source: "database", dbField: "certificate", label: "Certificate", dataType: "text", enabled: true },
  { id: "lastDateWorked", source: "database", dbField: "lastDateWorked", label: "Last Date Worked", dataType: "date", enabled: false },
  { id: "uifEndDate", source: "database", dbField: "uifEndDate", label: "UIF End Date", dataType: "date", enabled: false },
  { id: "language", source: "database", dbField: "language", label: "Language", dataType: "text", enabled: false },
  { id: "alternativeNumber", source: "database", dbField: "alternativeNumber", label: "Alternative Number", dataType: "text", enabled: false },
  { id: "hrsPerPeriod", source: "database", dbField: "hrsPerPeriod", label: "Hours per Period", dataType: "number", enabled: false },
  { id: "hoursPerDay", source: "database", dbField: "hoursPerDay", label: "Hours per Day", dataType: "number", enabled: false },
  { id: "workAddressCode", source: "database", dbField: "workAddressCode", label: "Work Address Code", dataType: "number", enabled: false },
  { id: "companyNumber", source: "database", dbField: "companyNumber", label: "Company Number", dataType: "text", enabled: false },
  { id: "resUnit", source: "database", dbField: "resUnit", label: "Res Unit", dataType: "text", enabled: false },
  { id: "resComplex", source: "database", dbField: "resComplex", label: "Res Complex", dataType: "text", enabled: false },
  { id: "residentialCountry", source: "database", dbField: "residentialCountry", label: "Residential Country", dataType: "text", enabled: false },
  { id: "illnessCondition", source: "database", dbField: "illnessCondition", label: "Illness Condition", dataType: "text", enabled: false },
  { id: "payMethod", source: "database", dbField: "payMethod", label: "Pay Method", dataType: "text", enabled: false },
  { id: "bankAccType", source: "database", dbField: "bankAccType", label: "Bank Account Type", dataType: "text", enabled: false },
  { id: "bankAccNo", source: "database", dbField: "bankAccNo", label: "Bank Account No", dataType: "text", enabled: false },
  { id: "bankName", source: "database", dbField: "bankName", label: "Bank Name", dataType: "text", enabled: false },
  { id: "branchCode", source: "database", dbField: "branchCode", label: "Branch Code", dataType: "text", enabled: false },
  { id: "accHolder", source: "database", dbField: "accHolder", label: "Account Holder", dataType: "text", enabled: false },
  { id: "accRelationship", source: "database", dbField: "accRelationship", label: "Account Relationship", dataType: "text", enabled: false },
  { id: "training", source: "database", dbField: "training", label: "Training", dataType: "text", enabled: false },
  { id: "shift", source: "database", dbField: "shift", label: "Shift", dataType: "text", enabled: false },
  { id: "shiftAllocation", source: "database", dbField: "shiftAllocation", label: "Shift Allocation", dataType: "text", enabled: false },
  { id: "deptGroup", source: "database", dbField: "deptGroup", label: "Department Group", dataType: "text", enabled: false },
  { id: "departmentWorked", source: "database", dbField: "departmentWorked", label: "Department Worked", dataType: "text", enabled: false },
  { id: "department", source: "database", dbField: "department", label: "Department", dataType: "text", enabled: false },
  { id: "maritalStatus", source: "database", dbField: "maritalStatus", label: "Marital Status", dataType: "text", enabled: false },
  { id: "taxYearStart", source: "database", dbField: "taxYearStart", label: "Tax Year Start", dataType: "date", enabled: false },
  { id: "newUifStartDate", source: "database", dbField: "newUifStartDate", label: "New UIF Start Date", dataType: "date", enabled: false },
  { id: "repAddr1", source: "database", dbField: "repAddr1", label: "Rep Address 1", dataType: "text", enabled: false },
  { id: "repAddr2", source: "database", dbField: "repAddr2", label: "Rep Address 2", dataType: "text", enabled: false },
  { id: "repAddr3", source: "database", dbField: "repAddr3", label: "Rep Address 3", dataType: "text", enabled: false },
  { id: "repPostCode", source: "database", dbField: "repPostCode", label: "Rep Post Code", dataType: "text", enabled: false },
  { id: "fullNames", source: "database", dbField: "fullNames", label: "Full Names", dataType: "text", enabled: false },
];

/** Merge saved export columns with defaults so new default columns (e.g. bank details) always appear; saved overrides (label, enabled) apply when present. Preserves saved column order; appends any defaults not in saved. */
export function mergeExportColumns(
  defaultCols: ExportColumn[],
  saved: ExportColumn[] | undefined
): ExportColumn[] {
  if (!saved?.length) return defaultCols;
  const defaultById = new Map(defaultCols.map((c) => [c.id, c]));
  const savedIds = new Set(saved.map((c) => c.id));
  const mergedFromSaved = saved.map((s) => {
    const defaultCol = defaultById.get(s.id);
    return defaultCol ? { ...defaultCol, ...s } : s;
  });
  const remainingDefaults = defaultCols.filter((d) => !savedIds.has(d.id));
  return [...mergedFromSaved, ...remainingDefaults];
}
