import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentUpload } from "@/components/shared/DocumentUpload";
import { SelectedFileCard } from "@/components/shared/SelectedFileCard";
import { Loader2, ArrowLeft } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState, useEffect } from "react";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };

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

export function DocumentUploadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoading: userLoading } = useCurrentUser();
  const employeeId = id as Id<"employees"> | undefined;
  const employee = useQuery(
    api.employees.queries.getById,
    employeeId ? { id: employeeId } : "skip"
  );
  const organization = useQuery(api.organizations.queries.getCurrentUserOrganization);
  const generateUploadUrl = useMutation(api.documents.actions.generateDocumentUploadUrl);
  const createDocument = useMutation(api.documents.mutations.create);

  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
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

  const documentTypes = organization?.settings?.documentTypes ?? [];
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
      if (!expiryDate.trim()) return undefined;
      const t = new Date(expiryDate).getTime();
      return Number.isNaN(t) ? undefined : t;
    }
    if (durationAmount <= 0) return undefined;
    return addDurationToNow(durationAmount, durationUnit);
  };

  const handleUpload = async () => {
    if (!employeeId || !file) {
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
      const { storageId } = await response.json();
      const expiryTs = showExpiry ? computeExpiryTimestamp() : undefined;
      const issuedTs = issuedDate.trim()
        ? (() => {
            const t = new Date(issuedDate).getTime();
            return Number.isNaN(t) ? undefined : t;
          })()
        : undefined;

      await createDocument({
        employeeId,
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
      navigate(`/employees/${employeeId}/documents`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
    }
  };

  if (userLoading || !employeeId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (employee === undefined) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (employee === null) {
    return (
      <div className="p-4">
        <p className="text-destructive">Employee not found.</p>
        <Link to="/employees">
          <Button variant="link" className="mt-2">Back to list</Button>
        </Link>
      </div>
    );
  }

  const displayName = `${TITLES[employee.title] ?? employee.title} ${employee.firstName} ${employee.lastName}`;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Link to={`/employees/${employeeId}/documents`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold truncate">{displayName}</h1>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden p-4 space-y-4">
        <h2 className="text-sm font-semibold">Upload document</h2>

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
              No document types defined. Add them in Settings → Document types.
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
              onCancel={() => navigate(`/employees/${employeeId}/documents`)}
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
            placeholder="e.g. ID Book copy"
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
            placeholder="e.g. Department of Home Affairs"
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
            className="h-9"
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

        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={isUploading || !file}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading…
              </>
            ) : (
              "Upload"
            )}
          </Button>
          <Link to={`/employees/${employeeId}/documents`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
