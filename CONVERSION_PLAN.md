# CararaRegistrations - Retool to React Conversion Plan

## Project Overview

**Current State:** Retool Mobile App (Toolscript export)
**Target State:** Mobile-friendly React Web Application (Multi-tenant SaaS)

### Application Summary
An Employee Registration Management System for onboarding and HR management featuring:
- Employee registration and profile management
- Image capture and storage (ID photos)
- Employment contract management with signatures
- Medical questionnaire tracking
- QR/Barcode scanning for employee lookup

### Multi-Tenant Requirements
- **Organization-based:** Multiple customers (organizations) sharing one backend
- **Role-based access:** Admin, Manager, Nurse, User roles per organization
- **Data isolation:** Each organization sees only their data

---

## Final Tech Stack Decision

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Vite + React 18 + TypeScript | Fast builds, modern DX |
| **Styling** | TailwindCSS + Shadcn/ui | Mobile-friendly, customizable |
| **Backend** | Convex | Real-time, TypeScript-first, built-in file storage |
| **Auth** | Convex Auth | Built-in, supports email/password + OAuth |
| **File Storage** | Convex File Storage | Unified billing, no S3 needed |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Routing** | React Router v6 | Standard React routing |
| **Deployment** | Netlify (frontend) + Convex Cloud (backend) | Simple, serverless |

---

## Convex Schema Design

### Organizations (Multi-tenant Root)
```typescript
organizations: defineTable({
  name: v.string(),
  slug: v.string(),
  settings: v.optional(v.object({
    departments: v.array(v.string()),
    deptGroups: v.array(v.string()),
    shifts: v.array(v.string()),
    shiftAllocations: v.array(v.string()),
  })),
  createdAt: v.number(),
}).index("by_slug", ["slug"]),
```

### Users (Auth + Roles)
```typescript
users: defineTable({
  organizationId: v.id("organizations"),
  email: v.string(),
  name: v.string(),
  role: v.union(
    v.literal("admin"),
    v.literal("manager"),
    v.literal("nurse"),
    v.literal("user")
  ),
  isActive: v.boolean(),
  createdAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_email", ["email"]),
```

### Employees (Primary Entity)
```typescript
employees: defineTable({
  organizationId: v.id("organizations"),

  // Identification
  idNumber: v.string(),        // SA ID (13 digits)
  employeeNo: v.optional(v.string()),

  // Personal Info
  title: v.union(v.literal("MR"), v.literal("MISS")),
  initials: v.string(),
  firstName: v.string(),
  secondName: v.optional(v.string()),
  lastName: v.string(),
  knownAs: v.string(),
  dateOfBirth: v.number(),
  gender: v.union(v.literal("M"), v.literal("F")),
  ethnicGroup: v.union(v.literal("A"), v.literal("C"), v.literal("W"), v.literal("I"), v.literal("B")),

  // Contact
  cellNumber: v.string(),

  // Address
  resStreetNo: v.string(),
  resStreetName: v.string(),
  resSuburb: v.string(),
  resCity: v.string(),
  resPostCode: v.string(),

  // Status & Dates
  dateRegistered: v.optional(v.number()),
  dateEngaged: v.optional(v.number()),
  taxNumber: v.optional(v.string()),
  certificate: v.optional(v.string()),

  // Image (Convex file storage)
  imageStorageId: v.optional(v.id("_storage")),
  imageUrl: v.optional(v.string()),

  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.id("users"),
})
  .index("by_organization", ["organizationId"])
  .index("by_organization_idNumber", ["organizationId", "idNumber"])
  .searchIndex("search_employee", {
    searchField: "idNumber",
    filterFields: ["organizationId"],
  }),
```

### Contracts
```typescript
contracts: defineTable({
  organizationId: v.id("organizations"),
  employeeId: v.id("employees"),

  nameSurname: v.string(),
  idNumber: v.string(),
  signedDate: v.number(),
  startDate: v.number(),
  season: v.string(),
  bootsAmount: v.string(),
  employeeNo: v.string(),

  training: v.boolean(),
  deptGroup: v.string(),
  shift: v.string(),
  shiftAlloc: v.string(),

  signatureStorageId: v.optional(v.id("_storage")),
  signatureUrl: v.optional(v.string()),

  createdAt: v.number(),
  createdBy: v.id("users"),
})
  .index("by_organization", ["organizationId"])
  .index("by_employee", ["employeeId"]),
```

