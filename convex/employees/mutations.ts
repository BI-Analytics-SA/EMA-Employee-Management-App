import { mutation, internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import {
  requireRoleInOrganization,
  canManageEmployees,
} from "../lib/permissions";

function computeTaxYearStart(dateEngaged: number | undefined): number | undefined {
  if (dateEngaged == null) return undefined;
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const marchFirst =
    month < 3
      ? Date.UTC(year - 1, 2, 1)
      : Date.UTC(year, 2, 1);
  return Math.max(dateEngaged, marchFirst);
}

function computeDerivedFields(data: {
  dateEngaged?: number;
  resStreetNo?: string;
  resStreetName?: string;
  resCity?: string;
  resPostCode?: string;
  firstName?: string;
  lastName?: string;
}) {
  return {
    taxYearStart: computeTaxYearStart(data.dateEngaged),
    newUifStartDate: data.dateEngaged,
    repAddr1: data.resStreetNo,
    repAddr2: data.resStreetName,
    repAddr3: data.resCity,
    repPostCode: data.resPostCode,
    fullNames: data.firstName || data.lastName
      ? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim()
      : undefined,
  };
}

const employeeTitle = v.union(
  v.literal("MR"),
  v.literal("MISS"),
  v.literal("MRS"),
  v.literal("MS"),
  v.literal("DR"),
  v.literal("PROF"),
  v.literal("REV")
);
const maritalStatusValidator = v.union(
  v.literal("SINGLE"),
  v.literal("MARRIED"),
  v.literal("DIVORCED"),
  v.literal("WIDOWED"),
  v.literal("SEPARATED")
);
const genderValidator = v.union(v.literal("M"), v.literal("F"));
const ethnicGroupValidator = v.union(
  v.literal("A"),
  v.literal("C"),
  v.literal("W"),
  v.literal("I"),
  v.literal("B")
);
const payMethodValidator = v.union(v.literal("02"), v.literal("03"));
const bankAccTypeValidator = v.union(v.literal("S"), v.literal("C"));
const accRelationshipValidator = v.union(v.literal("O"), v.literal("T"));

const createArgs = {
  organizationId: v.id("organizations"),
  idNumber: v.string(),
  employeeNo: v.optional(v.string()),
  title: v.optional(employeeTitle),
  initials: v.optional(v.string()),
  firstName: v.optional(v.string()),
  secondName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  knownAs: v.optional(v.string()),
  dateOfBirth: v.optional(v.number()),
  gender: v.optional(genderValidator),
  ethnicGroup: v.optional(ethnicGroupValidator),
  language: v.optional(v.string()),
  cellNumber: v.optional(v.string()),
  alternativeNumber: v.optional(v.string()),
  email: v.optional(v.string()),
  resUnit: v.optional(v.string()),
  resComplex: v.optional(v.string()),
  resStreetNo: v.optional(v.string()),
  resStreetName: v.optional(v.string()),
  resSuburb: v.optional(v.string()),
  resCity: v.optional(v.string()),
  resPostCode: v.optional(v.string()),
  residentialCountry: v.optional(v.string()),
  dateRegistered: v.optional(v.number()),
  dateEngaged: v.optional(v.number()),
  lastDateWorked: v.optional(v.number()),
  uifEndDate: v.optional(v.number()),
  taxNumber: v.optional(v.string()),
  certificate: v.optional(v.string()),
  hrsPerPeriod: v.optional(v.number()),
  hoursPerDay: v.optional(v.number()),
  workAddressCode: v.optional(v.number()),
  training: v.optional(v.boolean()),
  shift: v.optional(v.string()),
  shiftAllocation: v.optional(v.string()),
  deptGroup: v.optional(v.string()),
  departmentWorked: v.optional(v.string()),
  department: v.optional(v.string()),
  maritalStatus: v.optional(maritalStatusValidator),
  illnessCondition: v.optional(v.string()),
  payMethod: v.optional(payMethodValidator),
  bankAccType: v.optional(bankAccTypeValidator),
  bankAccNo: v.optional(v.string()),
  bankName: v.optional(v.string()),
  branchCode: v.optional(v.string()),
  accHolder: v.optional(v.string()),
  accRelationship: v.optional(accRelationshipValidator),
};

/**
 * Create a new employee in the organization
 */
export const create = mutation({
  args: createArgs,
  handler: async (ctx, args) => {
    const profile = await requireRoleInOrganization(
      ctx,
      args.organizationId,
      "user"
    );
    if (!canManageEmployees(profile.role)) {
      throw new Error("Access denied: You cannot add employees");
    }

    const existing = await ctx.db
      .query("employees")
      .withIndex("by_organization_idNumber", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("idNumber", args.idNumber)
      )
      .unique();
    if (existing) {
      throw new Error("An employee with this ID number already exists in this organization.");
    }

    const now = Date.now();
    const derived = computeDerivedFields({
      dateEngaged: args.dateEngaged,
      resStreetNo: args.resStreetNo,
      resStreetName: args.resStreetName,
      resCity: args.resCity,
      resPostCode: args.resPostCode,
      firstName: args.firstName,
      lastName: args.lastName,
    });
    return await ctx.db.insert("employees", {
      ...args,
      ...derived,
      createdAt: now,
      updatedAt: now,
      createdBy: profile._id,
    });
  },
});

/**
 * Update an existing employee
 */
export const update = mutation({
  args: {
    id: v.id("employees"),
    idNumber: v.optional(v.string()),
    employeeNo: v.optional(v.string()),
    title: v.optional(employeeTitle),
    initials: v.optional(v.string()),
    firstName: v.optional(v.string()),
    secondName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    knownAs: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(genderValidator),
    ethnicGroup: v.optional(ethnicGroupValidator),
    language: v.optional(v.string()),
    cellNumber: v.optional(v.string()),
    alternativeNumber: v.optional(v.string()),
    email: v.optional(v.string()),
    resUnit: v.optional(v.string()),
    resComplex: v.optional(v.string()),
    resStreetNo: v.optional(v.string()),
    resStreetName: v.optional(v.string()),
    resSuburb: v.optional(v.string()),
    resCity: v.optional(v.string()),
    resPostCode: v.optional(v.string()),
    residentialCountry: v.optional(v.string()),
    dateRegistered: v.optional(v.number()),
    dateEngaged: v.optional(v.number()),
    lastDateWorked: v.optional(v.number()),
    uifEndDate: v.optional(v.number()),
    taxNumber: v.optional(v.string()),
    certificate: v.optional(v.string()),
    hrsPerPeriod: v.optional(v.number()),
    hoursPerDay: v.optional(v.number()),
    workAddressCode: v.optional(v.number()),
    training: v.optional(v.boolean()),
    shift: v.optional(v.string()),
    shiftAllocation: v.optional(v.string()),
    deptGroup: v.optional(v.string()),
    departmentWorked: v.optional(v.string()),
    department: v.optional(v.string()),
    maritalStatus: v.optional(maritalStatusValidator),
    illnessCondition: v.optional(v.string()),
    payMethod: v.optional(payMethodValidator),
    bankAccType: v.optional(bankAccTypeValidator),
    bankAccNo: v.optional(v.string()),
    bankName: v.optional(v.string()),
    branchCode: v.optional(v.string()),
    accHolder: v.optional(v.string()),
    accRelationship: v.optional(accRelationshipValidator),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const employee = await ctx.db.get(id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const profile = await requireRoleInOrganization(
      ctx,
      employee.organizationId,
      "user"
    );
    if (!canManageEmployees(profile.role)) {
      throw new Error("Access denied: You cannot edit employees");
    }

    if (updates.idNumber !== undefined && updates.idNumber !== employee.idNumber) {
      const existing = await ctx.db
        .query("employees")
        .withIndex("by_organization_idNumber", (q) =>
          q
            .eq("organizationId", employee.organizationId)
            .eq("idNumber", updates.idNumber!)
        )
        .unique();
      if (existing) {
        throw new Error("Another employee already has this ID number.");
      }
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    const allowedKeys = [
      "idNumber", "employeeNo", "title", "initials", "firstName", "secondName",
      "lastName", "knownAs", "dateOfBirth", "gender", "ethnicGroup", "language",
      "cellNumber", "alternativeNumber", "email",
      "resUnit", "resComplex", "resStreetNo", "resStreetName",
      "resSuburb", "resCity", "resPostCode", "residentialCountry",
      "dateRegistered", "dateEngaged", "lastDateWorked", "uifEndDate",
      "taxNumber", "certificate",
      "hrsPerPeriod", "hoursPerDay", "workAddressCode",
      "training", "shift", "shiftAllocation", "deptGroup", "departmentWorked", "department", "maritalStatus",
      "illnessCondition",
      "payMethod", "bankAccType", "bankAccNo", "bankName", "branchCode", "accHolder", "accRelationship",
    ];
    for (const key of allowedKeys) {
      if (key in updates && (updates as Record<string, unknown>)[key] !== undefined) {
        patch[key] = (updates as Record<string, unknown>)[key];
      }
    }
    const merged = { ...employee, ...patch } as typeof employee & Record<string, unknown>;
    const derived = computeDerivedFields({
      dateEngaged: merged.dateEngaged,
      resStreetNo: merged.resStreetNo,
      resStreetName: merged.resStreetName,
      resCity: merged.resCity,
      resPostCode: merged.resPostCode,
      firstName: merged.firstName,
      lastName: merged.lastName,
    });
    Object.assign(patch, derived);
    await ctx.db.patch(id, patch as Record<string, never>);
    return id;
  },
});

async function runRecalcDerivedFieldsForOrg(
  ctx: MutationCtx,
  organizationId: Id<"organizations">
): Promise<{ updated: number; total: number }> {
  const now = Date.now();
  let updated = 0;

  const allEmployees = await ctx.db
    .query("employees")
    .withIndex("by_organization_createdAt", (q) =>
      q.eq("organizationId", organizationId)
    )
    .order("desc")
    .collect();

  for (const emp of allEmployees) {
    const derived = computeDerivedFields({
      dateEngaged: emp.dateEngaged,
      resStreetNo: emp.resStreetNo,
      resStreetName: emp.resStreetName,
      resCity: emp.resCity,
      resPostCode: emp.resPostCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
    });
    const changed =
      emp.taxYearStart !== derived.taxYearStart ||
      emp.newUifStartDate !== derived.newUifStartDate ||
      emp.repAddr1 !== derived.repAddr1 ||
      emp.repAddr2 !== derived.repAddr2 ||
      emp.repAddr3 !== derived.repAddr3 ||
      emp.repPostCode !== derived.repPostCode ||
      emp.fullNames !== derived.fullNames;
    if (changed) {
      await ctx.db.patch(emp._id, {
        ...derived,
        updatedAt: now,
      });
      updated++;
    }
  }
  return { updated, total: allEmployees.length };
}

/**
 * Recalculate all derived fields for every employee in an organization.
 * Only patches employees whose computed values differ from stored (no-op on March 2-7 if March 1 succeeded).
 */
export const recalcDerivedFields = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const profile = await requireRoleInOrganization(
      ctx,
      args.organizationId,
      "user"
    );
    if (!canManageEmployees(profile.role)) {
      throw new Error("Access denied: You cannot run this action");
    }
    return runRecalcDerivedFieldsForOrg(ctx, args.organizationId);
  },
});

