import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Recalc taxYearStart (and other derived fields) for all orgs on March 1-7 at 03:00 SAST (01:00 UTC).
// Days 2-7 are no-ops if March 1 succeeded (mutation only patches when values changed).
crons.cron(
  "recalc-tax-year-start",
  "0 1 1-7 3 *",
  internal.employees.mutations.recalcAllOrgs
);

export default crons;
