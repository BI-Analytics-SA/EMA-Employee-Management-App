import type { Doc } from "../../../../convex/_generated/dataModel";
import {
  PAY_METHODS,
  BANK_ACC_TYPES,
  ACC_RELATIONSHIPS,
} from "@/lib/constants/bankDetails";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };
const payMethodLabels: Record<string, string> = Object.fromEntries(PAY_METHODS.map((p) => [p.value, p.label]));
const bankAccTypeLabels: Record<string, string> = Object.fromEntries(BANK_ACC_TYPES.map((b) => [b.value, b.label]));
const accRelationshipLabels: Record<string, string> = Object.fromEntries(ACC_RELATIONSHIPS.map((a) => [a.value, a.label]));

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
  {
    id: "lastDateWorked",
    label: "Last Date Worked",
    getValue: (emp) => formatDate((emp as Record<string, unknown>).lastDateWorked as number | undefined),
    defaultVisible: false,
  },
  {
    id: "language",
    label: "Language",
    getValue: (emp) => (emp as Record<string, unknown>).language as string | undefined,
    defaultVisible: false,
  },
  {
    id: "alternativeNumber",
    label: "Alternative Number",
    getValue: (emp) => (emp as Record<string, unknown>).alternativeNumber as string | undefined,
    defaultVisible: false,
  },
  {
    id: "hrsPerPeriod",
    label: "Hours per Period",
    getValue: (emp) => (emp as Record<string, unknown>).hrsPerPeriod as number | undefined,
    defaultVisible: false,
  },
  {
    id: "hoursPerDay",
    label: "Hours per Day",
    getValue: (emp) => (emp as Record<string, unknown>).hoursPerDay as number | undefined,
    defaultVisible: false,
  },
  {
    id: "workAddressCode",
    label: "Work Address Code",
    getValue: (emp) => (emp as Record<string, unknown>).workAddressCode as number | undefined,
    defaultVisible: false,
  },
  {
    id: "resUnit",
    label: "Res Unit",
    getValue: (emp) => (emp as Record<string, unknown>).resUnit as string | undefined,
    defaultVisible: false,
  },
  {
    id: "resComplex",
    label: "Res Complex",
    getValue: (emp) => (emp as Record<string, unknown>).resComplex as string | undefined,
    defaultVisible: false,
  },
  {
    id: "residentialCountry",
    label: "Residential Country",
    getValue: (emp) => (emp as Record<string, unknown>).residentialCountry as string | undefined,
    defaultVisible: false,
  },
  {
    id: "illnessCondition",
    label: "Illness Condition",
    getValue: (emp) => (emp as Record<string, unknown>).illnessCondition as string | undefined,
    defaultVisible: false,
  },
  // Bank details – off by default; add new employee fields here with defaultVisible: false
  {
    id: "payMethod",
    label: "Pay Method",
    getValue: (emp) => (emp.payMethod ? payMethodLabels[emp.payMethod] ?? emp.payMethod : undefined),
    defaultVisible: false,
  },
  {
    id: "bankName",
    label: "Bank Name",
    getValue: (emp) => emp.bankName ?? undefined,
    defaultVisible: false,
  },
  {
    id: "branchCode",
    label: "Branch Code",
    getValue: (emp) => emp.branchCode ?? undefined,
    defaultVisible: false,
  },
  {
    id: "bankAccType",
    label: "Bank Account Type",
    getValue: (emp) => (emp.bankAccType ? bankAccTypeLabels[emp.bankAccType] ?? emp.bankAccType : undefined),
    defaultVisible: false,
  },
  {
    id: "bankAccNo",
    label: "Bank Account No",
    getValue: (emp) => emp.bankAccNo ?? undefined,
    defaultVisible: false,
  },
  {
    id: "accHolder",
    label: "Account Holder",
    getValue: (emp) => emp.accHolder ?? undefined,
    defaultVisible: false,
  },
  {
    id: "accRelationship",
    label: "Account Relationship",
    getValue: (emp) => (emp.accRelationship ? accRelationshipLabels[emp.accRelationship] ?? emp.accRelationship : undefined),
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
