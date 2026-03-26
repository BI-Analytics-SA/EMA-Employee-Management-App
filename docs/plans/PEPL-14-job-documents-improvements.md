# PEPL-14: Job Document Types, Notifications & Grouped View

## Context

Job documents currently depend on the `documents` module for document types (`organizations.settings.documentTypes`). If the documents module is disabled but jobs is enabled, job document uploads have no types available. Expiry notifications only cover employee documents. The job documents view is a flat list.

This plan addresses three improvements:
1. **Job-specific document types** - independent of the documents module
2. **Module-agnostic expiry notifications** - any module with expiring items contributes
3. **Grouped job documents view** - documents grouped by type with filters and per-group upload

---

## Phase 1: Job Document Types (Schema + Backend)

### Step 1.1: Update Schema

**File:** `convex/schema.ts`

Add `jobDocumentTypes` to `organizations.settings` (after `documentTypes`, ~line 29):

```ts
jobDocumentTypes: v.optional(
  v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      requiresExpiry: v.boolean(),
      color: v.optional(v.string()),
    })
  )
),
```

Add an expiry index to `jobDocuments` table (after `by_organization_job` index, ~line 370):

```ts
.index("by_organization_expiry", ["organizationId", "expiryDate"])
```

### Step 1.2: Add CRUD Mutations for Job Document Types

**File:** `convex/organizations/mutations.ts`

Add three new mutations modeled on the existing `addDocumentType`, `updateDocumentType`, `removeDocumentType`:

1. **`addJobDocumentType`** - Same pattern as `addDocumentType` but operates on `settings.jobDocumentTypes`
2. **`updateJobDocumentType`** - Same pattern as `updateDocumentType` but for `jobDocumentTypes`
3. **`removeJobDocumentType`** - Same pattern as `removeDocumentType` but for `jobDocumentTypes`

**Important:** When patching `settings`, preserve all existing fields including the new `jobDocumentTypes`. Check every existing mutation that patches `settings` (e.g., `addDocumentType`, `updateDocumentType`, `removeDocumentType`, `toggleModule`, `updateContractTemplate`, etc.) and ensure they spread `jobDocumentTypes` through. Search for all `ctx.db.patch(args.organizationId, { settings: ... })` calls and add `jobDocumentTypes: existing.settings?.jobDocumentTypes ?? []` to each spread.

### Step 1.3: Job Document Types Settings Page

**File (NEW):** `src/features/settings/JobDocumentTypesPage.tsx`

Clone `src/features/settings/DocumentTypesPage.tsx` and modify:
- Gate on `useModuleEnabled("jobs")` instead of `"documents"`
- Read from `organization?.settings?.jobDocumentTypes ?? []`
- Call the new `addJobDocumentType`, `updateJobDocumentType`, `removeJobDocumentType` mutations
- Update heading to "Job Document Types"
- Update description to "Define the types of documents that can be uploaded to jobs (e.g. Safety Certificate, Permit, Inspection Report)."

### Step 1.4: Add Route

**File:** `src/routes/index.tsx`

Add route for the new settings page:

```tsx
import { JobDocumentTypesPage } from "@/features/settings/JobDocumentTypesPage";
// Inside the settings routes:
{ path: "job-document-types", element: <JobDocumentTypesPage /> }
```

### Step 1.5: Add Nav Item

**File:** `src/lib/navConfig.ts`

Add to `settingsNavItems` array (after "Doc Types" entry):

```ts
{ label: "Job Doc Types", href: "/settings/job-document-types", icon: FileStack, requiredModule: "jobs" },
```

### Step 1.6: Update Job Document Upload

**File:** `src/features/jobs/pages/JobDocumentUploadPage.tsx`

Change line 64 from:
```ts
const documentTypes = organization?.settings?.documentTypes ?? [];
```
to:
```ts
const documentTypes = organization?.settings?.jobDocumentTypes ?? [];
```

Update the empty-state message (~line 201-205) from:
```
No document types defined. Add them in Settings → Document types.
```
to:
```
No job document types defined. Add them in Settings → Job Doc Types.
```

Also read `?type` query param to pre-select document type:
```ts
const [searchParams] = useSearchParams();
const preselectedType = searchParams.get("type") ?? "";
```
Initialize `documentType` state with `preselectedType` instead of `""`:
```ts
const [documentType, setDocumentType] = useState(preselectedType);
```
Add `useSearchParams` to the react-router-dom import.

---

## Phase 2: Module-Agnostic Expiry Notifications

### Step 2.1: Add Expiring Job Documents Query

**File:** `convex/jobDocuments/queries.ts`

Add a new query `getExpiringByOrganization`:

