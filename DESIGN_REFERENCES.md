# Design References — EMA (Employee Management App)

This document captures inspiration sources, UI patterns to adopt, and current-vs-target notes for each existing page. Use it alongside [DESIGN_SPEC.md](DESIGN_SPEC.md) when implementing the visual overhaul.

---

## Brand Palette (from Pepl logo)

The colour palette is locked to the three colours in the Pepl logo. Full token definitions and CSS variables are in DESIGN_SPEC.md Section 1.

| Logo element | Colour | HSL | Design role |
|-------------|--------|-----|-------------|
| "P" + "e" (left) | **Dark Navy** | `220 70% 22%` | Primary — sidebar bg, primary buttons, headings |
| "p" + "l" (right) | **Sky Blue** | `200 80% 55%` | Accent — active states, links, focus rings, highlights |
| Swoosh figure | **Silver** | `210 15% 72%` | Neutral reference — borders, muted/divider tones |

---

## 1. Inspiration Sources

### Onboardly (primary reference)

**What it is:** An HR/employee management app with an Attendance-focused dashboard. The reference screenshot shows a clean, professional layout with sidebar navigation and a data-heavy list view.

**What to borrow:**

| Element | Description |
|--------|--------------|
| **Sidebar navigation** | Persistent left sidebar (~240px) with logo at top, grouped menu items (Menu, Department, Others), and clear active state (lighter background, bold text). Use the same structure: main nav, then optional grouped sections (e.g. Settings), then user/logout at bottom. Our sidebar uses **dark navy** (`220 70% 22%`) as the background with **sky blue** active states. |
| **Summary stat cards** | Row of 2-4 cards at the top of the page with an icon, main number, label, and optional "vs last week" delta. Rounded corners, subtle shadow, semantic colors (e.g. green for positive, red for negative). |
| **Date / context strip** | Horizontal strip of dates (or filters) with one item selected; arrows and calendar for navigation. Reuse the pattern for "view by date" or "filter by" on list pages. |
| **Search + filter chips** | Full-width search input with rounded corners; to the right, removable filter chips (e.g. "Sort by: X", "Designation: Y") and a "More filters" button. |
| **Avatar-driven table** | Table rows that lead with a circular avatar, then name and key details. Improves scanability for employee/document lists. |
| **Status badges** | Rounded, color-coded badges (e.g. green "On time", red "Late"). Use the same treatment for document status, contract status, or employee state. |
| **Generous rounding** | Cards, inputs, buttons, and badges use a rounder radius (e.g. 12px). Avoid sharp corners. |
| **Whitespace** | Comfortable padding between sections and inside cards; avoid cramped layouts. |
| **Calm color treatment** | Muted backgrounds, clear hierarchy, semantic color only where it adds meaning (status, deltas). |

**What we are not copying:** Onboardly's green/sage colour palette. Our palette is derived from the **Pepl logo** (dark navy, sky blue, silver). We also do not replicate the "Attendance" domain; we focus on existing pages: employees, contracts, documents, settings.

---

### Additional references (for comparison)

- **Linear (linear.app)** — Sidebar + content layout, clean typography, subtle borders and shadows. Good reference for desktop app density and header/content balance. Note: Linear uses a **dark sidebar** pattern similar to our dark-navy sidebar.
- **Notion** — Sidebar with collapsible sections, simple iconography, and card-based content blocks. Useful for settings and nested navigation patterns.
- **Vercel Dashboard** — Minimal UI, strong use of neutral grays and one accent, clear table and list patterns. Good for data-heavy admin views.

Use these for layout and density decisions rather than literal visual copy.

---

## 2. UI Patterns to Adopt

Apply these patterns consistently across the app. Colour references use the Pepl palette (see DESIGN_SPEC.md Section 1).

### Employee List page

- **Stat cards row** — e.g. "Total employees", "New this month", "Expiring documents", "Pending contracts". Same component pattern as Onboardly: icon, number, label, optional delta. Card icons use **sky blue** (`accent`) for positive metrics and semantic colours for warnings/errors.
- **Search bar** — Prominent, rounded; placeholder e.g. "Search by name or ID". Focus ring in **sky blue** (`ring`).
- **Filter chips** — e.g. "Sort by: Newest", "Department: X". Chips are removable (X); "More filters" opens a popover or sheet. Active chip uses `bg-accent/10 text-accent`.
- **Table** — Columns: avatar, name, ID/role, status (badge), actions. Avatar-driven rows; row hover state; min row height for touch.
- **Pagination** — Bottom-right: "N per page" selector + page numbers; current page with **dark navy** (`primary`) background.

### Employee Detail page

- **Profile header card** — Large card at top: avatar (or placeholder), full name, subtitle (e.g. employee number, role). Primary actions on the right (Edit, Capture image, etc.) using **dark navy** primary buttons. Rounded, light shadow.
- **Sectioned info cards** — Below the header, 2-3 cards in a responsive grid (e.g. Personal, Contact, Employment). Each card: muted header strip, then label/value rows. Reuse existing section card pattern from CONVERSION_PLAN.

