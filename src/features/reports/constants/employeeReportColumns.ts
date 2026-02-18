import type { Doc } from "../../../../convex/_generated/dataModel";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };

function formatDate(ts: number | undefined): string {
  if (ts == null) return "—";
  return new Date(ts).toLocaleDateString();
}

export interface EmployeeReportColumnDef {
  id: string;
  label: string;
  getValue: (emp: Doc<"employees">) => string | number | undefined;
  /** Default visibility when no preferences saved */
  defaultVisible: boolean;
}

export const EMPLOYEE_REPORT_COLUMNS: EmployeeReportColumnDef[] = [
  {
    id: "name",
    label: "Name",
    getValue: (emp) => `${TITLES[emp.title] ?? emp.title} ${emp.firstName} ${emp.lastName}`.trim(),
    defaultVisible: true,
  },
  {
    id: "idNumber",
    label: "ID Number",
    getValue: (emp) => emp.idNumber,
    defaultVisible: true,
  },
  {
    id: "employeeNo",
    label: "Employee #",
    getValue: (emp) => emp.employeeNo ?? undefined,
    defaultVisible: true,
  },
  {
    id: "cellNumber",
    label: "Cell Number",
    getValue: (emp) => emp.cellNumber,
    defaultVisible: false,
  },
  {
    id: "dateOfBirth",
    label: "Date of Birth",
    getValue: (emp) => formatDate(emp.dateOfBirth),
    defaultVisible: false,
  },
  {
    id: "dateEngaged",
    label: "Date Engaged",
    getValue: (emp) => formatDate(emp.dateEngaged),
    defaultVisible: false,
  },
  {
    id: "dateRegistered",
    label: "Date Registered",
    getValue: (emp) => formatDate(emp.dateRegistered),
    defaultVisible: false,
  },
  {
    id: "knownAs",
    label: "Known As",
    getValue: (emp) => emp.knownAs,
    defaultVisible: false,
  },
];

export const DEFAULT_EMPLOYEE_REPORT_COLUMN_IDS = EMPLOYEE_REPORT_COLUMNS.filter(
  (c) => c.defaultVisible
).map((c) => c.id);

export function getVisibleColumnIds(savedIds: string[] | null): string[] {
  const validIds = new Set(EMPLOYEE_REPORT_COLUMNS.map((c) => c.id));
  if (savedIds?.length) {
    const filtered = savedIds.filter((id) => validIds.has(id));
    if (filtered.length > 0) return filtered;
  }
  return DEFAULT_EMPLOYEE_REPORT_COLUMN_IDS;
}
