import { query, internalQuery } from "../_generated/server";
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

/**
 * Internal query to fetch contract and related data needed for sending the contract email.
 * Called from within the sendContractEmail action via ctx.runQuery.
 */
export const getContractForEmail = internalQuery({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) return null;

    const employee = await ctx.db.get(contract.employeeId);
    const organization = await ctx.db.get(contract.organizationId);

    return {
      pdfUrl: contract.pdfUrl,
      pdfStorageId: contract.pdfStorageId,
      nameSurname: contract.nameSurname,
      employeeEmail: employee?.email,
      organizationName: organization?.name ?? "Your Organisation",
    };
  },
});
