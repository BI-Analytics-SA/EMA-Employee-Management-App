import { mutation } from "../_generated/server";
import { v } from "convex/values";
import {
  requireRoleInOrganization,
  canManageContracts,
  requireModuleEnabled,
} from "../lib/permissions";

/**
 * Save uploaded signature to contract record. Replaces existing signature if any.
 */
export const saveContractSignature = mutation({
  args: {
    contractId: v.id("contracts"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      throw new Error("Contract not found");
    }

    await requireModuleEnabled(ctx, contract.organizationId, "contracts");
    const profile = await requireRoleInOrganization(
      ctx,
      contract.organizationId,
      "manager"
    );
    if (!canManageContracts(profile.role)) {
      throw new Error("Access denied: You cannot update contract signatures");
    }

    if (contract.signatureStorageId) {
      try {
        await ctx.storage.delete(contract.signatureStorageId);
      } catch {
        // Storage file already deleted – ignore
      }
    }

    const signatureUrl = await ctx.storage.getUrl(args.storageId);
    await ctx.db.patch(args.contractId, {
      signatureStorageId: args.storageId,
      signatureUrl: signatureUrl ?? undefined,
    });
  },
});

/**
 * Remove signature from contract and delete from storage.
 */
export const deleteContractSignature = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      throw new Error("Contract not found");
    }

    await requireModuleEnabled(ctx, contract.organizationId, "contracts");
    const profile = await requireRoleInOrganization(
      ctx,
      contract.organizationId,
      "manager"
    );
    if (!canManageContracts(profile.role)) {
      throw new Error("Access denied: You cannot delete contract signatures");
    }

    if (contract.signatureStorageId) {
      try {
        await ctx.storage.delete(contract.signatureStorageId);
      } catch {
        // Storage file already deleted – ignore
      }
    }

    await ctx.db.patch(args.contractId, {
      signatureStorageId: undefined,
      signatureUrl: undefined,
    });
  },
});

/**
 * Save uploaded PDF to contract record. Replaces existing PDF if any.
 */
export const saveContractPdf = mutation({
  args: {
    contractId: v.id("contracts"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      throw new Error("Contract not found");
    }

    await requireModuleEnabled(ctx, contract.organizationId, "contracts");
    const profile = await requireRoleInOrganization(
      ctx,
      contract.organizationId,
      "manager"
    );
    if (!canManageContracts(profile.role)) {
      throw new Error("Access denied: You cannot update contract PDFs");
    }

    if (contract.pdfStorageId) {
      try {
        await ctx.storage.delete(contract.pdfStorageId);
      } catch {
        // Storage file already deleted – ignore
      }
    }

    const pdfUrl = await ctx.storage.getUrl(args.storageId);
    await ctx.db.patch(args.contractId, {
      pdfStorageId: args.storageId,
      pdfUrl: pdfUrl ?? undefined,
    });
  },
});

/**
 * Remove PDF from contract and delete from storage.
 */
export const deleteContractPdf = mutation({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) {
      throw new Error("Contract not found");
    }

    await requireModuleEnabled(ctx, contract.organizationId, "contracts");
    const profile = await requireRoleInOrganization(
      ctx,
      contract.organizationId,
      "manager"
    );
    if (!canManageContracts(profile.role)) {
      throw new Error("Access denied: You cannot delete contract PDFs");
    }

    if (contract.pdfStorageId) {
      try {
        await ctx.storage.delete(contract.pdfStorageId);
      } catch {
        // Storage file already deleted – ignore
      }
    }

    await ctx.db.patch(args.contractId, {
      pdfStorageId: undefined,
      pdfUrl: undefined,
    });
  },
});

