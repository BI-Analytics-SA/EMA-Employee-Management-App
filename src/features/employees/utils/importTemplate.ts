import * as XLSX from "xlsx";

/** Import column definition: label in template, schema field name, and whether required */
export const IMPORT_COLUMNS = [
  { label: "ID Number", field: "idNumber" as const, required: true },
  { label: "Employee No", field: "employeeNo" as const, required: false },
  { label: "Title", field: "title" as const, required: false },
  { label: "Initials", field: "initials" as const, required: false },
  { label: "First Name", field: "firstName" as const, required: false },
  { label: "Second Name", field: "secondName" as const, required: false },
  { label: "Last Name", field: "lastName" as const, required: false },
  { label: "Known As", field: "knownAs" as const, required: false },
  { label: "Date of Birth", field: "dateOfBirth" as const, required: false },
  { label: "Gender", field: "gender" as const, required: false },
  { label: "Ethnic Group", field: "ethnicGroup" as const, required: false },
  { label: "Language", field: "language" as const, required: false },
  { label: "Cell Number", field: "cellNumber" as const, required: false },
  { label: "Alternative Number", field: "alternativeNumber" as const, required: false },
  { label: "Email", field: "email" as const, required: false },
  { label: "Res Unit", field: "resUnit" as const, required: false },
  { label: "Res Complex", field: "resComplex" as const, required: false },
  { label: "Street No", field: "resStreetNo" as const, required: false },
  { label: "Street Name", field: "resStreetName" as const, required: false },
  { label: "Suburb", field: "resSuburb" as const, required: false },
  { label: "City", field: "resCity" as const, required: false },
  { label: "Post Code", field: "resPostCode" as const, required: false },
  { label: "Residential Country", field: "residentialCountry" as const, required: false },
  { label: "Date Registered", field: "dateRegistered" as const, required: false },
  { label: "Date Engaged", field: "dateEngaged" as const, required: false },
  { label: "Last Date Worked", field: "lastDateWorked" as const, required: false },
  { label: "UIF End Date", field: "uifEndDate" as const, required: false },
  { label: "Tax Number", field: "taxNumber" as const, required: false },
  { label: "Certificate", field: "certificate" as const, required: false },
  { label: "Hours per Period", field: "hrsPerPeriod" as const, required: false },
  { label: "Hours per Day", field: "hoursPerDay" as const, required: false },
  { label: "Work Address Code", field: "workAddressCode" as const, required: false },
  { label: "Training", field: "training" as const, required: false },
  { label: "Shift", field: "shift" as const, required: false },
  { label: "Shift Allocation", field: "shiftAllocation" as const, required: false },
  { label: "Department Group", field: "deptGroup" as const, required: false },
  { label: "Department Worked", field: "departmentWorked" as const, required: false },
  { label: "Department", field: "department" as const, required: false },
  { label: "Marital Status", field: "maritalStatus" as const, required: false },
  { label: "Illness Condition", field: "illnessCondition" as const, required: false },
  { label: "Pay Method", field: "payMethod" as const, required: false },
  { label: "Bank Account Type", field: "bankAccType" as const, required: false },
  { label: "Bank Account No", field: "bankAccNo" as const, required: false },
  { label: "Bank Name", field: "bankName" as const, required: false },
  { label: "Branch Code", field: "branchCode" as const, required: false },
  { label: "Account Holder", field: "accHolder" as const, required: false },
  { label: "Account Relationship", field: "accRelationship" as const, required: false },
];

/** Build header row for template: label with * suffix if required */
export function getTemplateHeaders(): string[] {
  return IMPORT_COLUMNS.map((c) => (c.required ? `${c.label} *` : c.label));
}

/** Example data for two rows (valid formats for required enums and dates) */
const EXAMPLE_ROW_1 = [
  "9001015001087",
  "EMP001",
  "MR",
  "J",
  "John",
  "",
  "Doe",
  "John",
  "1990-01-01",
  "M",
  "W",
  "English",
  "0821234567",
  "",
  "john.doe@example.com",
  "",
  "",
  "123",
  "Main Road",
  "Sandton",
  "Johannesburg",
  "2196",
  "South Africa",
  "2020-01-15",
  "2020-01-15",
  "",
  "",
  "1234567890",
  "",
  "40",
  "8",
  "",
  "true",
  "",
  "",
  "",
  "",
  "",
  "SINGLE",
  "",
  "03",
  "S",
  "1234567890",
  "Example Bank",
  "632005",
  "John Doe",
  "O",
];
const EXAMPLE_ROW_2 = [
  "8506154003082",
  "EMP002",
  "MRS",
  "M",
  "Mary",
  "Anne",
  "Smith",
  "Mary",
  "1985-06-15",
  "F",
  "W",
  "",
  "0839876543",
  "",
  "",
  "5",
  "Block B",
  "45",
  "Church Street",
  "Cape Town City Centre",
  "Cape Town",
  "8001",
  "",
  "",
  "2019-06-01",
  "",
  "",
  "",
  "",
  "40",
  "8",
  "1",
  "false",
  "Day",
  "Morning",
  "Sales",
  "Sales",
  "Sales",
  "MARRIED",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
];

