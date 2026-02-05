import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCapture } from "@/components/shared/ImageCapture";

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export type CameraModalProps = {
  open: boolean;
  onCapture: (file: File) => void;
  onClose: () => void;
  maxSizeKB?: number;
};

export function CameraModal({
  open,
  onCapture,
  onClose,
  maxSizeKB = 500,
}: CameraModalProps) {
  if (!open) return null;

  const mobile = isMobile();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Capture photo"
    >
      <div
        className={
          mobile
            ? "flex flex-col w-full h-full max-w-full max-h-full bg-background"
            : "flex flex-col max-w-lg w-full max-h-[90vh] rounded-lg bg-background shadow-lg overflow-hidden"
        }
      >
        <div className="flex items-center justify-between border-b px-3 py-2 shrink-0">
          <span className="text-sm font-medium">Capture photo</span>
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
        <div className="flex-1 overflow-auto p-4">
          <ImageCapture
            cameraOnly
            onCapture={(file) => {
              onCapture(file);
              onClose();
            }}
            onCancel={onClose}
            maxSizeKB={maxSizeKB}
          />
        </div>
      </div>
    </div>
  );
}
