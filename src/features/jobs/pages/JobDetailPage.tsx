import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Pencil, Trash2, FileText, Plus } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

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
const sectionContentClass = "p-4 text-sm";

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-40 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoading: userLoading } = useCurrentUser();
  const jobsEnabled = useModuleEnabled("jobs");
  const jobId = id as Id<"jobs"> | undefined;

  const job = useQuery(api.jobs.queries.getById, jobId ? { id: jobId } : "skip");
  const documents = useQuery(
    api.jobDocuments.queries.listByJob,
    jobId ? { jobId } : "skip"
  );
  const removeJob = useMutation(api.jobs.mutations.remove);
  const [isDeleting, setIsDeleting] = useState(false);

  if (userLoading || !jobId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!jobsEnabled) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">The Jobs module is not enabled.</p>
      </div>
    );
  }

  if (job === undefined) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="p-4">
        <p className="text-destructive">Job not found.</p>
        <Link to="/jobs">
          <Button variant="link" className="mt-2">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm("Delete this job and all its documents? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await removeJob({ id: jobId });
      navigate("/jobs");
    } catch {
      setIsDeleting(false);
    }
  };

  const docCount = documents?.length ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link to="/jobs">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold truncate min-w-0 flex-1">{job.title}</h1>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[job.status] ?? ""}`}
          >
            {STATUS_LABELS[job.status] ?? job.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/jobs/${jobId}/edit`}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Details */}
      <section className={sectionClass}>
        <div className={sectionHeaderClass}>
          <h2 className={sectionTitleClass}>Details</h2>
        </div>
        <div className={`${sectionContentClass} space-y-2`}>
          <InfoRow label="Title" value={job.title} />
          <InfoRow label="Status" value={STATUS_LABELS[job.status] ?? job.status} />
          {job.description && <InfoRow label="Description" value={job.description} />}
          <InfoRow
            label="Start Date"
            value={job.startDate ? new Date(job.startDate).toLocaleDateString() : undefined}
          />
          <InfoRow
            label="End Date"
            value={job.endDate ? new Date(job.endDate).toLocaleDateString() : undefined}
          />
          <InfoRow
            label="Created"
            value={new Date(job.createdAt).toLocaleDateString()}
          />
        </div>
      </section>

      {/* Documents section */}
      <section className={sectionClass}>
        <div className={`${sectionHeaderClass} flex items-center justify-between`}>
          <h2 className={sectionTitleClass}>Documents</h2>
          <Button size="sm" variant="ghost" asChild className="h-7 px-2 text-xs">
            <Link to={`/jobs/${jobId}/documents`}>
              <FileText className="h-3.5 w-3.5 mr-1" />
              View all
            </Link>
          </Button>
        </div>
        <div className={sectionContentClass}>
          {documents === undefined ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : docCount === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <p className="text-muted-foreground text-sm">No documents yet.</p>
              <Button size="sm" asChild>
                <Link to={`/jobs/${jobId}/documents/upload`}>
                  <Plus className="h-4 w-4 mr-1" />
                  Upload Document
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                {docCount} document{docCount !== 1 ? "s" : ""}
              </p>
              <Button size="sm" asChild>
                <Link to={`/jobs/${jobId}/documents/upload`}>
                  <Plus className="h-4 w-4 mr-1" />
                  Upload
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
