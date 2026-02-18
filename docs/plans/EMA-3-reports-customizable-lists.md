# Plan: EMA-3 – Reports (Customizable Lists)

**Beads:** EMA - Employee Management App-3 · **GitHub:** #10  
**Summary:** A separate Reports area. First report: Employee Report — customizable columns (persisted in Convex) and quick link to edit. More report types can be added later. Full test coverage: Vitest + RTL + Playwright E2E.

---

## Decisions (confirmed)

- **Separate page:** Not the existing Employee List. New "Reports" area; first report = Employee Report. Current `/employees` list is unchanged.
- **Persistence:** Column selection stored in **Convex** (per user, so it syncs across devices). No localStorage.
- **Quick link to edit:** Each row has an explicit Edit action linking to `/employees/:id/edit`. Row click can go to detail or stay on report (TBD: row → detail vs row → no nav; Edit → edit page).
- **Tests:** Vitest + React Testing Library for component/unit tests; Playwright for E2E. All options.

---

## Sub-issues (track in Beads; close as completed)

| # | Deliverable | Notes |
|---|-------------|--------|
| 1 | Design doc + Convex schema for report column preferences | This doc; new table or `userProfiles` extension for `reportColumns` (reportId → column ids). |
| 2 | Employee Report page | New route (e.g. `/reports/employees`), nav entry under Menu, page shell with title and placeholder table. |
| 3 | Column picker UI + Convex read/write | Define listable employee columns; UI to toggle columns; query/mutation to get/set selected columns for current user + report. |
| 4 | Report table + Edit link | Table renders only selected columns; each row has Edit link to `/employees/:id/edit`. |
| 5 | Vitest + RTL tests | Column visibility, persistence (Convex), Edit link present and correct. |
| 6 | Playwright E2E setup + E2E test | Install Playwright; one E2E test: open Employee Report, change columns, verify table; click Edit, verify navigate to edit page. |

---

## Current state (brief)

- **Employee list:** [src/features/employees/pages/EmployeeListPage.tsx](src/features/employees/pages/EmployeeListPage.tsx) — fixed columns (Employee, ID Number, Employee #); row links to detail. Unchanged.
- **Nav:** [src/lib/navConfig.ts](src/lib/navConfig.ts) — Home, Employees, Expiring Documents. Add "Reports" or direct "Employee Report" entry.
- **Schema:** [convex/schema.ts](convex/schema.ts) — no report/preferences table yet. Prefer a small `reportColumnPreferences` table (userId, reportId, columnIds) or a field on `userProfiles`.
- **Tests:** No Vitest or Playwright in repo yet.

---

## Implementation outline

### 1. Convex: store column preferences

- **Option A – New table `reportColumnPreferences`:**  
  `(userId: id("userProfiles"), reportId: string, columnIds: array of string)`. One row per user per report. Index by `(userId, reportId)`.
- **Option B – Extend `userProfiles`:**  
  Add optional `reportColumnPreferences: optional(object({ [reportId]: array of string }))`. Simpler but pushes schema into a single table.
- **Recommendation:** Option A for clear schema and easy addition of more report types.
- **API:** Query `getReportColumnPreferences(userId, reportId)`; mutation `setReportColumnPreferences(userId, reportId, columnIds)`. Server derives `userId` from auth (require auth in mutation/query).

### 2. Routes and nav

- Add route: `/reports/employees` (or `/reports` with first tab = Employees). Component: `EmployeeReportPage` in e.g. `src/features/reports/pages/EmployeeReportPage.tsx`.
- Nav: Add "Employee Report" or "Reports" in [src/lib/navConfig.ts](src/lib/navConfig.ts). If "Reports" with sub-items later, could use a single "Employee Report" link for now.

### 3. Listable columns (Employee Report)

- Define a constant list of column definitions: `id`, `label`, `field` (or accessor). E.g. Name (composite), ID Number, Employee #, Cell number, Date of birth, Date engaged, Date registered, etc. Use employee schema fields that are safe and useful in a list.
- Default selection: e.g. Name, ID Number, Employee # (match current list).

### 4. Column picker UI

- Button or control "Columns" that opens a popover/dropdown with checkboxes (or multi-select) for each column. Load preferences from Convex; on change, call mutation to save. Table re-renders from same preference source.

### 5. Table and Edit link

- Table header and cells driven by `columnIds` from Convex (with fallback to default). Each row: data cells for selected columns; last cell or action column: "Edit" link to `/employees/:id/edit`.

### 6. Tests

- **Vitest + RTL:** Render `EmployeeReportPage` (or container with column picker + table). Test: column picker shows/hides columns; mock Convex to return/save preferences; assert Edit link `href` per row.
- **Playwright:** Log in (if auth required), go to `/reports/employees`, open column picker, toggle a column, assert table content; click Edit on first row, assert URL is `/employees/:id/edit`.

---

## Resumability

- Sub-issues are independent where possible: 1 → 2 → 3 → 4 (order); 5 and 6 can be done after 4 or in parallel. Close each sub-issue when done; when all are closed, close EMA-3. If the work spans sessions, pick up by running `bd ready` or `bd list --status=open` and continuing the next open sub-issue.
