import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { parseLocalDate, formatDateInput } from "@/lib/dateUtils";
import { Id } from "../../../../convex/_generated/dataModel";

type JobStatus = "open" | "in_progress" | "completed" | "cancelled";

const sectionClass = "rounded-lg border bg-card overflow-hidden";
const sectionHeaderClass = "bg-muted/70 px-4 py-3 border-b";
const sectionTitleClass = "text-sm font-semibold text-foreground";
const sectionContentClass = "p-4";

function timestampToDateInput(ts?: number): string {
  return formatDateInput(ts);
}

export function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoading: userLoading } = useCurrentUser();
  const jobsEnabled = useModuleEnabled("jobs");
  const jobId = id as Id<"jobs"> | undefined;

  const job = useQuery(api.jobs.queries.getById, jobId ? { id: jobId } : "skip");
  const updateJob = useMutation(api.jobs.mutations.update);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<JobStatus>("open");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (job && !initialized) {
      setTitle(job.title);
      setDescription(job.description ?? "");
      setStatus(job.status as JobStatus);
      setStartDate(timestampToDateInput(job.startDate));
      setEndDate(timestampToDateInput(job.endDate));
      setInitialized(true);
    }
  }, [job, initialized]);

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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const startTs = parseLocalDate(startDate);
    const endTs = parseLocalDate(endDate);
    if (startTs !== undefined && endTs !== undefined && endTs < startTs) {
      setError("End date cannot be before start date.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await updateJob({
        id: jobId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        startDate: startTs,
        endDate: endTs,
      });
      navigate(`/jobs/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update job.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/jobs/${jobId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={sectionClass}>
          <div className={sectionHeaderClass}>
            <h2 className={sectionTitleClass}>Job Details</h2>
          </div>
          <div className={`${sectionContentClass} space-y-4`}>
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to={`/jobs/${jobId}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
