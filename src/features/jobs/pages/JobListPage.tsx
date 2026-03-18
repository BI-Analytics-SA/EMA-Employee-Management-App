import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Briefcase } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-700",
};

const sectionClass = "rounded-lg border bg-card overflow-hidden";
const sectionHeaderClass = "bg-muted/70 px-4 py-3 border-b";
const sectionTitleClass = "text-sm font-semibold text-foreground";
const sectionContentClass = "p-4";

export function JobListPage() {
  const { organizationId, isLoading: userLoading } = useCurrentUser();
  const jobsEnabled = useModuleEnabled("jobs");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const jobs = useQuery(
    api.jobs.queries.listByOrganization,
    organizationId ? { organizationId } : "skip"
  );

  if (userLoading || !organizationId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!jobsEnabled) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">
          The Jobs module is not enabled for your organization.
        </p>
      </div>
    );
  }

  const filteredJobs =
    statusFilter === "all"
      ? (jobs ?? [])
      : (jobs ?? []).filter((j) => j.status === statusFilter);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/jobs/new">
            <Plus className="h-4 w-4 mr-1" />
            New Job
          </Link>
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {["all", "open", "in_progress", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <h2 className={sectionTitleClass}>
            {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
          </h2>
        </div>
        <div className={sectionContentClass}>
          {jobs === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                {statusFilter === "all"
                  ? "No jobs yet. Create one to get started."
                  : `No jobs with status "${STATUS_LABELS[statusFilter]}".`}
              </p>
              {statusFilter === "all" && (
                <Button asChild size="sm">
                  <Link to="/jobs/new">
                    <Plus className="h-4 w-4 mr-1" />
                    New Job
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredJobs.map((job) => (
                <li key={job._id}>
                  <Link
                    to={`/jobs/${job._id}`}
                    className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 hover:bg-muted/60 transition-colors"
                  >
                    <Briefcase className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 justify-between flex-wrap">
                        <p className="font-medium truncate">{job.title}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[job.status] ?? ""}`}
                        >
                          {STATUS_LABELS[job.status] ?? job.status}
                        </span>
                      </div>
                      {job.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {job.description}
                        </p>
                      )}
                      {(job.startDate || job.endDate) && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {job.startDate
                            ? new Date(job.startDate).toLocaleDateString()
                            : ""}
                          {job.startDate && job.endDate ? " – " : ""}
                          {job.endDate
                            ? new Date(job.endDate).toLocaleDateString()
                            : ""}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
