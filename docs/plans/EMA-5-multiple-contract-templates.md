# Plan: EMA-5 – Multiple Contract Templates

**Beads:** EMA - Employee Management App-5 · **GitHub:** #8  
**Summary:** Add the ability to set up multiple contract templates per organization. Each template has a name, full set of fields, and its own employer signature. One template is always the Default; when creating a contract, the user selects a template and that template’s defaults are applied.

---

## Decisions (confirmed)

- **Template naming**: Each template has a name (e.g. "Permanent", "Fixed-term"). Users can create as many templates as they like.
- **Default template**: There is always a Default template. Orgs that only need one contract type do not need to create any extra templates; they use the default.
- **Per-template data**: All contract-template data is per template: fields (company name, heading, category, terms) and employer signature. No org-wide shared signature.
- **New contract flow**: User selects a template, then the form is prefilled with that template’s defaults (same behaviour as today, but with a template picker).
- **Contract document (Option B — snapshot)**: At creation time, copy onto the contract the chosen template’s **company name** and **employer signature** (URL or storage id). The contract record is the single source of truth for viewing and PDF: view/PDF always use the contract’s stored values. Editing or removing a template never affects existing contracts.

---

## Current state (brief)

- **Schema**: [convex/schema.ts](convex/schema.ts) — `organizations.settings.contractTemplate` is a single optional object (companyName, contractHeading, contractCategory, defaultTermsAndConditions, employerSignatureStorageId, employerSignatureUrl).
- **Settings**: [src/features/settings/ContractTemplatePage.tsx](src/features/settings/ContractTemplatePage.tsx) — one form for that single template and one employer signature.
- **New contract**: [src/features/employees/pages/NewContractPage.tsx](src/features/employees/pages/NewContractPage.tsx) — uses `organization?.settings?.contractTemplate` to prefill [ContractForm](src/features/contracts/components/ContractForm.tsx). No template selection.
- **Contract document**: [convex/schema.ts](convex/schema.ts) — `contracts` table has no template reference; [ContractDetailPage](src/features/employees/pages/ContractDetailPage.tsx) reads company name and employer signature from the single org template at view time.

---

## Implementation outline

### 1. Schema and data model

- **Organizations**: Replace `settings.contractTemplate` (single object) with `settings.contractTemplates`: an array of template objects. Each item:
  - `id`: string (stable id, e.g. `crypto.randomUUID()` or slug).
  - `name`: string (e.g. "Default", "Permanent", "Fixed-term").
  - `isDefault`: boolean — exactly one template per org must be default.
  - Same fields as current template: `companyName`, `contractHeading`, `contractCategory`, `defaultTermsAndConditions`, `employerSignatureStorageId`, `employerSignatureUrl`.
- **Contracts**: Add optional `templateId`: string (for reference only). Add **snapshot fields** (required at create when using a template): `companyName` (optional string), `employerSignatureUrl` (optional string) or `employerSignatureStorageId` (optional id). View and PDF always use these snapshot fields on the contract; no lookup from template.

### 2. Migration

- One-time migration (Convex migration or dashboard script): For each org that has `settings.contractTemplate`, create `settings.contractTemplates` with a single element: current template data, `id` (e.g. "default"), `name: "Default"`, `isDefault: true`. Then remove `contractTemplate`.
- **Existing contracts** have no `templateId` or snapshot fields. Migration can backfill snapshot from the org’s (single) default template so old contracts get `companyName` and `employerSignatureUrl` on the contract; or view/PDF can fall back to org default template when snapshot is missing (only for pre-migration contracts).

### 3. Backend (Convex)

- **Mutations** (e.g. in [convex/organizations/mutations.ts](convex/organizations/mutations.ts)):
  - Replace or extend `updateContractTemplate` with: list templates, add template, update template (name + fields + signature), delete non-default template, set default template. Ensure exactly one default per org.
  - Keep or add `saveEmployerSignature` scoped by template id (upload and store `employerSignatureStorageId` / `employerSignatureUrl` on that template).
- **Contract create**: Accept `templateId` and **snapshot** from client (companyName, employerSignatureUrl or employerSignatureStorageId from the chosen template). Validate template belongs to org. Store `templateId` plus snapshot on the new contract so the document is self-contained.

### 4. Settings UI (Contract Template page)

- **List view**: Show all templates (name, default badge, edit/delete). "Default" template cannot be deleted; can rename. other templates can be deleted; existing contracts created from that template are unchanged because they store a snapshot.
- **Add template**: Button to add a new template (name required, same fields as current form). Optionally set as default.
- **Edit template**: Same form as today but per template: company name, heading, category, default terms, employer signature upload. Each template has its own signature.

### 5. New contract flow

- **Template picker**: On "New contract" for an employee, show a required step or dropdown: "Template: [Default ▼]" with all org templates. Once selected, load that template’s defaults and prefill [ContractForm](src/features/contracts/components/ContractForm.tsx) as today.
- **Submit**: Send chosen `templateId` and snapshot (companyName, employerSignatureUrl or employerSignatureStorageId) with create payload; backend saves them on the contract.

### 6. View contract / PDF (Option B)

- **Contract detail and PDF**: Always use the **contract’s own** `companyName` and `employerSignatureUrl` (the snapshot stored at create time). No lookup from template. For pre-migration contracts that have no snapshot, fall back to org default template when rendering.
- [ContractDetailPage](src/features/employees/pages/ContractDetailPage.tsx) and PDF generation in [ContractForm](src/features/contracts/components/ContractForm.tsx) / [ContractPdfTemplate](src/features/contracts/components/ContractPdfTemplate.tsx): pass in company name and employer signature URL from the **contract** (and only from org template when contract has no snapshot).

### 7. Beads

- When implementing: claim EMA-5 with `bd update "EMA - Employee Management App-5" --status=in_progress`; when done, close with `bd close "EMA - Employee Management App-5"` and sync.

---

## References

- [convex/schema.ts](convex/schema.ts) — org settings and contracts table
- [convex/organizations/mutations.ts](convex/organizations/mutations.ts) — updateContractTemplate, saveEmployerSignature
- [src/features/settings/ContractTemplatePage.tsx](src/features/settings/ContractTemplatePage.tsx) — current single-template settings UI
- [src/features/employees/pages/NewContractPage.tsx](src/features/employees/pages/NewContractPage.tsx) — new contract and template prefill
- [src/features/employees/pages/ContractDetailPage.tsx](src/features/employees/pages/ContractDetailPage.tsx) — view contract and PDF (company name, employer signature)
- [src/features/contracts/components/ContractForm.tsx](src/features/contracts/components/ContractForm.tsx) — form and PDF generation