```ts
export const getExpiringByOrganization = query({
  args: {
    organizationId: v.id("organizations"),
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);
    const daysAhead = args.daysAhead ?? 90;
    const now = Date.now();
    const cutoff = now + daysAhead * 24 * 60 * 60 * 1000;

    const docs = await ctx.db
      .query("jobDocuments")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    return docs.filter((d) => d.expiryDate != null && d.expiryDate <= cutoff);
  },
});
```

Add a second query `getExpiringWithJobs` (similar pattern to `documents/queries.ts` `getExpiringWithEmployees`):

```ts
export const getExpiringWithJobs = query({
  args: {
    organizationId: v.id("organizations"),
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);
    const daysAhead = args.daysAhead ?? 90;
    const now = Date.now();
    const cutoff = now + daysAhead * 24 * 60 * 60 * 1000;

    const docs = await ctx.db
      .query("jobDocuments")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const expiring = docs.filter((d) => d.expiryDate != null && d.expiryDate <= cutoff);

    return Promise.all(
      expiring.map(async (doc) => {
        const job = await ctx.db.get(doc.jobId);
        return { document: doc, job };
      })
    );
  },
});
```

### Step 2.2: Update Header Bell

**File:** `src/components/layout/Header.tsx`

The bell currently only shows for `documentsEnabled`. Change to show when any expiry-capable module is enabled:

```ts
const documentsEnabled = useModuleEnabled("documents");
const jobsEnabled = useModuleEnabled("jobs");
const showExpiryBell = documentsEnabled || jobsEnabled;
```

Query both sources:
```ts
const expiringDocs = useQuery(
  api.documents.queries.getExpiringByOrganization,
  documentsEnabled && organizationId ? { organizationId, daysAhead: 30 } : "skip"
);
const expiringJobDocs = useQuery(
  api.jobDocuments.queries.getExpiringByOrganization,
  jobsEnabled && organizationId ? { organizationId, daysAhead: 30 } : "skip"
);
const expiringCount = (expiringDocs?.length ?? 0) + (expiringJobDocs?.length ?? 0);
```

Change the bell rendering gate from `{documentsEnabled && (` to `{showExpiryBell && (`.

Update the bell link destination to `/expiring-items` (new unified page - see Step 2.3).

### Step 2.3: Unified Expiring Items Page

**File:** `src/features/documents/pages/ExpiringDocumentsPage.tsx`

Rename/refactor to handle both employee documents and job documents:

- Add `jobsEnabled = useModuleEnabled("jobs")` check
- Query `api.jobDocuments.queries.getExpiringWithJobs` when jobs module is enabled
- Add source filter pills: "All", "Employee Documents" (if documents enabled), "Job Documents" (if jobs enabled)
- Merge both lists, sorted by expiry date ascending
- For job document items, link to `/jobs/{jobId}/documents` instead of `/employees/{employeeId}/documents`
- Show a label/badge indicating source: "Employee" or "Job: {jobTitle}"

If only one module is enabled, skip the source filter pills.

### Step 2.4: Update Nav Config

**File:** `src/lib/navConfig.ts`

Update the "Expiring Documents" nav item to show when either module is enabled. Change the `NavItem` interface to support an array:

```ts
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredModule?: "contracts" | "documents" | "exporting" | "jobs";
  /** Show when ANY of these modules is enabled */
  requiredModuleAny?: ("contracts" | "documents" | "exporting" | "jobs")[];
}
```

Update the "Expiring Documents" nav item:
```ts
{ label: "Expiring Items", href: "/expiring-items", icon: AlertTriangle, requiredModuleAny: ["documents", "jobs"] },
```

Remove the old `requiredModule: "documents"` from this item.

**File:** `src/components/layout/Sidebar.tsx`

Update the `filterByModule` function to handle `requiredModuleAny`:
```ts
const filterByModule = (items: typeof mainNavItems) =>
  items.filter((item) => {
    if (item.requiredModuleAny) {
      return item.requiredModuleAny.some((mod) => enabledModules[mod]);
    }
    return !item.requiredModule || enabledModules[item.requiredModule];
  });
```

**File:** `src/routes/index.tsx`

Update the route path from `/documents/expiring` to `/expiring-items` and update the component if renamed.

### Step 2.5: Update Dashboard Stats

**File:** `convex/dashboard/queries.ts`

Hoist `now`, `dayMs`, `futureCutoff` variables out of the `if (documentsEnabled)` block so they're available to both.

Add after the expiring documents block:
```ts
const jobsEnabled = org?.settings?.enabledModules?.jobs === true;
let expiringJobDocumentsCount: number | null = null;
if (jobsEnabled) {
  const jobDocs = await ctx.db
    .query("jobDocuments")
    .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
    .collect();
  expiringJobDocumentsCount = jobDocs.filter((d) => {
    if (d.expiryDate == null) return false;
    return d.expiryDate <= futureCutoff;
  }).length;
}
```

