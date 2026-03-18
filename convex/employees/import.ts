import { query, mutation } from "../_generated/server";
import { v } from "convex/values";
import {
  requireRoleInOrganization,
  canManageEmployees,
} from "../lib/permissions";

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

/** One item in a bulk import batch: mode + all importable fields (optional except idNumber) */
const bulkImportItemValidator = v.object({
  mode: v.union(v.literal("create"), v.literal("update")),
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
});

/**
 * Returns lightweight { idNumber, _id } for all employees in the org.
 * Used by the client to classify import rows as create vs update.
 */
export const getEmployeeIdNumbers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireRoleInOrganization(ctx, args.organizationId, "user");
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
    return employees.map((e) => ({ idNumber: e.idNumber, _id: e._id }));
  },
});

const BULK_IMPORT_BATCH_SIZE = 50;

/** Employee field -> org settings array mapping (only data-management fields) */
const FIELD_TO_SETTINGS_ARRAY = {
  department: "departments",
  departmentWorked: "departments",
  deptGroup: "deptGroups",
  shift: "shifts",
  shiftAllocation: "shiftAllocations",
} as const;

type SettingsArrayKey = (typeof FIELD_TO_SETTINGS_ARRAY)[keyof typeof FIELD_TO_SETTINGS_ARRAY];

/**
 * Upsert a batch of employees (create or update by idNumber).
 * Auto-adds new dropdown/settings values (departments, shifts, suburbs, etc.)
 * to the org settings so they appear in form dropdowns.
 */
