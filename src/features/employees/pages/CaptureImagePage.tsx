import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { ImageCapture, compressImage } from "@/components/shared/ImageCapture";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };

export function CaptureImagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoading: userLoading } = useCurrentUser();
  const employeeId = id as Id<"employees"> | undefined;
  const employee = useQuery(
    api.employees.queries.getById,
    employeeId ? { id: employeeId } : "skip"
  );
  const generateUploadUrl = useMutation(api.employees.actions.generateImageUploadUrl);
  const saveEmployeeImage = useMutation(api.employees.actions.saveEmployeeImage);
  const deleteEmployeeImage = useMutation(api.employees.actions.deleteEmployeeImage);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCapture = async (file: File) => {
    if (!employeeId) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 500);
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": compressed.type },
        body: compressed,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const { storageId } = await response.json();
      await saveEmployeeImage({ employeeId, storageId });
      navigate(`/employees/${employeeId}`);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!employeeId) return;
    if (!window.confirm("Remove this photo? You can add a new one anytime.")) return;
    setIsDeleting(true);
    try {
      await deleteEmployeeImage({ employeeId });
      navigate(`/employees/${employeeId}`);
    } finally {
      setIsDeleting(false);
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
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <Link to={`/employees/${employeeId}`} className="shrink-0">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold break-words min-w-0 flex-1">{displayName}</h1>
      </div>

      {employee.imageUrl && (
        <div className="rounded-lg border bg-card overflow-hidden p-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">Current photo</p>
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden border bg-muted shrink-0">
              <img
                src={employee.imageUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? "Removing…" : "Delete photo"}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card overflow-hidden p-4">
        <p className="text-sm font-medium text-muted-foreground mb-3">
          {employee.imageUrl ? "Replace photo" : "Add photo"}
        </p>
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="text-sm">Uploading…</p>
          </div>
        ) : (
          <ImageCapture
            onCapture={handleCapture}
            onCancel={() => navigate(`/employees/${employeeId}`)}
            maxSizeKB={500}
          />
        )}
      </div>
    </div>
  );
}