Add `expiringJobDocumentsCount` to the return object.

**File:** `src/features/home/HomePage.tsx`

- Add `const jobsEnabled = useModuleEnabled("jobs");`
- Change the "Expiring Documents" stat card gate from `{documentsEnabled && (` to `{(documentsEnabled || jobsEnabled) && (`
- Combine the value: `(stats.expiringDocumentsCount ?? 0) + (stats.expiringJobDocumentsCount ?? 0)`
- Update label to "Expiring Items"
- Update the Quick Actions "Expiring Documents" button similarly: show when `documentsEnabled || jobsEnabled`, link to `/expiring-items`

---

## Phase 3: Grouped Job Documents View

### Step 3.1: Rewrite JobDocumentsPage

**File:** `src/features/jobs/pages/JobDocumentsPage.tsx`

**Add imports:**
```ts
import { useMemo } from "react";
import { Plus } from "lucide-react";
```

**Add state and data:**
```ts
const { organization } = useCurrentUser(); // add to existing destructure
const jobDocumentTypes = organization?.settings?.jobDocumentTypes ?? [];
const [typeFilter, setTypeFilter] = useState<string>("all");
```

**Group documents by type:**
```ts
const groupedDocs = useMemo(() => {
  if (!documents) return {};
  const groups: Record<string, typeof documents> = {};
  for (const doc of documents) {
    if (!groups[doc.documentType]) groups[doc.documentType] = [];
    groups[doc.documentType].push(doc);
  }
  return groups;
}, [documents]);
```

**Render filter pills** (after the header, before the documents section):
- "All" pill + one pill per `jobDocumentTypes` entry
- Use same pill styling pattern as `JobListPage.tsx` status filter

**Render grouped sections** instead of flat list:
- Loop over `jobDocumentTypes` (filtered by `typeFilter`)
- Each group is a card section with:
  - Header: type name + count + Upload button linking to `/jobs/{jobId}/documents/upload?type={typeId}`
  - Body: list of documents for that type (reuse existing document card JSX)
- Add an "Other" group at the end (only when `typeFilter === "all"`) for documents whose `documentType` doesn't match any configured job doc type

**Keep the top-level "Upload document" button** as a fallback.

---

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `convex/schema.ts` | Add `jobDocumentTypes` to settings, add `by_organization_expiry` index to jobDocuments | 1 |
| `convex/organizations/mutations.ts` | Add 3 job doc type mutations, update all settings merge helpers | 1 |
| `src/features/settings/JobDocumentTypesPage.tsx` | **NEW** - clone of DocumentTypesPage for jobs | 1 |
| `src/routes/index.tsx` | Add route for JobDocumentTypesPage, update expiring route | 1, 2 |
| `src/lib/navConfig.ts` | Add Job Doc Types nav item, update Expiring nav item | 1, 2 |
| `src/features/jobs/pages/JobDocumentUploadPage.tsx` | Use `jobDocumentTypes`, support `?type` param | 1 |
| `convex/jobDocuments/queries.ts` | Add expiry queries | 2 |
| `src/components/layout/Header.tsx` | Unified bell for documents + jobs | 2 |
| `src/components/layout/Sidebar.tsx` | Support `requiredModuleAny` filter | 2 |
| `src/features/documents/pages/ExpiringDocumentsPage.tsx` | Unified expiring items from both modules | 2 |
| `convex/dashboard/queries.ts` | Add job doc expiry stats | 2 |
| `src/features/home/HomePage.tsx` | Combined expiry stat card | 2 |
| `src/features/jobs/pages/JobDocumentsPage.tsx` | Grouped view with filters + per-group upload | 3 |

---

## Verification

1. **Disable documents module, enable jobs module** - verify:
   - Job Doc Types settings page is accessible and functional
   - Job document upload shows job doc types (not document types)
   - Header bell appears and shows expiring job documents count
   - Expiring items page shows job documents only
   - Dashboard shows combined expiry stat

2. **Enable both modules** - verify:
   - Both Doc Types and Job Doc Types settings pages work independently
   - Header bell shows combined count
   - Expiring items page shows both sources with filter pills
   - Dashboard stat combines both counts

3. **Job documents grouped view** - verify:
   - Documents are grouped by job document type
   - Filter pills work correctly
   - Per-group upload button navigates with `?type` param
   - Upload page pre-selects the document type
   - "Other" group catches orphaned documents

4. **Expiry handling** - verify:
   - Job doc types with `requiresExpiry: true` show expiry fields on upload
   - ExpiryBadge shows correct status on job documents
   - Expired/expiring-soon job documents appear in expiring items page and bell count
