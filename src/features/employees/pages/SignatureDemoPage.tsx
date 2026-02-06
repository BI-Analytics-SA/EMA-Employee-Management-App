import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { SignatureCapture } from "@/components/shared/SignatureCapture";
import { Loader2, ArrowLeft } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };

export function SignatureDemoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoading: userLoading } = useCurrentUser();
  const employeeId = id as Id<"employees"> | undefined;
  const employee = useQuery(
    api.employees.queries.getById,
    employeeId ? { id: employeeId } : "skip"
  );
  const generateUploadUrl = useMutation(api.lib.storage.generateUploadUrl);
  const [uploadedStorageId, setUploadedStorageId] = useState<Id<"_storage"> | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const signatureUrl = useQuery(
    api.lib.storage.getStorageUrl,
    uploadedStorageId ? { storageId: uploadedStorageId } : "skip"
  );

  const handleSave = async (file: File) => {
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
      setUploadedStorageId(storageId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignAgain = () => {
    setUploadedStorageId(null);
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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link to={`/employees/${employeeId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-bold truncate">{displayName}</h1>
        <div className="w-16" />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Test signature capture (demo) — not saved to any record. For use in Contracts and Medical later.
        </p>
      </div>

      {uploadedStorageId && signatureUrl ? (
        <div className="rounded-lg border bg-card overflow-hidden p-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Uploaded signature (preview)</p>
          <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 p-4 flex items-center justify-center min-h-[200px]">
            <img
              src={signatureUrl}
              alt="Uploaded signature"
              className="max-w-full max-h-[280px] object-contain"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSignAgain}>
            Sign again
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden p-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Capture signature</p>
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-sm">Uploading…</p>
            </div>
          ) : (
            <SignatureCapture
              onSave={handleSave}
              onCancel={() => navigate(`/employees/${employeeId}`)}
              label="Sign below"
            />
          )}
        </div>
      )}
    </div>
  );
}
