import type { Doc } from "../_generated/dataModel";
import { isOrgPlanLocked } from "./planAccess";
import {
  isActiveTrialOrg,
  isPaidForInvoicing,
} from "./planEvents";

export const BASE_PRICE_ZAR = 250;
export const MODULE_PRICE_ZAR = 200;

export const MODULE_KEYS = ["contracts", "documents", "exporting", "jobs"] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];
export type ModuleFlags = Record<ModuleKey, boolean>;

export function emptyModuleFlags(): ModuleFlags {
  return { contracts: false, documents: false, exporting: false, jobs: false };
}

export function moduleFlagsFromSettings(
  source: { contracts?: boolean; documents?: boolean; exporting?: boolean; jobs?: boolean } | undefined
): ModuleFlags {
  return {
    contracts: source?.contracts === true,
    documents: source?.documents === true,
    exporting: source?.exporting === true,
    jobs: source?.jobs === true,
  };
}

export function countModules(modules: ModuleFlags): number {
  return MODULE_KEYS.filter((k) => modules[k]).length;
}

export function monthlyInvoiceZar(moduleCount: number): number {
  return BASE_PRICE_ZAR + MODULE_PRICE_ZAR * moduleCount;
}

/** Paid orgs only: modules on the invoice (allowed, or enabled if legacy without allowed). */
export function resolveInvoicedModules(
  org: Doc<"organizations">,
  now = Date.now()
): { source: "allowed" | "enabled" | "none"; modules: ModuleFlags; moduleCount: number } {
  if (!isPaidForInvoicing(org, now) || isOrgPlanLocked(org, now)) {
    return { source: "none", modules: emptyModuleFlags(), moduleCount: 0 };
  }

  const enabled = moduleFlagsFromSettings(org.settings?.enabledModules);
  const allowed = moduleFlagsFromSettings(org.settings?.allowedModules);
  const hasAllowed = org.settings?.allowedModules !== undefined;
  const modules = hasAllowed ? allowed : enabled;

  return {
    source: hasAllowed ? "allowed" : "enabled",
    modules,
    moduleCount: countModules(modules),
  };
}

/** Trial orgs only: enabled modules in use (not billed). */
export function resolveTrialUsageModules(
  org: Doc<"organizations">,
  now = Date.now()
): { modules: ModuleFlags; moduleCount: number } {
  if (!isActiveTrialOrg(org, now)) {
    return { modules: emptyModuleFlags(), moduleCount: 0 };
  }
  const modules = moduleFlagsFromSettings(org.settings?.enabledModules);
  return { modules, moduleCount: countModules(modules) };
}

// Trend buckets: use buildSastBuckets from ./calendarDates (SAST calendar days).