/** Reference sheet content: enum values, format notes, and usage instructions */
const REFERENCE_SHEET_DATA = [
  ["IMPORT REFERENCE"],
  [""],
  ["=== ALLOWED VALUES (use exact codes) ==="],
  ["Title", "MR", "MISS", "MRS", "MS", "DR", "PROF", "REV"],
  ["Gender", "M", "F"],
  ["Ethnic Group", "A (African)", "C (Coloured)", "W (White)", "I (Indian)", "B (Black)"],
  ["Marital Status", "SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "SEPARATED"],
  ["Pay Method", "02", "03"],
  ["Bank Account Type", "S (Savings)", "C (Current/Cheque)"],
  ["Account Relationship", "O (Own)", "T (Third party)"],
  ["Training", "true", "false"],
  [""],
  ["=== FORMAT NOTES ==="],
  ["Date format", "Use YYYY-MM-DD for date columns (e.g. 1990-01-01). Excel date values are also accepted."],
  ["ID Number *", "13 digits, numbers only (South African ID) — the only required field"],
  [""],
  ["=== COLUMN RULES ==="],
  ["Column order", "Columns can be in any order. The system matches by column name, not position."],
  ["Column names", "Matching is case-insensitive. You can use the template label (e.g. 'First Name'),"],
  ["", "the label with a star (e.g. 'First Name *'), or the database field name (e.g. 'firstName')."],
  ["Extra columns", "Any columns the system does not recognise are ignored. They will be listed in the preview."],
  ["Missing columns", "Optional columns can be left out entirely. They will not be imported or changed."],
  ["Empty cells", "If a cell is blank, that field is skipped for updates — existing data is NOT overwritten."],
  ["Updates", "When updating existing employees (matched by ID Number), only columns with values are updated."],
  ["", "To clear a field you must edit the employee directly — blank cells in the import are treated as 'no change'."],
  [""],
  ["=== AUTO-ADDED SETTINGS ==="],
  ["Department", "If a value does not exist in your organisation's Data Management settings, it will be added automatically."],
  ["Department Group", "Same as above — new values are added to the Department Groups list."],
  ["Department Worked", "Values are added to the Departments list (shared with Department)."],
  ["Shift", "New values are added to the Shifts list."],
  ["Shift Allocation", "New values are added to the Shift Allocations list."],
  ["", "This ensures imported values appear correctly in form dropdowns when editing employees."],
];

/**
 * Generate an Excel workbook template with an Employees sheet (headers + 2 example rows)
 * and a Reference sheet (enum values and format notes).
 */
export function generateImportTemplate(): void {
  const headers = getTemplateHeaders();
  const sheetData = [headers, EXAMPLE_ROW_1, EXAMPLE_ROW_2];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const refWs = XLSX.utils.aoa_to_sheet(REFERENCE_SHEET_DATA);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employees");
  XLSX.utils.book_append_sheet(wb, refWs, "Reference");

  XLSX.writeFile(wb, "employee_import_template.xlsx");
}

/** Normalise header for matching: trim and lowercase */
function normaliseHeader(h: string): string {
  return String(h ?? "").trim().toLowerCase();
}

/** Map from normalised header to schema field name */
const HEADER_TO_FIELD = new Map<string, string>(
  IMPORT_COLUMNS.flatMap((c) => {
    const norm = normaliseHeader(c.label);
    const withStar = normaliseHeader(c.label + " *");
    return [
      [norm, c.field],
      [withStar, c.field],
      [normaliseHeader(c.field), c.field],
    ];
  })
);

export interface ParseResult {
  rows: Record<string, unknown>[];
  /** Column headers in the file that could not be matched to any known field */
  unmatchedColumns: string[];
  /** Known field names that were matched from the file headers */
  matchedFields: string[];
}

/**
 * Parse the first sheet of an Excel or CSV file into an array of row objects.
 * First row is treated as headers; each cell is mapped to schema field name.
 * Returns raw values (strings or numbers as in the sheet), plus lists of
 * matched and unmatched column headers.
 */
export function parseImportFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("Failed to read file"));
          return;
        }
        const wb = XLSX.read(data, {
          type: file.name.toLowerCase().endsWith(".csv") ? "string" : "array",
          raw: false,
        });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error("File has no sheets"));
          return;
        }
        const ws = wb.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<string[]>(ws, {
          header: 1,
          defval: "",
        }) as (string | number)[][];
        if (rawRows.length < 2) {
          resolve({ rows: [], unmatchedColumns: [], matchedFields: [] });
          return;
        }
        const headerRow = rawRows[0].map((c) => String(c ?? "").trim());
        const fieldIndexes: { index: number; field: string }[] = [];
        const unmatchedColumns: string[] = [];
        const matchedFields: string[] = [];
        for (let i = 0; i < headerRow.length; i++) {
          const original = headerRow[i];
          if (!original) continue;
          const norm = normaliseHeader(original);
          const field = norm ? HEADER_TO_FIELD.get(norm) : undefined;
          if (field) {
            fieldIndexes.push({ index: i, field });
            matchedFields.push(field);
          } else {
            unmatchedColumns.push(original);
          }
        }
        const rows: Record<string, unknown>[] = [];
        for (let r = 1; r < rawRows.length; r++) {
          const raw = rawRows[r] as (string | number)[];
          const row: Record<string, unknown> = {};
          let hasAny = false;
          for (const { index, field } of fieldIndexes) {
            const val = raw[index];
            if (val !== undefined && val !== null && val !== "") {
              hasAny = true;
            }
            row[field] = val === "" || (val !== undefined && val !== null && String(val).trim() === "")
              ? undefined
              : typeof val === "number" && !Number.isNaN(val)
                ? val
                : String(val).trim();
          }
          if (hasAny) {
            rows.push(row);
          }
        }
        resolve({ rows, unmatchedColumns, matchedFields });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Parse error"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    if (file.name.toLowerCase().endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}
