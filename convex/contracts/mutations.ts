import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import {
  requireRoleInOrganization,
  canManageContracts,
  requireModuleEnabled,
} from "../lib/permissions";

const createArgs = {
  organizationId: v.id("organizations"),
  employeeId: v.id("employees"),
  nameSurname: v.string(),
  idNumber: v.string(),
  signedDate: v.number(),
  startDate: v.number(),
  employeeNo: v.string(),
  dateEngaged: v.optional(v.number()),
  contractHeading: v.optional(v.string()),
  contractCategory: v.optional(v.string()),
  placeOfSignature: v.optional(v.string()),
  termsAndConditionsHtml: v.optional(v.string()),
  templateId: v.optional(v.string()),
  companyName: v.optional(v.string()),
  employerSignatureUrl: v.optional(v.string()),
  employerSignatureStorageId: v.optional(v.id("_storage")),
};

/**
 * Create a new contract. Contracts module must be enabled; caller must be manager+.
 * When using a template, pass templateId and snapshot (companyName, employerSignatureUrl or employerSignatureStorageId).
 */
export const create = mutation({
  args: createArgs,
  handler: async (ctx, args) => {
    await requireModuleEnabled(ctx, args.organizationId, "contracts");
    const profile = await requireRoleInOrganization(
      ctx,
      args.organizationId,
      "manager"
    );
    if (!canManageContracts(profile.role)) {
      throw new Error("Access denied: You cannot create contracts");
    }

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }
    if (employee.organizationId !== args.organizationId) {
      throw new Error("Employee does not belong to this organization");
    }

    if (args.templateId !== undefined) {
      const org = await ctx.db.get(args.organizationId);
      const templates = org?.settings?.contractTemplates ?? [];
      const template = templates.find((t) => t.id === args.templateId);
      if (!template) {
        throw new Error("Template not found or does not belong to this organization");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("contracts", {
      organizationId: args.organizationId,
      employeeId: args.employeeId,
      nameSurname: args.nameSurname,
      idNumber: args.idNumber,
      signedDate: args.signedDate,
      startDate: args.startDate,
      employeeNo: args.employeeNo,
      dateEngaged: args.dateEngaged,
      contractHeading: args.contractHeading,
      contractCategory: args.contractCategory,
      placeOfSignature: args.placeOfSignature,
      termsAndConditionsHtml: args.termsAndConditionsHtml,
      templateId: args.templateId,
      companyName: args.companyName,
      employerSignatureUrl: args.employerSignatureUrl,
      employerSignatureStorageId: args.employerSignatureStorageId,
      createdAt: now,
      createdBy: profile._id,
    });
  },
});

const updateArgs = {
  id: v.id("contracts"),
  nameSurname: v.optional(v.string()),
  idNumber: v.optional(v.string()),
  signedDate: v.optional(v.number()),
  startDate: v.optional(v.number()),
  employeeNo: v.optional(v.string()),
  dateEngaged: v.optional(v.number()),
  contractHeading: v.optional(v.string()),
  contractCategory: v.optional(v.string()),
  placeOfSignature: v.optional(v.string()),
  termsAndConditionsHtml: v.optional(v.string()),
};

/**
 * Update an existing contract. Contracts module must be enabled; caller must be manager+.
 */
export const update = mutation({
  args: updateArgs,
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const contract = await ctx.db.get(id);
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
      throw new Error("Access denied: You cannot edit contracts");
    }

    const patch: Record<string, unknown> = {};
    if (updates.nameSurname !== undefined) patch.nameSurname = updates.nameSurname;
    if (updates.idNumber !== undefined) patch.idNumber = updates.idNumber;
    if (updates.signedDate !== undefined) patch.signedDate = updates.signedDate;
    if (updates.startDate !== undefined) patch.startDate = updates.startDate;
    if (updates.employeeNo !== undefined) patch.employeeNo = updates.employeeNo;
    if (updates.dateEngaged !== undefined) patch.dateEngaged = updates.dateEngaged;
    if (updates.contractHeading !== undefined) patch.contractHeading = updates.contractHeading;
    if (updates.contractCategory !== undefined) patch.contractCategory = updates.contractCategory;
    if (updates.placeOfSignature !== undefined) patch.placeOfSignature = updates.placeOfSignature;
    if (updates.termsAndConditionsHtml !== undefined) patch.termsAndConditionsHtml = updates.termsAndConditionsHtml;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch);
    }
    return id;
  },
});

/**
 * Remove a contract and its signature and PDF from storage. Contracts module must be enabled; caller must be manager+.
 */
export const remove = mutation({
  args: { id: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.id);
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
      throw new Error("Access denied: You cannot delete contracts");
    }

    if (contract.signatureStorageId) {
      try {
        await ctx.storage.delete(contract.signatureStorageId);
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
    await ctx.db.delete(args.id);
  },
});

/**
 * Internal: record the email sent timestamp and recipient on the contract.
 * Called from the sendContractEmail action after a successful send.
 */
export const recordEmailSent = internalMutation({
  args: {
    contractId: v.id("contracts"),
    sentTo: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contractId, {
      emailSentAt: Date.now(),
      emailSentTo: args.sentTo,
    });
  },
});
