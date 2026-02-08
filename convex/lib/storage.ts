import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUserProfile } from "./permissions";

/**
 * Generate a signed upload URL for file uploads (e.g. signatures, images).
 * Caller must be authenticated. Use for signature capture, contract signatures,
 * medical questionnaire signatures, etc.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUserProfile(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get the URL for a stored file. Caller must be authenticated.
 * Used by the signature demo page to display the uploaded signature.
 */
export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await getAuthenticatedUserProfile(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});
