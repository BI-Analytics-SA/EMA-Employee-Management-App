import type { Doc } from "../_generated/dataModel";

export type ModuleKey = "contracts" | "documents" | "exporting" | "jobs";

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

export function trialEndsAtFromNow(now = Date.now()): number {
  return now + TRIAL_MS;
}

export function isOrgPlanLocked(org: Doc<"organizations"> | null, now = Date.now()): boolean {
  if (!org) return true;
  const status = org.planStatus;
  if (status === undefined || status === "active") return false;
  if (status === "expired") return true;
  if (status === "trial") {
    const ends = org.trialEndsAt;
    if (ends === undefined) return false;
    return ends <= now;
  }
  return true;
}

export function canEnableModule(
  org: Doc<"organizations">,
  moduleName: ModuleKey,
  now = Date.now()
): boolean {
  if (isOrgPlanLocked(org, now)) return false;
  const status = org.planStatus;
  if (status === undefined || status === "trial") return true;
  if (status === "active") {
    const allowed = org.settings?.allowedModules;
    if (!allowed) return true;
    return allowed[moduleName] === true;
  }
  return false;
}
