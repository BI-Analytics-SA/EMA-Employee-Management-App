import { query } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireOrganizationAccess } from "../lib/permissions";

/**
 * List employees for the current user's organization with pagination
 */
export const list = query({
  args: {
    organizationId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);

    return await ctx.db
      .query("employees")
      .withIndex("by_organization_createdAt", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/**
 * List all employees for an organization (unpaginated). For Excel export.
 */
export const listAll = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);

    return await ctx.db
      .query("employees")
      .withIndex("by_organization_createdAt", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .collect();
  },
});

/**
 * Total number of employees in the organization.
 */
export const count = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    return employees.length;
  },
});

/**
 * Get a single employee by ID (must belong to user's organization)
 */
export const getById = query({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.id);
    if (!employee) {
      return null;
    }
    await requireOrganizationAccess(ctx, employee.organizationId);
    return employee;
  },
});

/**
 * Search employees by ID number (exact or prefix) within the organization
 * Uses the search index for ID number lookup
 */
export const searchByIdNumber = query({
  args: {
    organizationId: v.id("organizations"),
    idNumber: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);

    const trimmed = args.idNumber.trim();
    if (!trimmed) {
      return [];
    }

    const results = await ctx.db
      .query("employees")
      .withSearchIndex("search_employee", (q) =>
        q.search("idNumber", trimmed).eq("organizationId", args.organizationId)
      )
      .take(20);

    return results;
  },
});

/**
 * Get employee by organization and ID number (exact match, for lookup)
 */
export const getByOrganizationAndIdNumber = query({
  args: {
    organizationId: v.id("organizations"),
    idNumber: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOrganizationAccess(ctx, args.organizationId);

    return await ctx.db
      .query("employees")
      .withIndex("by_organization_idNumber", (q) =>
        q.eq("organizationId", args.organizationId).eq("idNumber", args.idNumber)
      )
      .unique();
  },
});

/**
 * Get counts of associated data for an employee (documents, contracts).
 * Used by the delete confirmation dialog.
 */
export const getAssociatedCounts = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) return { documents: 0, contracts: 0 };
    await requireOrganizationAccess(ctx, employee.organizationId);

    const documents = await ctx.db
      .query("employeeDocuments")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();

    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();

    return { documents: documents.length, contracts: contracts.length };
  },
});
