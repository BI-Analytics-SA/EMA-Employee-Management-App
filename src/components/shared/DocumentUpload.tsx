import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";
import { CameraModal } from "@/components/shared/CameraModal";
import { FileUploadModal } from "@/components/shared/FileUploadModal";

const DEFAULT_MAX_SIZE_MB = 10;

export type DocumentUploadProps = {
  onUpload: (file: File) => void;
  onCancel?: () => void;
  /** MIME types e.g. "image/*", "application/pdf". Default: images + PDF. */
  acceptedTypes?: string[];
  maxSizeMB?: number;
  /** If true, show "Use camera" option. Default true when acceptedTypes include images. */
  allowCamera?: boolean;
};

export function DocumentUpload({
  onUpload,
  onCancel,
  acceptedTypes = ["image/*", "application/pdf"],
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  allowCamera = acceptedTypes.some((t) => t.startsWith("image") || t === "image/*"),
}: DocumentUploadProps) {
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

  const maxBytes = maxSizeMB * 1024 * 1024;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Add a document by camera or file. Max {maxSizeMB} MB.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {allowCamera && (
            <Button type="button" onClick={() => setShowCameraModal(true)}>
              <Camera className="h-4 w-4 mr-2" />
              Use camera
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => setShowFileModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload file
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <CameraModal
        open={showCameraModal}
        onCapture={(file) => {
          if (file.size > maxBytes) return;
          onUpload(file);
          setShowCameraModal(false);
        }}
        onClose={() => setShowCameraModal(false)}
        maxSizeKB={500}
      />

      <FileUploadModal
        open={showFileModal}
        onSelect={(file) => {
          onUpload(file);
          setShowFileModal(false);
        }}
        onClose={() => setShowFileModal(false)}
        acceptedTypes={acceptedTypes}
        maxSizeMB={maxSizeMB}
      />
    </div>
  );
}