export const bulkUpsertEmployees = mutation({
  args: {
    organizationId: v.id("organizations"),
    batch: v.array(bulkImportItemValidator),
  },
  handler: async (ctx, args) => {
    const profile = await requireRoleInOrganization(
      ctx,
      args.organizationId,
      "user"
    );
    if (!canManageEmployees(profile.role)) {
      throw new Error("Access denied: You cannot import employees");
    }
    if (args.batch.length > BULK_IMPORT_BATCH_SIZE) {
      throw new Error(
        `Batch size must be at most ${BULK_IMPORT_BATCH_SIZE}`
      );
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    const newSettingsValues: Record<SettingsArrayKey, Set<string>> = {
      departments: new Set(org.settings?.departments ?? []),
      deptGroups: new Set(org.settings?.deptGroups ?? []),
      shifts: new Set(org.settings?.shifts ?? []),
      shiftAllocations: new Set(org.settings?.shiftAllocations ?? []),
    };
    const originalSizes: Record<SettingsArrayKey, number> = {
      departments: newSettingsValues.departments.size,
      deptGroups: newSettingsValues.deptGroups.size,
      shifts: newSettingsValues.shifts.size,
      shiftAllocations: newSettingsValues.shiftAllocations.size,
    };

    const now = Date.now();
    let created = 0;
    let updated = 0;
    const errors: { row: number; message: string }[] = [];

    function collectSettingsValues(item: typeof args.batch[number]) {
      for (const [field, settingsKey] of Object.entries(FIELD_TO_SETTINGS_ARRAY)) {
        const val = item[field as keyof typeof item];
        if (typeof val === "string" && val.trim()) {
          newSettingsValues[settingsKey as SettingsArrayKey].add(val.trim());
        }
      }
    }

    for (let i = 0; i < args.batch.length; i++) {
      const item = args.batch[i];
      try {
        collectSettingsValues(item);
        if (item.mode === "create") {
          const existing = await ctx.db
            .query("employees")
            .withIndex("by_organization_idNumber", (q) =>
              q
                .eq("organizationId", args.organizationId)
                .eq("idNumber", item.idNumber)
            )
            .unique();
          if (existing) {
            errors.push({ row: i + 1, message: "An employee with this ID number already exists" });
            continue;
          }

          const derived = computeDerivedFields({
            dateEngaged: item.dateEngaged,
            resStreetNo: item.resStreetNo,
            resStreetName: item.resStreetName,
            resCity: item.resCity,
            resPostCode: item.resPostCode,
            firstName: item.firstName,
            lastName: item.lastName,
          });
          await ctx.db.insert("employees", {
            organizationId: args.organizationId,
            idNumber: item.idNumber,
            employeeNo: item.employeeNo,
            title: item.title,
            initials: item.initials,
            firstName: item.firstName,
            secondName: item.secondName,
            lastName: item.lastName,
            knownAs: item.knownAs,
            dateOfBirth: item.dateOfBirth,
            gender: item.gender,
            ethnicGroup: item.ethnicGroup,
            language: item.language,
            cellNumber: item.cellNumber,
            alternativeNumber: item.alternativeNumber,
            email: item.email,
            resUnit: item.resUnit,
            resComplex: item.resComplex,
            resStreetNo: item.resStreetNo,
            resStreetName: item.resStreetName,
            resSuburb: item.resSuburb,
            resCity: item.resCity,
            resPostCode: item.resPostCode,
            residentialCountry: item.residentialCountry,
            dateRegistered: item.dateRegistered,
            dateEngaged: item.dateEngaged,
            lastDateWorked: item.lastDateWorked,
            uifEndDate: item.uifEndDate,
            taxNumber: item.taxNumber,
            certificate: item.certificate,
            hrsPerPeriod: item.hrsPerPeriod,
            hoursPerDay: item.hoursPerDay,
            workAddressCode: item.workAddressCode,
            training: item.training,
            shift: item.shift,
            shiftAllocation: item.shiftAllocation,
            deptGroup: item.deptGroup,
            departmentWorked: item.departmentWorked,
            department: item.department,
            maritalStatus: item.maritalStatus,
            illnessCondition: item.illnessCondition,
            payMethod: item.payMethod,
            bankAccType: item.bankAccType,
            bankAccNo: item.bankAccNo,
            bankName: item.bankName,
            branchCode: item.branchCode,
            accHolder: item.accHolder,
            accRelationship: item.accRelationship,
            ...derived,
            createdAt: now,
            updatedAt: now,
            createdBy: profile._id,
          });
          created++;
        } else {
          const existing = await ctx.db
            .query("employees")
            .withIndex("by_organization_idNumber", (q) =>
              q
                .eq("organizationId", args.organizationId)
                .eq("idNumber", item.idNumber)
            )
            .unique();
          if (!existing) {
            errors.push({ row: i + 1, message: "No employee found with this ID number to update" });
            continue;
          }

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
          ] as const;
          const patch: Record<string, unknown> = { updatedAt: now };
          for (const key of allowedKeys) {
            if (key in item && item[key as keyof typeof item] !== undefined) {
              patch[key] = item[key as keyof typeof item];
            }
          }
          const merged = { ...existing, ...patch };
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
          if (patch.idNumber !== undefined && patch.idNumber !== existing.idNumber) {
            const duplicate = await ctx.db
              .query("employees")
              .withIndex("by_organization_idNumber", (q) =>
                q
                  .eq("organizationId", args.organizationId)
                  .eq("idNumber", patch.idNumber as string)
              )
              .unique();
            if (duplicate) {
              errors.push({ row: i + 1, message: "Another employee already has this ID number" });
              continue;
            }
          }
          await ctx.db.patch(existing._id, patch as Record<string, never>);
          updated++;
        }
      } catch (err) {
        errors.push({
          row: i + 1,
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const settingsChanged = (Object.keys(originalSizes) as SettingsArrayKey[]).some(
      (key) => newSettingsValues[key].size > originalSizes[key]
    );
    if (settingsChanged) {
      const freshOrg = await ctx.db.get(args.organizationId);
      if (freshOrg) {
        await ctx.db.patch(args.organizationId, {
          settings: {
            ...(freshOrg.settings ?? {
              departments: [],
              deptGroups: [],
              shifts: [],
              shiftAllocations: [],
              suburbs: [],
              cities: [],
              postCodes: [],
            }),
            departments: Array.from(newSettingsValues.departments),
            deptGroups: Array.from(newSettingsValues.deptGroups),
            shifts: Array.from(newSettingsValues.shifts),
            shiftAllocations: Array.from(newSettingsValues.shiftAllocations),
          },
        });
      }
    }

    return { created, updated, errors };
  },
});