### Medical Questionnaires
```typescript
medicalQuestionnaires: defineTable({
  organizationId: v.id("organizations"),
  employeeId: v.id("employees"),

  // Health Questions
  illnessLastTwoYears: v.boolean(),
  illnessLastTwoYearsDetail: v.optional(v.string()),
  treatedTB: v.boolean(),
  treatedTBDetail: v.optional(v.string()),
  onTreatmentNow: v.boolean(),
  hepatitusA: v.boolean(),
  hepatitusB: v.boolean(),
  bloodPressure: v.boolean(),
  diabetes: v.boolean(),
  longTerm: v.boolean(),
  longTermDetail: v.optional(v.string()),
  reasonCantComplete: v.string(),
  notes: v.optional(v.string()),

  // Signatures
  emplSignatureStorageId: v.optional(v.id("_storage")),
  emplSignatureUrl: v.optional(v.string()),
  nurseSignatureStorageId: v.optional(v.id("_storage")),
  nurseSignatureUrl: v.optional(v.string()),

  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.id("users"),
})
  .index("by_organization", ["organizationId"])
  .index("by_employee", ["employeeId"]),
```

---

## Project Structure

```
EMA - Employee Management App/
├── convex/
│   ├── _generated/           # Auto-generated types
│   ├── schema.ts             # Database schema
│   ├── auth.ts               # Convex Auth config
│   ├── organizations/
│   │   ├── queries.ts
│   │   └── mutations.ts
│   ├── users/
│   │   ├── queries.ts
│   │   └── mutations.ts
│   ├── employees/
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   └── actions.ts        # File upload actions
│   ├── contracts/
│   │   ├── queries.ts
│   │   └── mutations.ts
│   ├── medicalQuestionnaires/
│   │   ├── queries.ts
│   │   └── mutations.ts
│   └── lib/
│       ├── auth.ts           # Auth helpers
│       └── permissions.ts    # RBAC logic
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── ui/               # Shadcn/ui components
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Header.tsx
│   │   └── shared/
│   │       ├── SignatureCapture.tsx
│   │       ├── BarcodeScanner.tsx
│   │       ├── ImageCapture.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── AuthProvider.tsx
│   │   ├── employees/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   ├── contracts/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   └── medical/
│   │       ├── components/
│   │       └── pages/
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOrganization.ts
│   │   └── usePermissions.ts
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   └── validations/
│   │       ├── employee.ts
│   │       ├── contract.ts
│   │       └── medical.ts
│   │
│   ├── routes/
│   │   └── index.tsx
│   │
│   └── styles/
│       └── globals.css
│
├── public/
│   └── manifest.json         # PWA manifest
│
├── CararaRegistrations/      # Retool export (reference)
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── CONVERSION_PLAN.md        # This file
```

---

## Implementation Phases

### Phase 1: Project Foundation (2-3 days) ✅
- [x] Initialize Vite + React + TypeScript
- [x] Configure TailwindCSS
- [x] Install Shadcn/ui components
- [x] Set up Convex project
- [x] Configure Convex Auth
- [x] Create base schema (organizations, users)
- [x] Set up React Router
- [x] Create layout components (AppShell, MobileNav)

### Phase 2: Authentication & Multi-tenancy (3-4 days) ✅
- [x] Implement Convex Auth (email/password)
- [x] Create login/signup pages
- [x] Organization selection/creation flow
- [x] Role-based permissions system
- [x] Protected route wrapper
- [x] User session management

### Phase 3: Employee CRUD & Search (4-5 days) ✅
- [x] Employee schema with all fields
- [x] List query with pagination
- [x] Search by ID number
- [x] EmployeeList component
- [x] EmployeeForm (React Hook Form + Zod)
- [x] Add/Edit/Delete mutations
- [x] Employee details view

### Phase 4: Barcode/QR Scanner (2 days) ✅
- [x] Integrate html5-qrcode library
- [x] BarcodeScanner component
- [x] Camera permission handling
- [x] Integration with search

### Phase 5: Image Capture & Storage (3 days) ✅
- [x] ImageCapture component (camera API)
- [x] Convex file upload action
- [x] Image compression
- [x] Delete image functionality

### Phase 6: Signature Capture (2-3 days) ✅
- [x] SignatureCapture canvas component
- [x] Touch/mouse event handling
- [x] PNG conversion and upload
- [x] Clear/reset functionality

### Phase 7: Contracts Module (3-4 days) ✅
- [x] Contracts schema
- [x] Contract list by employee
- [x] Contract form with signature
- [x] Create contract mutation

