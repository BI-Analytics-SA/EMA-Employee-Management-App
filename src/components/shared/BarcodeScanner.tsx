import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Loader2, X, CameraOff, SwitchCamera } from "lucide-react";
import { getVideoDevices, type CameraDevice } from "@/lib/camera";

const READER_ID = "barcode-scanner-reader";

// Prioritise Code 128 (SA ID barcodes) and QR; include other common barcodes
const FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
];

export type BarcodeScannerProps = {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
};

type ScannerState = "idle" | "requesting" | "active" | "denied" | "unavailable";

export function BarcodeScanner({ open, onClose, onDetected }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [state, setState] = useState<ScannerState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [switchTrigger, setSwitchTrigger] = useState(0);
  const nextDeviceIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setState("idle");
      setErrorMessage("");
      setCameras([]);
      setCurrentDeviceId(null);
      return;
    }

    let mounted = true;
    setState("requesting");
    setErrorMessage("");

    const cameraIdOrConfig: string | { facingMode: "environment" } =
      nextDeviceIdRef.current ?? { facingMode: "environment" };
    nextDeviceIdRef.current = null;

    // Library uses our videoConstraints as-is and does NOT merge cameraIdOrConfig into it,
    // so we must include camera selection (facingMode or deviceId) here for it to take effect.
    const baseConstraints = {
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 },
    };
    const videoConstraints =
      typeof cameraIdOrConfig === "string"
        ? { ...baseConstraints, deviceId: { exact: cameraIdOrConfig } }
        : { ...baseConstraints, facingMode: "environment" };

    const startScanner = async () => {
      const element = document.getElementById(READER_ID);
      if (!element || !mounted) return;

      try {
        const html5QrCode = new Html5Qrcode(READER_ID, {
          formatsToSupport: FORMATS,
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          cameraIdOrConfig,
          {
            fps: 6,
            qrbox: (width, height) => ({ width: Math.min(320, width), height: Math.min(140, height * 0.35) }),
            videoConstraints,
          },
          (decodedText) => {
            if (!mounted) return;
            onDetected(decodedText);
            html5QrCode.stop().then(() => {
              scannerRef.current = null;
              onClose();
            });
          },
          () => {
            // Ignore scan errors (e.g. no code in frame)
          }
        );

        if (!mounted) return;
        const settings = html5QrCode.getRunningTrackSettings?.();
        const deviceId = (typeof cameraIdOrConfig === "string" ? cameraIdOrConfig : settings?.deviceId) ?? null;
        setCurrentDeviceId(deviceId);
        setState("active");
        // Fetch camera list for switch button (labels may be filled after permission)
        getVideoDevices().then((list) => {
          if (mounted) setCameras(list);
        });
      } catch (err) {
        if (!mounted) return;
        scannerRef.current = null;
        const message = err instanceof Error ? err.message : String(err);
        if (
          message.includes("NotAllowedError") ||
          message.includes("Permission") ||
          message.includes("permission")
        ) {
          setState("denied");
          setErrorMessage("Camera access was denied. Please allow camera access and try again.");
        } else if (
          message.includes("NotFoundError") ||
          message.includes("no camera") ||
          message.includes("not found")
        ) {
          setState("unavailable");
          setErrorMessage("No camera found on this device.");
        } else {
          setState("unavailable");
          setErrorMessage(message || "Failed to start camera.");
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      const scanner = scannerRef.current;
      if (scanner?.isScanning) {
        scanner
          .stop()
          .then(() => {
            scannerRef.current = null;
          })
          .catch(() => {});
      } else {
        scannerRef.current = null;
      }
    };
  }, [open, switchTrigger, onDetected, onClose]);

  const handleSwitchCamera = () => {
    if (cameras.length < 2) return;
    const idx = cameras.findIndex((c) => c.deviceId === currentDeviceId);
    const nextIdx = idx >= 0 ? (idx + 1) % cameras.length : 0;
    const nextId = cameras[nextIdx].deviceId;
    nextDeviceIdRef.current = nextId;
    setSwitchTrigger((t) => t + 1);
    const scanner = scannerRef.current;
    if (scanner?.isScanning) {
      scanner.stop().catch(() => {});
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-card shadow-lg overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/70 px-3 py-2">
          <h3 className="text-sm font-semibold">Scan ID Number</h3>
          <div className="flex items-center gap-1">
            {state === "active" && cameras.length >= 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={handleSwitchCamera}
                aria-label="Switch camera"
              >
                <SwitchCamera className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => {
                const scanner = scannerRef.current;
                if (scanner?.isScanning) {
                  scanner.stop().then(onClose);
                } else {
                  onClose();
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 min-h-[320px] flex flex-col items-center justify-center relative">
          {/* Reader div must exist when start() runs; library injects video into it */}
          <div
            id={READER_ID}
            className="w-full rounded overflow-hidden [&>div]:!rounded [& video]:!rounded min-h-[280px]"
          />

          {state === "requesting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-card z-10 rounded-b-lg">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-sm">Requesting camera access…</p>
            </div>
          )}

          {(state === "denied" || state === "unavailable") && (
            <>
              <div className="absolute inset-0 bg-card z-10 rounded-b-lg" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center z-20 p-4">
                <CameraOff className="h-12 w-12 text-destructive" />
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>

        {state === "active" && (
          <p className="px-4 pb-3 text-xs text-muted-foreground text-center border-t pt-2">
            For ID barcodes: hold the document close to the camera and keep it steady, or move it slowly into the frame. Good lighting helps.
          </p>
        )}
      </div>
    </div>
  );
}