/**
 * Internal: recalc derived fields for one org (no permission check). Used by cron.
 */
export const recalcDerivedFieldsInternal = internalMutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return runRecalcDerivedFieldsForOrg(ctx, args.organizationId);
  },
});

/**
 * Backfill all derived fields for existing employees.
 * Alias for recalcDerivedFields — kept for backward compatibility with existing call sites.
 */
export const backfillDerivedFields = recalcDerivedFields;

/**
 * Backfill bank detail defaults for existing employees in an organization.
 * Sets payMethod="03", bankAccType="S", accRelationship="O" only where currently null/undefined.
 * Run once per organization after deploying bank details; leaves existing values unchanged.
 * Loads all org employees in one query (same pattern as listAll); Convex allows only one paginate per mutation.
 */
export const backfillBankDefaults = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const profile = await requireRoleInOrganization(
      ctx,
      args.organizationId,
      "user"
    );
    if (!canManageEmployees(profile.role)) {
      throw new Error("Access denied: You cannot run this action");
    }
    const now = Date.now();
    let updated = 0;

    const allEmployees = await ctx.db
      .query("employees")
      .withIndex("by_organization_createdAt", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .collect();

    for (const emp of allEmployees) {
      const patch: Record<string, unknown> = { updatedAt: now };
      if (emp.payMethod === undefined) patch.payMethod = "03";
      if (emp.bankAccType === undefined) patch.bankAccType = "S";
      if (emp.accRelationship === undefined) patch.accRelationship = "O";
      if (Object.keys(patch).length > 1) {
        await ctx.db.patch(emp._id, patch as Record<string, never>);
        updated++;
      }
    }
    return { updated, total: allEmployees.length };
  },
});

