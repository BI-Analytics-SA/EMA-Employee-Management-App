import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, CameraOff, SwitchCamera } from "lucide-react";
import { getVideoDevices, getVideoConstraints, friendlyLabel, type CameraDevice } from "@/lib/camera";

const DEFAULT_MAX_SIZE_KB = 500;
const MAX_DIMENSION = 1024;

export type ImageCaptureProps = {
  onCapture: (file: File) => void;
  onCancel?: () => void;
  maxSizeKB?: number;
  /** When true, only show camera flow (no "Choose file" option). Used when embedded in CameraModal. */
  cameraOnly?: boolean;
};

/** Compress image to under maxSizeKB using canvas; returns Blob (JPEG). */
export async function compressImage(
  file: File,
  maxSizeKB: number = DEFAULT_MAX_SIZE_KB
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      let width = w;
      let height = h;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.8;
      const tryExport = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }
            if (blob.size <= maxSizeKB * 1024 || quality <= 0.2) {
              resolve(blob);
              return;
            }
            quality -= 0.1;
            tryExport();
          },
          "image/jpeg",
          quality
        );
      };
      tryExport();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/** Blob to File with a filename. */
function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

export function ImageCapture({
  onCapture,
  onCancel,
  maxSizeKB = DEFAULT_MAX_SIZE_KB,
  cameraOnly = false,
}: ImageCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"choosing" | "camera" | "preview" | "error">(
    cameraOnly ? "camera" : "choosing"
  );
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraIdx, setCameraIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = useCallback(
    async (deviceId?: string | null) => {
      setState("camera");
      setErrorMessage("");
      stopCamera();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: getVideoConstraints(deviceId),
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        getVideoDevices().then((list) => {
          setCameras(list);
          if (deviceId) {
            const idx = list.findIndex((c) => c.deviceId === deviceId);
            if (idx >= 0) setCameraIdx(idx);
          } else {
            const track = stream.getVideoTracks()[0];
            const trackId = track?.getSettings?.()?.deviceId;
            const idx = trackId ? list.findIndex((c) => c.deviceId === trackId) : -1;
            setCameraIdx(idx >= 0 ? idx : 0);
          }
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
          setErrorMessage("Camera access was denied.");
        } else if (msg.includes("NotFoundError") || msg.includes("not found")) {
          setErrorMessage("No camera found.");
        } else {
          setErrorMessage(msg || "Failed to start camera.");
        }
        setState("error");
      }
    },
    [stopCamera]
  );

  const handleSwitchCamera = useCallback(() => {
    if (cameras.length < 2) return;
    const nextIdx = (cameraIdx + 1) % cameras.length;
    const nextId = cameras[nextIdx].deviceId;
    startCamera(nextId);
  }, [cameras, cameraIdx, startCamera]);

  useEffect(() => {
    if (cameraOnly && state === "camera") {
      startCamera();
    }
  }, [cameraOnly, state, startCamera]);

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        stopCamera();
        try {
          const compressed = await compressImage(blobToFile(blob, "capture.jpg"), maxSizeKB);
          setPreviewBlob(compressed);
          setState("preview");
        } catch {
          setPreviewBlob(blob);
          setState("preview");
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleConfirmPreview = () => {
    if (!previewBlob) return;
    const file = blobToFile(previewBlob, `capture-${Date.now()}.jpg`);
    onCapture(file);
    setPreviewBlob(null);
  };

  const handleRetake = () => {
    setPreviewBlob(null);
    setState(cameraOnly ? "camera" : "choosing");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const compressed = await compressImage(file, maxSizeKB);
      const outFile = blobToFile(compressed, file.name.replace(/\.[^.]+$/, ".jpg") || "image.jpg");
      onCapture(outFile);
    } catch {
      onCapture(file);
    }
  };

  if (state === "preview" && previewBlob) {
    const previewUrl = URL.createObjectURL(previewBlob);
    return (
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden bg-muted border aspect-square max-h-[70vh] flex items-center justify-center">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full max-h-[70vh] w-auto h-auto object-contain"
            onLoad={() => URL.revokeObjectURL(previewUrl)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleConfirmPreview}>
            Use photo
          </Button>
          <Button type="button" variant="outline" onClick={handleRetake}>
            Retake
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (state === "camera") {
    return (
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] max-h-[60vh]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {cameras.length >= 2 && (
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                {friendlyLabel(cameras[cameraIdx], cameraIdx)} ({cameraIdx + 1}/{cameras.length})
              </span>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full shadow-md"
                onClick={handleSwitchCamera}
                aria-label="Switch camera"
              >
                <SwitchCamera className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleCapture}>
            <Camera className="h-4 w-4 mr-2" />
            Capture
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              stopCamera();
              if (cameraOnly && onCancel) onCancel();
              else setState("choosing");
            }}
          >
            Back
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-3 text-center py-4">
        <CameraOff className="h-12 w-12 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        <div className="flex gap-2 justify-center">
          <Button type="button" variant="outline" onClick={() => setState(cameraOnly ? "camera" : "choosing")}>
            Back
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!cameraOnly && state === "choosing") {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => startCamera()}>
            <Camera className="h-4 w-4 mr-2" />
            Use camera
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
