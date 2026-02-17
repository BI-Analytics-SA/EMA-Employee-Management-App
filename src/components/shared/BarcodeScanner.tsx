import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Loader2, X, CameraOff, SwitchCamera } from "lucide-react";
import { getVideoDevices, friendlyLabel, type CameraDevice } from "@/lib/camera";

const READER_ID = "barcode-scanner-reader";

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
  const onDetectedRef = useRef(onDetected);
  const onCloseRef = useRef(onClose);
  const [state, setState] = useState<ScannerState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraIdx, setCameraIdx] = useState(0);
  const mountedRef = useRef(false);
  const switchingRef = useRef(false);

  onDetectedRef.current = onDetected;
  onCloseRef.current = onClose;

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(
    async (deviceId?: string) => {
      if (!mountedRef.current) return;
      setState("requesting");
      setErrorMessage("");

      const element = document.getElementById(READER_ID);
      if (!element || !mountedRef.current) return;

      // Build constraints: include camera selection so the library uses the right device
      const baseConstraints = {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
      };
      const cameraIdOrConfig: string | { facingMode: "environment" } = deviceId ?? {
        facingMode: "environment",
      };
      const videoConstraints = deviceId
        ? { ...baseConstraints, deviceId: { exact: deviceId } }
        : { ...baseConstraints, facingMode: "environment" as const };

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
            qrbox: (w, h) => ({
              width: Math.min(320, w),
              height: Math.min(140, h * 0.35),
            }),
            videoConstraints,
          },
          (decodedText) => {
            if (!mountedRef.current) return;
            onDetectedRef.current(decodedText);
            html5QrCode
              .stop()
              .then(() => {
                scannerRef.current = null;
                onCloseRef.current();
              })
              .catch(() => {});
          },
          () => {}
        );

        if (!mountedRef.current) return;
        setState("active");

        // Fetch all cameras (labels available after permission granted)
        const list = await getVideoDevices();
        if (!mountedRef.current) return;
        setCameras(list);

        // Figure out which index we're on so switch cycles correctly
        if (deviceId) {
          const idx = list.findIndex((c) => c.deviceId === deviceId);
          if (idx >= 0) setCameraIdx(idx);
        } else {
          // Started with facingMode "environment"; match running track to list
          const trackId = html5QrCode.getRunningTrackSettings?.()?.deviceId;
          const idx = trackId ? list.findIndex((c) => c.deviceId === trackId) : -1;
          setCameraIdx(idx >= 0 ? idx : 0);
        }
      } catch (err) {
        if (!mountedRef.current) return;
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
    },
    [stopScanner]
  );

  // Open / close lifecycle — only depends on `open`
  useEffect(() => {
    if (!open) {
      mountedRef.current = false;
      setState("idle");
      setErrorMessage("");
      setCameras([]);
      setCameraIdx(0);
      stopScanner();
      return;
    }

    mountedRef.current = true;
    startScanner();

    return () => {
      mountedRef.current = false;
      stopScanner();
    };
    // startScanner and stopScanner are stable (useCallback with no changing deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSwitchCamera = useCallback(async () => {
    if (cameras.length < 2 || switchingRef.current) return;
    switchingRef.current = true;
    try {
      const nextIdx = (cameraIdx + 1) % cameras.length;
      const nextId = cameras[nextIdx].deviceId;
      setState("requesting");
      await stopScanner();
      await startScanner(nextId);
    } finally {
      switchingRef.current = false;
    }
  }, [cameras, cameraIdx, stopScanner, startScanner]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-lg rounded-lg bg-card shadow-lg overflow-hidden">
        <div className="flex items-center justify-between border-b bg-muted/70 px-3 py-2">
          <h3 className="text-sm font-semibold">Scan ID Number</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => {
              const scanner = scannerRef.current;
              if (scanner?.isScanning) {
                scanner
                  .stop()
                  .then(() => {
                    scannerRef.current = null;
                    onCloseRef.current();
                  })
                  .catch(() => onCloseRef.current());
              } else {
                onCloseRef.current();
              }
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 min-h-[320px] flex flex-col items-center justify-center relative">
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
                <Button variant="outline" size="sm" onClick={() => onCloseRef.current()}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>

        {state === "active" && cameras.length >= 2 && (
          <div className="flex items-center justify-between border-t px-3 py-2">
            <span className="text-xs text-muted-foreground">
              {friendlyLabel(cameras[cameraIdx], cameraIdx)} ({cameraIdx + 1}/{cameras.length})
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleSwitchCamera}
              aria-label="Switch camera"
            >
              <SwitchCamera className="h-4 w-4" />
              Next camera
            </Button>
          </div>
        )}

        {state === "active" && (
          <p className="px-4 pb-3 text-xs text-muted-foreground text-center border-t pt-2">
            For ID barcodes: hold the document close to the camera and keep it steady, or move it slowly into the frame. Good lighting helps.
          </p>
        )}
      </div>
    </div>
  );
}