/** Allowlist of column IDs that can be bulk-cleared. Must match frontend clearableColumns. */
const CLEARABLE_COLUMNS = [
  "employeeNo", "title", "initials", "firstName", "secondName", "lastName",
  "knownAs", "dateOfBirth", "gender", "ethnicGroup", "language",
  "cellNumber", "alternativeNumber", "email",
  "resUnit", "resComplex", "resStreetNo", "resStreetName", "resSuburb",
  "resCity", "resPostCode", "residentialCountry",
  "dateRegistered", "dateEngaged", "lastDateWorked", "uifEndDate",
  "taxNumber", "certificate",
  "hrsPerPeriod", "hoursPerDay", "workAddressCode", "training",
  "shift", "shiftAllocation", "deptGroup", "departmentWorked", "department",
  "maritalStatus", "illnessCondition",
  "payMethod", "bankAccType", "bankAccNo", "bankName", "branchCode",
  "accHolder", "accRelationship",
] as const;

const CLEARABLE_SET = new Set<string>(CLEARABLE_COLUMNS);

/**
 * Bulk-clear selected columns for all employees in the organization.
 * Admin only. Validates columns against allowlist; recomputes derived fields after clearing.
 */
export const bulkClearColumns = mutation({
  args: {
    organizationId: v.id("organizations"),
    columns: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoleInOrganization(ctx, args.organizationId, "admin");
    if (args.columns.length === 0) {
      throw new Error("At least one column must be selected");
    }
    const invalid = args.columns.filter((c) => !CLEARABLE_SET.has(c));
    if (invalid.length > 0) {
      throw new Error(`Invalid or protected columns: ${invalid.join(", ")}`);
    }
    const now = Date.now();
    let updated = 0;

    const allEmployees = await ctx.db
      .query("employees")
      .withIndex("by_organization_createdAt", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .collect();

    for (const emp of allEmployees) {
      const patch: Record<string, unknown> = {};
      for (const col of args.columns) {
        patch[col] = undefined;
      }
      const merged = { ...emp, ...patch } as typeof emp & Record<string, unknown>;
      const derived = computeDerivedFields({
        dateEngaged: merged.dateEngaged,
        resStreetNo: merged.resStreetNo,
        resStreetName: merged.resStreetName,
        resCity: merged.resCity,
        resPostCode: merged.resPostCode,
        firstName: merged.firstName,
        lastName: merged.lastName,
      });
      Object.assign(patch, derived);

      const empRecord = emp as Record<string, unknown>;
      const hasChanges = Object.keys(patch).some(
        (key) => empRecord[key] !== patch[key]
      );
      if (hasChanges) {
        patch.updatedAt = now;
        await ctx.db.patch(emp._id, patch as Record<string, never>);
        updated++;
      }
    }
    return { updated, total: allEmployees.length };
  },
});

/**
 * Delete an employee
 */
export const remove = mutation({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.id);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const profile = await requireRoleInOrganization(
      ctx,
      employee.organizationId,
      "user"
    );
    if (!canManageEmployees(profile.role)) {
      throw new Error("Access denied: You cannot delete employees");
    }

    // Cascade-delete associated employee documents and their storage files
    const documents = await ctx.db
      .query("employeeDocuments")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.id))
      .collect();
    for (const doc of documents) {
      try {
        await ctx.storage.delete(doc.storageId);
      } catch {
        // Storage file already deleted – ignore
      }
      await ctx.db.delete(doc._id);
    }

    // Cascade-delete associated contracts and their storage files
    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.id))
      .collect();
    for (const contract of contracts) {
      if (contract.signatureStorageId) {
        try {
          await ctx.storage.delete(contract.signatureStorageId);
        } catch {
          // Storage file already deleted – ignore
        }
      }
      if (contract.employerSignatureStorageId) {
        try {
          await ctx.storage.delete(contract.employerSignatureStorageId);
        } catch {
          // Storage file already deleted – ignore
        }
      }
      if (contract.pdfStorageId) {
        try {
          await ctx.storage.delete(contract.pdfStorageId);
        } catch {
          // Storage file already deleted – ignore
        }
      }
      await ctx.db.delete(contract._id);
    }

    // Delete employee image
    if (employee.imageStorageId) {
      try {
        await ctx.storage.delete(employee.imageStorageId);
      } catch {
        // Storage file already deleted – ignore
      }
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

/**
 * Internal: schedule recalc derived fields for all organizations. Used by cron (March 1-7).
 * Fans out one scheduled mutation per org so each runs independently (no timeout, failure isolation).
 */
export const recalcAllOrgs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();
    for (let i = 0; i < orgs.length; i++) {
      await ctx.scheduler.runAfter(
        i * 100,
        internal.employees.mutations.recalcDerivedFieldsInternal,
        { organizationId: orgs[i]._id }
      );
    }
    return { scheduled: orgs.length };
  },
});
