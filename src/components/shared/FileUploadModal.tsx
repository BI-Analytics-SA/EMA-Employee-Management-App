import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { compressImage } from "@/components/shared/ImageCapture";

const DEFAULT_MAX_SIZE_MB = 10;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function isImageType(type: string): boolean {
  return IMAGE_TYPES.includes(type) || type.startsWith("image/");
}

export type FileUploadModalProps = {
  open: boolean;
  onSelect: (file: File) => void;
  onClose: () => void;
  /** MIME types e.g. "image/*", "application/pdf". Default: images + PDF. */
  acceptedTypes?: string[];
  maxSizeMB?: number;
};

export function FileUploadModal({
  open,
  onSelect,
  onClose,
  acceptedTypes = ["image/*", "application/pdf"],
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}: FileUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const validateAndAccept = useCallback(
    async (file: File) => {
      setError("");
      if (file.size > maxBytes) {
        setError(`File must be under ${maxSizeMB} MB`);
        return;
      }
      const accepted =
        acceptedTypes.length === 0 ||
        acceptedTypes.some((t) => {
          if (t.endsWith("/*")) {
            const prefix = t.slice(0, -1);
            return file.type.startsWith(prefix) || file.type === t.replace("/*", "");
          }
          return file.type === t;
        });
      if (!accepted) {
        setError(`File type ${file.type || "unknown"} is not accepted`);
        return;
      }
      if (isImageType(file.type)) {
        try {
          const compressed = await compressImage(file, 500);
          const out = new File(
            [compressed],
            file.name.replace(/\.[^.]+$/, ".jpg") || "image.jpg",
            { type: compressed.type }
          );
          onSelect(out);
          onClose();
        } catch {
          onSelect(file);
          onClose();
        }
      } else {
        onSelect(file);
        onClose();
      }
    },
    [acceptedTypes, maxBytes, maxSizeMB, onSelect, onClose]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    validateAndAccept(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    validateAndAccept(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const acceptAttr = acceptedTypes.length > 0 ? acceptedTypes.join(",") : undefined;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upload file"
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg bg-background shadow-lg overflow-hidden">
        <div className="flex items-center justify-between border-b px-3 py-2 shrink-0">
          <span className="text-sm font-medium">Upload file</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-auto p-4 space-y-3">
          <div
            className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 bg-muted/30"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <p className="text-sm text-muted-foreground mb-3">
              Drag and drop a file here, or choose below. Max {maxSizeMB} MB.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose file
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttr}
            className="hidden"
            onChange={handleFileChange}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