### Phase 8: Medical Questionnaire (3-4 days) ⏭️ *Optional — deferred to a later stage*
- [ ] Medical questionnaire schema
- [ ] Status check query
- [ ] Form with conditional fields
- [ ] Dual signature capture (employee + nurse)
- [ ] Create/Edit mutations

### Phase 9: Employee Details Export to Excel (2-3 days) ✅
- [x] Export config in organization settings (column definitions, renames, custom fields)
- [x] Settings page for column management (drag-and-drop reorder, rename, add custom, data types)
- [x] listAll employee query for export
- [x] Export to Excel button on Employee List page
- [x] Client-side xlsx generation with configurable columns and default values

### Phase 10: Mobile Optimization & PWA (2-3 days) ✅
- [x] Touch-friendly form optimization
- [x] Pull-to-refresh
- [x] PWA manifest
- [x] Service worker
- [x] Loading states and skeletons

### Phase 11: Testing & Deployment (2-3 days)
- [ ] Unit tests for validations
- [ ] Integration tests for Convex functions
- [ ] Manual flow testing
- [ ] Netlify deployment config
- [ ] Documentation

### Phase 12: *(Reserved)*

### Phase 13: Design Specification & Visual Overhaul (5-7 days)

#### 13.1 — Design Specification Document ✅
- [x] Create `DESIGN_SPEC.md` with full visual language definition
- [x] Define colour palette (primary, secondary, accent, neutrals, semantic colours)
- [x] Define typography scale (font families, sizes, weights, line-heights for mobile & desktop)
- [x] Define spacing & sizing tokens (padding, margins, border-radius, elevation/shadow)
- [x] Define iconography style and icon set (Lucide React)
- [x] Document component-level design tokens (buttons, inputs, cards, modals, toasts, etc.)

#### 13.2 — Reference & Inspiration ✅
- [x] Curate list of reference websites/apps to mimic (Onboardly, Linear, Notion, Vercel — with notes on what to borrow)
- [x] Create current vs. target design comparison notes (per-page table in DESIGN_REFERENCES.md Section 3)
- [x] Document specific UI patterns to adopt (sidebar nav, stat cards, filter chips, avatar-driven tables, status badges, card layouts)
- [x] Collect comparison screenshots of current app state (mobile + desktop)

#### 13.3 — Mobile Field Sizing & Text Overflow Audit ⚠️ *(partial)*
- [x] Audit all input fields for minimum width so labels and values are never truncated (field min-widths enforced in EmployeeForm)
- [x] Audit select/dropdown fields on mobile — verify readability of options (selects use h-11 / 44px)
- [x] Document minimum field widths per field type and enforce via Tailwind utilities / CSS variables (in DESIGN_SPEC + CONVERSION_PLAN)
- [x] Sidebar nav items meet 44px minimum touch target (min-h-[44px])

#### 13.4 — Global UI Refresh ✅
- [x] Update Tailwind theme config (`tailwind.config.js`) with new design tokens (sidebar, success, warning colours, Inter font, shadow-card, border-radius)
- [x] Update Shadcn/ui theme (CSS variables in `globals.css`) to match spec (both :root and .dark)
- [x] Add Inter font via Google Fonts in `index.html`
- [x] Create new `Sidebar.tsx` component with dark navy background and sky-blue active states
- [x] Create `src/lib/navConfig.ts` — single nav config for sidebar and mobile sheet
- [x] Remove `MobileNav.tsx` — navigation now lives only in Sidebar / Sheet
- [x] Refine AppShell to sidebar + content layout (Sidebar on desktop, Sheet on mobile)
- [x] Update Header to page-level header inside content area
- [x] Update all form components to match new sizing and spacing standards
- [x] Update all card / section components for consistent look across pages

#### 13.5 — Home / Landing Page Redesign ✅
- [x] Design a dashboard-style landing page (post-login) with at-a-glance stats and quick actions
- [x] Add welcome message with user name / role
- [x] Add summary cards (total employees, expiring documents, contracts, pending invites)
- [x] Add quick-action buttons (Add Employee, View Employees, Export, Expiring Documents)
- [x] Add recently added employees list (last 5, with avatar, name, ID, date)
- [x] Ensure landing page is responsive and looks great on mobile and desktop

**Total Estimated Duration: 33-44 days**

---

## Screen/Route Mapping

