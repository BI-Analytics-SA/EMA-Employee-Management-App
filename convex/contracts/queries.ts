import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireOrganizationAccess, requireModuleEnabled } from "../lib/permissions";

/**
 * List contracts for an employee (contracts module must be enabled).
 */
export const listByEmployee = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      return [];
    }
    await requireOrganizationAccess(ctx, employee.organizationId);
    await requireModuleEnabled(ctx, employee.organizationId, "contracts");

    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();
    return contracts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single contract by ID (must belong to user's organization, contracts module enabled).
 */
export const getById = query({
  args: { id: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.id);
    if (!contract) {
      return null;
    }
    await requireOrganizationAccess(ctx, contract.organizationId);
    await requireModuleEnabled(ctx, contract.organizationId, "contracts");
    return contract;
  },
});
