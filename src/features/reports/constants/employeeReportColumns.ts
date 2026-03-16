import type { Doc } from "../../../../convex/_generated/dataModel";
import {
  PAY_METHODS,
  BANK_ACC_TYPES,
  ACC_RELATIONSHIPS,
} from "@/lib/constants/bankDetails";

const TITLES: Record<string, string> = {
  MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms",
  DR: "Dr", PROF: "Prof", REV: "Rev",
};
const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: "Single", MARRIED: "Married", DIVORCED: "Divorced", WIDOWED: "Widowed", SEPARATED: "Separated",
};
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
    getValue: (emp) => formatDate(emp.lastDateWorked),
    defaultVisible: false,
  },
  {
    id: "uifEndDate",
    label: "UIF End Date",
    getValue: (emp) => formatDate(emp.uifEndDate),
    defaultVisible: false,
  },
  {
    id: "language",
    label: "Language",
    getValue: (emp) => emp.language ?? undefined,
    defaultVisible: false,
  },
  {
    id: "alternativeNumber",
    label: "Alternative Number",
    getValue: (emp) => emp.alternativeNumber ?? undefined,
    defaultVisible: false,
  },
  {
    id: "hrsPerPeriod",
    label: "Hours per Period",
    getValue: (emp) => emp.hrsPerPeriod ?? undefined,
    defaultVisible: false,
  },
  {
    id: "hoursPerDay",
    label: "Hours per Day",
    getValue: (emp) => emp.hoursPerDay ?? undefined,
    defaultVisible: false,
  },
  {
    id: "workAddressCode",
    label: "Work Address Code",
    getValue: (emp) => emp.workAddressCode ?? undefined,
    defaultVisible: false,
  },
  {
    id: "resUnit",
    label: "Res Unit",
    getValue: (emp) => emp.resUnit ?? undefined,
    defaultVisible: false,
  },
  {
    id: "resComplex",
    label: "Res Complex",
    getValue: (emp) => emp.resComplex ?? undefined,
    defaultVisible: false,
  },
  {
    id: "residentialCountry",
    label: "Residential Country",
    getValue: (emp) => emp.residentialCountry ?? undefined,
    defaultVisible: false,
  },
  {
    id: "illnessCondition",
    label: "Illness Condition",
    getValue: (emp) => emp.illnessCondition ?? undefined,
    defaultVisible: false,
  },
  {
    id: "training",
    label: "Training",
    getValue: (emp) => {
      const v = emp.training;
      return v != null ? (v ? "Yes" : "No") : undefined;
    },
    defaultVisible: false,
  },
  {
    id: "shift",
    label: "Shift",
    getValue: (emp) => emp.shift ?? undefined,
    defaultVisible: false,
  },
  {
    id: "shiftAllocation",
    label: "Shift Allocation",
    getValue: (emp) => emp.shiftAllocation ?? undefined,
    defaultVisible: false,
  },
  {
    id: "deptGroup",
    label: "Department Group",
    getValue: (emp) => emp.deptGroup ?? undefined,
    defaultVisible: false,
  },
  {
    id: "departmentWorked",
    label: "Department Worked",
    getValue: (emp) => emp.departmentWorked ?? undefined,
    defaultVisible: false,
  },
  {
    id: "department",
    label: "Department",
    getValue: (emp) => emp.department ?? undefined,
    defaultVisible: false,
  },
  {
    id: "maritalStatus",
    label: "Marital Status",
    getValue: (emp) => {
      const v = emp.maritalStatus;
      return v ? (MARITAL_STATUS_LABELS[v] ?? v) : undefined;
    },
    defaultVisible: false,
  },
  // Bank details – off by default
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
  {
    id: "taxYearStart",
    label: "Tax Year Start",
    getValue: (emp) => formatDate(emp.taxYearStart),
    defaultVisible: false,
  },
  {
    id: "newUifStartDate",
    label: "New UIF Start Date",
    getValue: (emp) => formatDate(emp.newUifStartDate),
    defaultVisible: false,
  },
  {
    id: "repAddr1",
    label: "Rep Address 1",
    getValue: (emp) => emp.repAddr1 ?? undefined,
    defaultVisible: false,
  },
  {
    id: "repAddr2",
    label: "Rep Address 2",
    getValue: (emp) => emp.repAddr2 ?? undefined,
    defaultVisible: false,
  },
  {
    id: "repAddr3",
    label: "Rep Address 3",
    getValue: (emp) => emp.repAddr3 ?? undefined,
    defaultVisible: false,
  },
  {
    id: "repPostCode",
    label: "Rep Post Code",
    getValue: (emp) => emp.repPostCode ?? undefined,
    defaultVisible: false,
  },
  {
    id: "fullNames",
    label: "Full Names",
    getValue: (emp) => emp.fullNames ?? undefined,
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