| Retool Screen | React Route | Component |
|--------------|-------------|-----------|
| People List | `/` or `/employees` | EmployeeListPage |
| People Details | `/employees/:id` | EmployeeDetailPage |
| Edit Employee | `/employees/:id/edit` | EditEmployeePage |
| Add Employee | `/employees/new` | AddEmployeePage |
| Capture Image | `/employees/:id/capture` | CaptureImagePage |
| Contract List | `/employees/:id/contracts` | ContractListPage |
| New Contract | `/employees/:id/contracts/new` | NewContractPage |
| Medical Status | `/employees/:id/medical` | MedicalStatusPage |
| New Medical | `/employees/:id/medical/new` | NewMedicalPage |
| Edit Medical | `/employees/:id/medical/edit` | EditMedicalPage |

---

## Key Technical Decisions

### Multi-tenancy Approach
Every query/mutation enforces organization scope:
```typescript
export async function requireOrganizationAccess(ctx, organizationId) {
  const user = await getAuthenticatedUser(ctx);
  if (user.organizationId !== organizationId) {
    throw new Error("Access denied");
  }
  return user;
}
```

### Barcode Scanning
Library: `html5-qrcode` - lightweight, well-maintained, MIT license

### Signature Capture
Native HTML5 Canvas - no external dependencies, full touch support

### Form Validation
Zod schema for 13-digit SA ID validation, required fields, etc.

---

## UI/UX Design Standards

### Layout Philosophy
Use **flex-wrap responsive layouts** that adapt dynamically to screen width. Sections flow horizontally until they can't fit, then wrap to the next row. This maximizes screen real estate on large displays while remaining mobile-friendly.

### Section Cards
All form sections and detail cards use consistent styling:
```tsx
// Section container classes
const sectionClass = "rounded-lg border bg-card overflow-hidden";
const sectionHeaderClass = "bg-muted/70 px-3 py-2 border-b";
const sectionTitleClass = "text-sm font-semibold text-foreground";
const sectionContentClass = "p-3";

// Card sizing for flex-wrap
className={`${sectionClass} w-full sm:w-auto sm:min-w-[Xpx] sm:flex-1`}
```

### Form Fields
- **Inputs:** Height `h-9` for compact forms
- **Labels:** Text size `text-xs` for density
- **Field wrappers:** Use flex with min-widths:
  - Standard fields: `min-w-[100px] flex-1`
  - Date fields: `min-w-[160px] flex-1` (calendar icon needs space)
  - Wide fields: `min-w-[140px] flex-1`
  - Narrow fields: `min-w-[70px] flex-1 max-w-[100px]`

### Detail Pages (Dashboard Style)
1. **Header card:** Photo placeholder + name/summary + action buttons
2. **Info cards grid:** Flex-wrap sections below the header
3. Use `InfoRow` pattern for consistent label/value display

### Key Patterns
- Container: `flex flex-wrap gap-3` for section grids
- Inner fields: `flex flex-wrap gap-2` within sections
- Mobile-first: `w-full` then `sm:w-auto sm:flex-1` for responsive
- Prominent headers: `bg-muted/70` background with border

---

## Critical Files to Create First

1. **`convex/schema.ts`** - Database schema (foundation)
2. **`convex/lib/permissions.ts`** - Multi-tenancy RBAC
3. **`src/lib/validations/employee.ts`** - Zod schemas
4. **`src/components/shared/SignatureCapture.tsx`** - Reusable signature
5. **`src/features/employees/components/EmployeeForm.tsx`** - Main form pattern

---

## Verification Plan

### During Development
- Convex dashboard for real-time data inspection
- Browser DevTools for React components
- Convex function logs for debugging

### Post-Implementation Testing
1. **Auth Flow:** Login, logout, role switching
2. **Employee CRUD:** Create, view, edit, delete employee
3. **Search:** ID number search + barcode scan
4. **Image:** Capture, view, delete employee photo
5. **Contracts:** Create contract with signature
6. **Medical:** Create and edit questionnaire
7. **Multi-tenant:** Verify data isolation between orgs
8. **Mobile:** Test on actual mobile devices
9. **PWA:** Install as app, test offline behavior

---

## Deployment Checklist

### Convex
- [ ] Create production deployment
- [ ] Set environment variables
- [ ] Enable production auth

### Netlify
- [ ] Connect GitHub repo
- [ ] Configure build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Add environment variables
- [ ] Configure redirects for SPA routing

---

## Reference Material

The original Retool app export is preserved in the `CararaRegistrations/` folder for reference during development.
