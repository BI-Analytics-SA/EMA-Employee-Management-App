import { mutation } from "../_generated/server";
import { getAuthenticatedUserProfile } from "../lib/permissions";

/**
 * Generate a signed upload URL for job document upload.
 * Caller must be authenticated.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUserProfile(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
