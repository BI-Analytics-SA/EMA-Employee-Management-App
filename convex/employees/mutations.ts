import { mutation } from "../_generated/server";
import { v } from "convex/values";
import {
  requireRoleInOrganization,
  canManageEmployees,
} from "../lib/permissions";

const employeeTitle = v.union(
  v.literal("MR"),
  v.literal("MISS"),
  v.literal("MRS"),
  v.literal("MS")
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
  title: employeeTitle,
  initials: v.string(),
  firstName: v.string(),
  secondName: v.optional(v.string()),
  lastName: v.string(),
  knownAs: v.string(),
  dateOfBirth: v.number(),
  gender: genderValidator,
  ethnicGroup: ethnicGroupValidator,
  language: v.optional(v.string()),
  cellNumber: v.string(),
  alternativeNumber: v.optional(v.string()),
  resUnit: v.optional(v.string()),
  resComplex: v.optional(v.string()),
  resStreetNo: v.string(),
  resStreetName: v.string(),
  resSuburb: v.string(),
  resCity: v.string(),
  resPostCode: v.string(),
  residentialCountry: v.optional(v.string()),
  dateRegistered: v.optional(v.number()),
  dateEngaged: v.optional(v.number()),
  lastDateWorked: v.optional(v.number()),
  taxNumber: v.optional(v.string()),
  certificate: v.optional(v.string()),
  hrsPerPeriod: v.optional(v.number()),
  hoursPerDay: v.optional(v.number()),
  workAddressCode: v.optional(v.number()),
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
    return await ctx.db.insert("employees", {
      ...args,
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
    taxNumber: v.optional(v.string()),
    certificate: v.optional(v.string()),
    hrsPerPeriod: v.optional(v.number()),
    hoursPerDay: v.optional(v.number()),
    workAddressCode: v.optional(v.number()),
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
      "cellNumber", "alternativeNumber",
      "resUnit", "resComplex", "resStreetNo", "resStreetName",
      "resSuburb", "resCity", "resPostCode", "residentialCountry",
      "dateRegistered", "dateEngaged", "lastDateWorked",
      "taxNumber", "certificate",
      "hrsPerPeriod", "hoursPerDay", "workAddressCode", "illnessCondition",
      "payMethod", "bankAccType", "bankAccNo", "bankName", "branchCode", "accHolder", "accRelationship",
    ];
    for (const key of allowedKeys) {
      if (key in updates && (updates as Record<string, unknown>)[key] !== undefined) {
        patch[key] = (updates as Record<string, unknown>)[key];
      }
    }
    await ctx.db.patch(id, patch as Record<string, never>);
    return id;
  },
});

const BACKFILL_BATCH_SIZE = 100;

/**
 * Backfill bank detail defaults for existing employees in an organization.
 * Sets payMethod="03", bankAccType="S", accRelationship="O" only where currently null/undefined.
 * Run once per organization after deploying bank details; leaves existing values unchanged.
 * Uses paginated reads and batched patches to avoid OOM/timeout for large orgs.
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
    let total = 0;
    let updated = 0;
    let cursor: string | null = null;

    while (true) {
      const result = await ctx.db
        .query("employees")
        .withIndex("by_organization_createdAt", (q) =>
          q.eq("organizationId", args.organizationId)
        )
        .order("desc")
        .paginate({ numItems: BACKFILL_BATCH_SIZE, cursor });

      for (const emp of result.page) {
        const patch: Record<string, unknown> = { updatedAt: now };
        if (emp.payMethod === undefined) patch.payMethod = "03";
        if (emp.bankAccType === undefined) patch.bankAccType = "S";
        if (emp.accRelationship === undefined) patch.accRelationship = "O";
        if (Object.keys(patch).length > 1) {
          await ctx.db.patch(emp._id, patch as Record<string, never>);
          updated++;
        }
      }
      total += result.page.length;
      if (result.isDone) break;
      cursor = result.continueCursor;
    }
    return { updated, total };
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

    if (employee.imageStorageId) {
      await ctx.storage.delete(employee.imageStorageId);
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});
