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
  alternativeNumber: v.optional(v.string()),

  // Address
  resStreetNo: v.string(),
  resStreetName: v.string(),
  resSuburb: v.string(),
  resCity: v.string(),
  resPostCode: v.string(),

  // Work Info
  departmentWorked: v.optional(v.string()),
  deptGroup: v.optional(v.string()),
  shift: v.optional(v.string()),
  shiftAlloc: v.optional(v.string()),
  training: v.optional(v.boolean()),

  // Dates
  dateRegistered: v.optional(v.number()),
  dateEngaged: v.optional(v.number()),

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

### Phase 1: Project Foundation (2-3 days)
- [ ] Initialize Vite + React + TypeScript
- [ ] Configure TailwindCSS
- [ ] Install Shadcn/ui components
- [ ] Set up Convex project
- [ ] Configure Convex Auth
- [ ] Create base schema (organizations, users)
- [ ] Set up React Router
- [ ] Create layout components (AppShell, MobileNav)

### Phase 2: Authentication & Multi-tenancy (3-4 days)
- [ ] Implement Convex Auth (email/password)
- [ ] Create login/signup pages
- [ ] Organization selection/creation flow
- [ ] Role-based permissions system
- [ ] Protected route wrapper
- [ ] User session management

### Phase 3: Employee CRUD & Search (4-5 days)
- [ ] Employee schema with all fields
- [ ] List query with pagination
- [ ] Search by ID number
- [ ] EmployeeList component
- [ ] EmployeeForm (React Hook Form + Zod)
- [ ] Add/Edit/Delete mutations
- [ ] Employee details view

### Phase 4: Barcode/QR Scanner (2 days)
- [ ] Integrate html5-qrcode library
- [ ] BarcodeScanner component
- [ ] Camera permission handling
- [ ] Integration with search

### Phase 5: Image Capture & Storage (3 days)
- [ ] ImageCapture component (camera API)
- [ ] Convex file upload action
- [ ] Image compression
- [ ] Delete image functionality

### Phase 6: Signature Capture (2-3 days)
- [ ] SignatureCapture canvas component
- [ ] Touch/mouse event handling
- [ ] PNG conversion and upload
- [ ] Clear/reset functionality

### Phase 7: Contracts Module (3-4 days)
- [ ] Contracts schema
- [ ] Contract list by employee
- [ ] Contract form with signature
- [ ] Create contract mutation

### Phase 8: Medical Questionnaire (3-4 days)
- [ ] Medical questionnaire schema
- [ ] Status check query
- [ ] Form with conditional fields
- [ ] Dual signature capture (employee + nurse)
- [ ] Create/Edit mutations

### Phase 9: Mobile Optimization & PWA (2-3 days)
- [ ] Touch-friendly form optimization
- [ ] Pull-to-refresh
- [ ] PWA manifest
- [ ] Service worker
- [ ] Loading states and skeletons

### Phase 10: Testing & Deployment (2-3 days)
- [ ] Unit tests for validations
- [ ] Integration tests for Convex functions
- [ ] Manual flow testing
- [ ] Netlify deployment config
- [ ] Documentation

**Total Estimated Duration: 26-34 days**

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
