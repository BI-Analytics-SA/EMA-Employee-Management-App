import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

export type PlanEventType =
  | "signed_up"
  | "trial_started"
  | "trial_ended"
  | "plan_activated"
  | "plan_expired";

export type OrgPlanState = "none" | "trial" | "paid" | "expired";

export function effectiveSignedUpAt(org: Doc<"organizations">): number {
  return org.signedUpAt ?? org.createdAt;
}

export function effectiveTrialStartedAt(org: Doc<"organizations">): number | null {
  if (org.trialStartedAt !== undefined) return org.trialStartedAt;
  if (org.planStatus === "trial" || org.trialEndsAt !== undefined) {
    return effectiveSignedUpAt(org);
  }
  return null;
}

/** Paid for billing: active plan or legacy (undefined status) that is not locked. */
export function isPaidForInvoicing(org: Doc<"organizations">): boolean {
  const status = org.planStatus;
  if (status === "expired") return false;
  if (status === "trial") return false;
  if (status === "active") return true;
  if (status === undefined) return true;
  return false;
}

export function isActiveTrialOrg(
  org: Doc<"organizations">,
  now = Date.now()
): boolean {
  if (org.planStatus !== "trial") return false;
  const ends = org.trialEndsAt;
  if (ends === undefined) return true;
  return ends > now;
}

/** Trial ended without a paid plan, or manually marked expired. */
export function isExpiredTrialOrg(
  org: Doc<"organizations">,
  now = Date.now()
): boolean {
  if (org.planStatus === "active" || org.planStatus === undefined) return false;
  if (org.planStatus === "expired") return true;
  if (org.planStatus === "trial") {
    const ends = org.trialEndsAt;
    return ends !== undefined && ends <= now;
  }
  return false;
}

export function orgStateFromEvents(
  events: { eventType: PlanEventType; occurredAt: number }[],
  asOfMs: number
): OrgPlanState {
  const relevant = events
    .filter((e) => e.occurredAt <= asOfMs)
    .sort((a, b) => a.occurredAt - b.occurredAt || 0);

  let state: OrgPlanState = "none";
  for (const e of relevant) {
    switch (e.eventType) {
      case "signed_up":
      case "trial_started":
        state = "trial";
        break;
      case "trial_ended":
        state = "expired";
        break;
      case "plan_activated":
        state = "paid";
        break;
      case "plan_expired":
        state = "expired";
        break;
    }
  }
  return state;
}

async function deleteOrgPlanEvents(
  ctx: MutationCtx,
  organizationId: Id<"organizations">
) {
  const rows = await ctx.db
    .query("organizationPlanEvents")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .collect();
  for (const row of rows) {
    await ctx.db.delete(row._id);
  }
}

async function insertPlanEvent(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
  eventType: PlanEventType,
  occurredAt: number
) {
  await ctx.db.insert("organizationPlanEvents", {
    organizationId,
    eventType,
    occurredAt,
  });
}

/**
 * Rebuild plan events from stored org dates (platform admin source of truth).
 * Call after org create or platform update when dates change.
 */
export async function syncPlanEventsFromOrg(
  ctx: MutationCtx,
  org: Doc<"organizations">
) {
  await deleteOrgPlanEvents(ctx, org._id);

  const signedUp = effectiveSignedUpAt(org);
  await insertPlanEvent(ctx, org._id, "signed_up", signedUp);

  const trialStart = effectiveTrialStartedAt(org);
  if (trialStart !== null) {
    await insertPlanEvent(ctx, org._id, "trial_started", trialStart);
  }

  if (org.planActivatedAt !== undefined) {
    await insertPlanEvent(ctx, org._id, "plan_activated", org.planActivatedAt);
  }

  if (org.planExpiredAt !== undefined) {
    await insertPlanEvent(ctx, org._id, "plan_expired", org.planExpiredAt);
  } else if (
    org.planStatus === "expired" &&
    org.planActivatedAt === undefined &&
    org.trialEndsAt !== undefined
  ) {
    await insertPlanEvent(ctx, org._id, "trial_ended", org.trialEndsAt);
  } else if (
    org.planStatus === "trial" &&
    org.trialEndsAt !== undefined &&
    org.trialEndsAt <= Date.now() &&
    org.planActivatedAt === undefined
  ) {
    await insertPlanEvent(ctx, org._id, "trial_ended", org.trialEndsAt);
  }
}