### Forms (Add Employee, Edit Employee, New Contract, etc.)

- **Card-based sections** — One card per logical group (Personal, Address, Contract details, ...). Section header: `bg-muted/70`, border-b, semibold title. Body: consistent padding and field grid.
- **Field sizing** — Min heights for touch (e.g. 40px); min widths so labels/values don't truncate on small screens (see DESIGN_SPEC and CONVERSION_PLAN field wrapper rules).
- **Sticky footer** — Submit (primary / dark navy) + Cancel (outline) in a bar at bottom on desktop; full-width on mobile.

### Settings

- **Single source of nav** — All settings entries (Team, Doc Types, Modules, Contract template, Export config) live in the main sidebar under a "Settings" group (admin-only). No separate settings sidebar; each route renders one settings panel.
- **Panel layout** — Each settings page: page title, short description if needed, then form or list in cards. Keep consistent with form page pattern (card sections, clear actions).

### Documents (list and upload)

- **Consistent card layout** — Document list and upload views use the same card style as the rest of the app (rounded, border, shadow-sm or shadow-card). Use badges for status (e.g. expiring soon, expired).
- **Empty states** — Icon (sky blue) + short message + primary action when there's no data.

---

## 3. Current vs. Target Notes

For each existing page or area, what changes when applying the design spec and references.

| Page / Area | Current | Target |
|-------------|---------|--------|
| **App shell / layout** | Top header with horizontal nav (desktop); bottom tab bar (mobile); hamburger opens sheet with same nav. | **Dark navy sidebar** on desktop (fixed ~240px) with Pepl logo + sky-blue active states; on mobile, hamburger opens **Sheet** with same sidebar content; **no bottom nav**. Single `navConfig`; new `Sidebar` component. |
| **Header** | Global header with title "Employee Management", nav links, email, logout. | **Page-level header** inside content area only: optional breadcrumb, page title (or passed from route), search (where relevant), user avatar + logout. No nav links in header. |
| **EmployeeListPage** | List/table of employees with search and actions. | Add **stat cards** row (e.g. total, new, expiring). **Search** (sky-blue focus ring) + **filter chips** + "More filters". Table with **avatar** in first column, **status badge** where applicable. **Pagination** with dark-navy active page. |
| **EmployeeDetailPage** | Detail view with sections. | **Profile header card** (avatar, name, subtitle, Edit/Capture/other actions). Section cards below with muted header and label/value rows. Consistent spacing and radius. |
| **AddEmployeePage / EditEmployeePage** | Form with sections. | **Card-based sections** per logical group; section headers `bg-muted/70`. Field min heights and widths per DESIGN_SPEC. **Sticky footer** with dark-navy Submit + outline Cancel. |
| **ContractListPage** | List of contracts (e.g. per employee). | Same list pattern: optional stat or summary, search/filters, **avatar-driven** or clear table with **status badges**. Pagination if list is long. |
| **ContractDetailPage / NewContractPage** | Contract view/form. | Same form pattern: section cards, sticky footer. Use **status badges** for contract state where relevant. |
| **EmployeeDocumentsPage** | Document list for an employee. | **Card layout** for document list; **badges** for expiry status. Empty state: icon + message + "Upload" CTA. |
| **DocumentUploadPage** | Upload UI for documents. | Same **card** and **form** patterns; clear primary action and cancel. |
| **ExpiringDocumentsPage** | List of expiring documents. | Optional **stat cards** (e.g. expiring in 7/30/90 days). Table or card list with **avatar** (if by employee) and **expiry badges**. Filters/chips if needed. |
| **CaptureImagePage** | Image capture for employee. | Keep flow; ensure **buttons and touch targets** meet 44px min; use **card** for preview/instructions. |
| **Settings (Team, Doc Types, Modules, Contract template, Export config)** | Each page has its own layout. | **Sidebar** contains all settings links under one group. Each settings page: title, optional description, **card-based** form or list. Consistent spacing and typography. |
| **OnboardingPage** | Onboarding flow for new users. | Use **card** and **button** tokens; keep flow simple; ensure touch targets and readability. |
| **SignInPage** | Login form. | Use **card** for the form container; **input** and **button** tokens from DESIGN_SPEC. Centred, minimal layout. Optional Pepl logo above the form. |

---

## Summary

- The **Pepl logo** (dark navy, sky blue, silver) defines the brand palette. See DESIGN_SPEC.md Section 1 for all tokens and CSS variables.
- **Onboardly** is the main layout/UX reference for sidebar, stat cards, search + filter chips, avatar-driven tables, status badges, and the overall calm, rounded aesthetic.
- **Patterns to adopt** are summarised in Section 2 and reflected in DESIGN_SPEC (layout, components, page patterns).
- **Current vs. target** notes in Section 3 give a per-page checklist for the global UI refresh (Phase 13.4) and for any incremental redesign work.

Use DESIGN_SPEC.md for tokens and code-level decisions; use this document for "what to borrow" and "what to change" on each screen.
