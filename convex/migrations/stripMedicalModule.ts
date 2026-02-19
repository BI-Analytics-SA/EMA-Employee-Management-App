/**
 * One-off migration: remove the deprecated "medical" key from every organization's
 * settings.enabledModules so the schema can drop the field entirely.
 *
 * Run once from the Convex dashboard (Functions → migrations/stripMedicalModule → Run),
 * or: npx convex run migrations/stripMedicalModule:stripMedicalModule
 * Safe to run multiple times (idempotent).
 */
import { mutation } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

export const stripMedicalModule = mutation({
  args: {},
  handler: async (ctx) => {
    const organizations = await ctx.db.query("organizations").collect();
    let updated = 0;

    const emptyArr: string[] = [];
    for (const org of organizations) {
      const modules = org.settings?.enabledModules;
      if (modules && "medical" in modules) {
        const { medical: _, ...rest } = modules as Record<string, boolean>;
        const s = org.settings as Doc<"organizations">["settings"] | undefined;
        type EnabledModules = NonNullable<NonNullable<Doc<"organizations">["settings"]>["enabledModules"]>;
        const enabledModules: EnabledModules | undefined =
          Object.keys(rest).length > 0 ? (rest as EnabledModules) : undefined;
        const newSettings: NonNullable<Doc<"organizations">["settings"]> = {
          departments: s?.departments ?? emptyArr,
          deptGroups: s?.deptGroups ?? emptyArr,
          shifts: s?.shifts ?? emptyArr,
          shiftAllocations: s?.shiftAllocations ?? emptyArr,
          suburbs: s?.suburbs ?? emptyArr,
          cities: s?.cities ?? emptyArr,
          postCodes: s?.postCodes ?? emptyArr,
          documentTypes: s?.documentTypes,
          enabledModules,
          contractTemplate: s?.contractTemplate,
          contractTemplates: s?.contractTemplates,
          exportConfig: s?.exportConfig,
        };
        await ctx.db.patch(org._id, { settings: newSettings });
        updated++;
      }
    }

    return { total: organizations.length, updated };
  },
});
