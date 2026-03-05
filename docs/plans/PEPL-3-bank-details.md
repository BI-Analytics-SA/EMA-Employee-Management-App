# PEPL-3: Add Bank Detail Fields to Employee

## Context
The Employee table currently has no banking information. Users need to capture and view bank details for payroll purposes. All new fields must be **optional** so existing employees continue working without any data loss or migration.

## Fields to Add

| Field | Type | Values |
|-------|------|--------|
| payMethod | Dropdown | `02` = "02.Cash", `03` = "03.Electronic Payment" |
| bankAccType | Dropdown | `S` = "S.Savings", `C` = "C.Cheque" |
| bankAccNo | Text | Free text |
| bankName | Dropdown | Absa Bank, African Bank, African Bank Business, Bidvest-Old Mutual, Capitec Bank, Discovery Bank, First National Bank, Grindrod Bank, Nedbank, Standard Bank, Tyme Bank |
| branchCode | Auto-populated | Read-only, derived from bankName (see mapping below) |
| accHolder | Text | Free text |
| accRelationship | Dropdown | `O` = "O.Own", `T` = "T.3rd Party" |

**Branch Code Mapping:**
Absa=632005, African Bank=430000, African Bank Business=430000, Bidvest-Old Mutual=462005, Capitec=470010, Discovery=679000, FNB=250655, Grindrod=223626, Nedbank=198765, Standard Bank=051001, Tyme Bank=678910

## Implementation Steps

### 1. Create constants file: `src/lib/constants/bankDetails.ts` (NEW)
- Export `PAY_METHODS`, `BANK_ACC_TYPES`, `BANK_NAMES`, `BRANCH_CODES`, `ACC_RELATIONSHIPS` arrays/maps
- Single source of truth for form and detail page

### 2. Update schema: `convex/schema.ts` (line ~178, after `certificate`)
- Add 7 `v.optional()` fields in a `// Banking Details` block
- `payMethod`: `v.optional(v.union(v.literal("02"), v.literal("03")))`
- `bankAccType`: `v.optional(v.union(v.literal("S"), v.literal("C")))`
- `bankAccNo`: `v.optional(v.string())`
- `bankName`: `v.optional(v.string())`
- `branchCode`: `v.optional(v.string())`
- `accHolder`: `v.optional(v.string())`
- `accRelationship`: `v.optional(v.union(v.literal("O"), v.literal("T")))`

### 3. Update mutations: `convex/employees/mutations.ts`
- Add validators: `payMethodValidator`, `bankAccTypeValidator`, `accRelationshipValidator`
- Add 7 optional fields to `createArgs` (line ~45)
- Add 7 optional fields to `update` args (line ~111)
- Add 7 field names to `allowedKeys` array (line ~144)

### 4. Update Zod validation: `src/lib/validations/employee.ts`
- Add `payMethodEnum`, `bankAccTypeEnum`, `accRelationshipEnum`
- Add 7 optional fields to `employeeFormSchema`
- **Important**: Transform empty strings to `undefined` for enum fields so Convex validators don't reject `""`

### 5. Update form: `src/features/employees/components/EmployeeForm.tsx`
- Import constants from `bankDetails.ts`
- Add bank fields to `employeeToFormValues()` (line ~68)
- Add `useEffect` watching `bankName` to auto-set `branchCode` via `setValue`
- Add new "Banking Details" `<section>` after Dates section (line 304)
  - 4 dropdowns: payMethod, bankName, bankAccType, accRelationship
  - 2 text inputs: bankAccNo, accHolder
  - 1 read-only input: branchCode (with `bg-muted` styling)
  - All dropdowns include blank "— Select —" option

### 6. Update detail page: `src/features/employees/pages/EmployeeDetailPage.tsx`
- Import constants, create label lookup maps
- Add "Banking Details" section card (after Dates, line 223, before Documents)
- Use existing `InfoRow` component for each field with friendly labels

### 7. Update export config: `src/features/settings/ExportConfigPage.tsx`
- Add 7 entries to `DEFAULT_DATABASE_COLUMNS` after `certificate` (line 60)
- Set `enabled: false` by default (bank details are sensitive)

## Key Design Decisions
- All fields `v.optional()` — zero risk to existing data
- Store `branchCode` in DB (not just derive on read) — needed for exports and queries
- `bankName` stored as plain string (not union literal) — easier to extend bank list later
- Empty string → `undefined` transform in Zod — prevents Convex union validator errors
- Export columns disabled by default — users opt-in to exporting bank details

## Verification
1. Run `npx convex dev` — schema should deploy without errors
2. Create a new employee with bank details filled → verify all fields save
3. Edit existing employee (no bank details) → verify form loads without errors, bank section empty
4. View employee detail → Banking Details section shows populated fields
5. Select a bank name → branch code auto-populates
6. Clear bank name → branch code clears
7. Export config page → 7 new columns visible (disabled by default)
