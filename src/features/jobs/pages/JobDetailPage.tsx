import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { extractConvexError } from "@/lib/convex-error";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Pencil, Trash2, FileText, Plus, Eye } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { ExpiryBadge } from "@/components/shared/ExpiryBadge";
import { DocumentViewer } from "@/components/shared/DocumentViewer";

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
  const { isLoading: userLoading, organization } = useCurrentUser();
  const jobsEnabled = useModuleEnabled("jobs");
  const jobId = id as Id<"jobs"> | undefined;

  const job = useQuery(api.jobs.queries.getById, jobId ? { id: jobId } : "skip");
  const documents = useQuery(
    api.jobDocuments.queries.listByJob,
    jobId ? { jobId } : "skip"
  );
  const removeJob = useMutation(api.jobs.mutations.remove);
  const removeDoc = useMutation(api.jobDocuments.mutations.remove);

  const jobDocumentTypes = organization?.settings?.jobDocumentTypes ?? [];

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteJobConfirm, setShowDeleteJobConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteDocError, setDeleteDocError] = useState<string | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState<Id<"jobDocuments"> | null>(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState<Id<"jobDocuments"> | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{
    url: string;
    fileName: string;
    fileType: string;
  } | null>(null);

  // Build a lookup map for resolving type IDs to names
  const typeNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const dt of jobDocumentTypes) {
      map[dt.id] = dt.name;
    }
    return map;
  }, [jobDocumentTypes]);

  // Group documents by type
  const groupedDocs = useMemo(() => {
    if (!documents) return {};
    const groups: Record<string, typeof documents> = {};
    for (const doc of documents) {
      const key = doc.documentType;
      if (!groups[key]) groups[key] = [];
      groups[key].push(doc);
    }
    return groups;
  }, [documents]);

  // Only show types that have documents (filtered by typeFilter)
  const visibleTypes = useMemo(() => {
    const typesWithDocs = jobDocumentTypes.filter((dt) => (groupedDocs[dt.id]?.length ?? 0) > 0);
    if (typeFilter === "all") return typesWithDocs;
    return typesWithDocs.filter((dt) => dt.id === typeFilter);
  }, [jobDocumentTypes, groupedDocs, typeFilter]);

  // Find orphaned documents (type not in configured jobDocumentTypes)
  const orphanedDocs = useMemo(() => {
    if (!documents) return [];
    const knownIds = new Set(jobDocumentTypes.map((dt) => dt.id));
    return documents.filter((d) => !knownIds.has(d.documentType));
  }, [documents, jobDocumentTypes]);

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

  const handleDeleteJob = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await removeJob({ id: jobId });
      navigate("/jobs");
    } catch (err) {
      setDeleteError(extractConvexError(err, "Failed to delete job. Please try again."));
      setIsDeleting(false);
    } finally {
      setShowDeleteJobConfirm(false);
    }
  };

  const handleDeleteDoc = async (docId: Id<"jobDocuments">) => {
    setIsDeletingDoc(docId);
    setDeleteDocError(null);
    try {
      await removeDoc({ id: docId });
    } catch (err) {
      setDeleteDocError(extractConvexError(err, "Failed to delete document. Please try again."));
    } finally {
      setIsDeletingDoc(null);
      setDeleteDocTarget(null);
    }
  };

  const renderDocCard = (doc: NonNullable<typeof documents>[number]) => (
    <li
      key={doc._id}
      className="rounded-lg border bg-muted/30 p-3"
    >
      <div className="flex items-start gap-2">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <p className="font-medium truncate">
              {doc.title || doc.fileName}
            </p>
            <ExpiryBadge
              expiryDate={doc.expiryDate}
              daysBeforeExpiry={30}
              className="shrink-0"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {typeNameMap[doc.documentType] ?? doc.documentType}
            {doc.notes && ` · ${doc.notes}`}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 sm:px-3"
          onClick={() =>
            setViewingDoc({
              url: doc.fileUrl,
              fileName: doc.fileName,
              fileType: doc.fileType,
            })
          }
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">View</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 sm:px-3 text-destructive hover:text-destructive"
          onClick={() => setDeleteDocTarget(doc._id)}
          disabled={isDeletingDoc === doc._id}
        >
          {isDeletingDoc === doc._id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          <span className="hidden sm:inline ml-1">
            {isDeletingDoc === doc._id ? "Deleting…" : "Delete"}
          </span>
        </Button>
      </div>
    </li>
  );

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
          <Button size="sm" asChild>
            <Link to={`/jobs/${jobId}/documents/upload`}>
              <Plus className="h-4 w-4 mr-1" />
              Upload Document
            </Link>
          </Button>
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
            onClick={() => setShowDeleteJobConfirm(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Delete
          </Button>
          {deleteError && (
            <p className="w-full text-sm text-destructive">{deleteError}</p>
          )}
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

      {/* Documents */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Documents</h2>
        {deleteDocError && (
          <p className="text-sm text-destructive">{deleteDocError}</p>
        )}

        {/* Filter pills */}
        {jobDocumentTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                typeFilter === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/30"
              }`}
            >
              All
            </button>
            {jobDocumentTypes.map((dt) => {
              const count = groupedDocs[dt.id]?.length ?? 0;
              return (
                <button
                  type="button"
                  key={dt.id}
                  onClick={() => setTypeFilter(dt.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                    typeFilter === dt.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                  }`}
                >
                  {dt.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {documents === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className={sectionClass}>
            <div className={sectionContentClass}>
              <p className="text-muted-foreground text-sm py-4 text-center">
                No documents yet. Upload a document to get started.
              </p>
            </div>
          </div>
        ) : jobDocumentTypes.length === 0 ? (
          /* No job document types configured - show flat list */
          <div className={sectionClass}>
            <div className={sectionContentClass}>
              <ul className="space-y-2">
                {documents.map(renderDocCard)}
              </ul>
            </div>
          </div>
        ) : (
          /* Grouped view - only types with documents */
          <>
            {visibleTypes.map((dt) => {
              const docsForType = groupedDocs[dt.id] ?? [];
              return (
                <div key={dt.id} className={sectionClass}>
                  <div className={sectionHeaderClass}>
                    <div className="flex items-center justify-between">
                      <h2 className={sectionTitleClass}>
                        {dt.name} ({docsForType.length})
                      </h2>
                      <Button size="sm" asChild>
                        <Link to={`/jobs/${jobId}/documents/upload?type=${dt.id}`}>
                          <Plus className="h-4 w-4 mr-1" />
                          Upload
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className={sectionContentClass}>
                    <ul className="space-y-2">
                      {docsForType.map(renderDocCard)}
                    </ul>
                  </div>
                </div>
              );
            })}

            {/* Other / orphaned documents */}
            {typeFilter === "all" && orphanedDocs.length > 0 && (
              <div className={sectionClass}>
                <div className={sectionHeaderClass}>
                  <h2 className={sectionTitleClass}>Other ({orphanedDocs.length})</h2>
                </div>
                <div className={sectionContentClass}>
                  <ul className="space-y-2">
                    {orphanedDocs.map(renderDocCard)}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {viewingDoc && (
        <DocumentViewer
          url={viewingDoc.url}
          fileName={viewingDoc.fileName}
          fileType={viewingDoc.fileType}
          onClose={() => setViewingDoc(null)}
        />
      )}

      <ConfirmDialog
        open={showDeleteJobConfirm}
        onOpenChange={setShowDeleteJobConfirm}
        onConfirm={handleDeleteJob}
        title="Delete job"
        description="Delete this job and all its documents? This cannot be undone."
        loading={isDeleting}
      />

      <ConfirmDialog
        open={deleteDocTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteDocTarget(null); }}
        onConfirm={() => { if (deleteDocTarget) handleDeleteDoc(deleteDocTarget); }}
        title="Delete document"
        description="Delete this document? This cannot be undone."
        loading={isDeletingDoc !== null}
      />
    </div>
  );
}
