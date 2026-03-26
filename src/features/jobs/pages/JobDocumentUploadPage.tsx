import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { extractConvexError } from "@/lib/convex-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentUpload } from "@/components/shared/DocumentUpload";
import { SelectedFileCard } from "@/components/shared/SelectedFileCard";
import { Loader2, ArrowLeft } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { parseLocalDate } from "@/lib/dateUtils";

type ExpiryMode = "date" | "duration";

function addDurationToNow(
  amount: number,
  unit: "day" | "week" | "month" | "year"
): number {
  const d = new Date();
  switch (unit) {
    case "day":
      d.setDate(d.getDate() + amount);
      break;
    case "week":
      d.setDate(d.getDate() + amount * 7);
      break;
    case "month":
      d.setMonth(d.getMonth() + amount);
      break;
    case "year":
      d.setFullYear(d.getFullYear() + amount);
      break;
  }
  return d.getTime();
}

export function JobDocumentUploadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoading: userLoading, organization } = useCurrentUser();
  const jobsEnabled = useModuleEnabled("jobs");
  const jobId = id as Id<"jobs"> | undefined;

  const job = useQuery(api.jobs.queries.getById, jobId ? { id: jobId } : "skip");
  const generateUploadUrl = useMutation(api.jobDocuments.actions.generateUploadUrl);
  const createDocument = useMutation(api.jobDocuments.mutations.create);

  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState(searchParams.get("type") ?? "");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [expiryMode, setExpiryMode] = useState<ExpiryMode>("date");
  const [expiryDate, setExpiryDate] = useState("");
  const [durationAmount, setDurationAmount] = useState(30);
  const [durationUnit, setDurationUnit] = useState<"day" | "week" | "month" | "year">("day");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const documentTypes = organization?.settings?.jobDocumentTypes ?? [];
  const selectedDocType = documentTypes.find((dt) => dt.id === documentType);
  const showExpiry = selectedDocType?.requiresExpiry ?? false;

  useEffect(() => {
    if (!showExpiry) {
      setExpiryDate("");
      setDurationAmount(30);
      setDurationUnit("day");
    }
  }, [documentType, showExpiry]);

  const computeExpiryTimestamp = (): number | undefined => {
    if (expiryMode === "date") {
      return parseLocalDate(expiryDate);
    }
    if (durationAmount <= 0) return undefined;
    return addDurationToNow(durationAmount, durationUnit);
  };

  const handleUpload = async () => {
    if (!jobId || !file) {
      setError("Please select a file.");
      return;
    }
    if (!documentType.trim()) {
      setError("Please select a document type.");
      return;
    }
    setError("");
    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const body = await response.json();
      const { storageId } = body;
      if (!storageId) {
        throw new Error("Upload succeeded but no storageId returned");
      }
      const expiryTs = showExpiry ? computeExpiryTimestamp() : undefined;
      const issuedTs = parseLocalDate(issuedDate);

      await createDocument({
        jobId,
        documentType: documentType.trim(),
        storageId,
        fileName: file.name,
        fileType: file.type,
        fileSizeBytes: file.size,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        issuedBy: issuedBy.trim() || undefined,
        issuedDate: issuedTs,
        expiryDate: expiryTs,
      });
      navigate(`/jobs/${jobId}/documents`);
    } catch (err) {
      setError(extractConvexError(err, "Upload failed"));
      setIsUploading(false);
    }
  };

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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/jobs/${jobId}/documents`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold truncate">{job.title}</h1>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="bg-muted/70 px-3 py-2 border-b">
          <h2 className="text-sm font-semibold">Upload document</h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Document type */}
          <div className="space-y-2">
            <Label htmlFor="documentType">Document type</Label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select type…</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name}
                </option>
              ))}
            </select>
            {documentTypes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No job document types defined. Add them in Settings → Job Doc Types.
              </p>
            )}
          </div>

          {/* File */}
          <div className="space-y-2">
            <Label>File</Label>
            {!file ? (
              <DocumentUpload
                onUpload={(f) => {
                  setFile(f);
                  if (!title.trim()) setTitle(f.name);
                }}
                onCancel={() => navigate(`/jobs/${jobId}/documents`)}
                acceptedTypes={["image/*", "application/pdf"]}
                maxSizeMB={10}
              />
            ) : (
              <SelectedFileCard file={file} onRemove={() => setFile(null)} />
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Safety certificate"
              className="h-9"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className="h-9"
            />
          </div>

          {/* Issued by */}
          <div className="space-y-2">
            <Label htmlFor="issuedBy">Issued by (optional)</Label>
            <Input
              id="issuedBy"
              value={issuedBy}
              onChange={(e) => setIssuedBy(e.target.value)}
              placeholder="e.g. Department of Labour"
              className="h-9"
            />
          </div>

          {/* Issued date */}
          <div className="space-y-2">
            <Label htmlFor="issuedDate">Issued date (optional)</Label>
            <Input
              id="issuedDate"
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
              className="h-9 sm:min-w-[160px]"
            />
          </div>

          {/* Expiry - only when document type requires it */}
          {showExpiry && (
            <div className="space-y-3">
              <Label>Expiry</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="expiryMode"
                    checked={expiryMode === "date"}
                    onChange={() => setExpiryMode("date")}
                    className="rounded-full"
                  />
                  Set by date
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="expiryMode"
                    checked={expiryMode === "duration"}
                    onChange={() => setExpiryMode("duration")}
                    className="rounded-full"
                  />
                  Set by duration from today
                </label>
              </div>
              {expiryMode === "date" ? (
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="h-9 w-full max-w-[200px]"
                />
              ) : (
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    type="number"
                    min={1}
                    value={durationAmount}
                    onChange={(e) => setDurationAmount(parseInt(e.target.value, 10) || 0)}
                    className="h-9 w-20"
                  />
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as "day" | "week" | "month" | "year")}
                    className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="day">Day(s)</option>
                    <option value="week">Week(s)</option>
                    <option value="month">Month(s)</option>
                    <option value="year">Year(s)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-2 w-full min-w-0 sm:w-auto">
            <Button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="flex-1 min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Upload"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={() => navigate(`/jobs/${jobId}/documents`)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
