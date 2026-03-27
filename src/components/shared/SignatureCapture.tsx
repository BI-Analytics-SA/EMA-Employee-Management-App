import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pen, Trash2, Check, X } from "lucide-react";

export type SignatureCaptureProps = {
  onSave: (file: File) => void;
  onCancel?: () => void;
  existingSignatureUrl?: string;
  width?: number;
  height?: number;
  penColor?: string;
  penWidth?: number;
  label?: string;
};

const DEFAULT_HEIGHT = 200;
const DEFAULT_PEN_WIDTH = 2;
const DEFAULT_PEN_COLOR = "currentColor";
/** Padding (in pixels) around the cropped signature when exporting. */
const CROP_PADDING = 8;

/**
 * Get the bounding box of non-transparent pixels on the canvas (in backing store pixels).
 * Returns null if no drawn content is found.
 */
function getSignatureBoundingBox(
  canvas: HTMLCanvasElement
): { x: number; y: number; width: number; height: number } | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let hasPixels = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const alpha = data[i + 3];
      if (alpha > 0) {
        hasPixels = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasPixels) return null;
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  if (width <= 0 || height <= 0) return null;
  return { x: minX, y: minY, width, height };
}

/**
 * Export the canvas cropped to the signature content (with padding) as a PNG blob.
 * Falls back to full canvas if cropping would be invalid.
 */
function exportCroppedSignatureAsBlob(
  canvas: HTMLCanvasElement,
  padding: number = CROP_PADDING,
  callback: (blob: Blob) => void
): void {
  const box = getSignatureBoundingBox(canvas);
  const dpr = window.devicePixelRatio ?? 1;

  let sx: number, sy: number, sw: number, sh: number;
  if (box && box.width > 0 && box.height > 0) {
    const pad = Math.min(padding * dpr, Math.floor(box.width / 2), Math.floor(box.height / 2));
    sx = Math.max(0, box.x - pad);
    sy = Math.max(0, box.y - pad);
    const maxX = Math.min(canvas.width, box.x + box.width + pad);
    const maxY = Math.min(canvas.height, box.y + box.height + pad);
    sw = maxX - sx;
    sh = maxY - sy;
  } else {
    sx = 0;
    sy = 0;
    sw = canvas.width;
    sh = canvas.height;
  }

  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  const outCtx = out.getContext("2d");
  if (!outCtx) {
    canvas.toBlob((b) => b && callback(b), "image/png", 1);
    return;
  }
  outCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  out.toBlob(
    (blob) => {
      if (blob) callback(blob);
      else canvas.toBlob((b) => b && callback(b), "image/png", 1);
    },
    "image/png",
    1
  );
}

/** Return drawing coordinates in canvas logical (CSS) space. */
function getPoint(
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  if ("touches" in e && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  }
  if ("clientX" in e) {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
  return null;
}

function getPointFromTouch(
  e: TouchEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number } | null {
  if (e.touches.length === 0) return null;
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.touches[0].clientX - rect.left,
    y: e.touches[0].clientY - rect.top,
  };
}

export function SignatureCapture({
  onSave,
  onCancel,
  existingSignatureUrl,
  width,
  height = DEFAULT_HEIGHT,
  penColor = DEFAULT_PEN_COLOR,
  penWidth = DEFAULT_PEN_WIDTH,
  label,
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showExisting, setShowExisting] = useState(!!existingSignatureUrl);
  /** When true, user clicked "Sign again" – don’t sync showExisting from prop until URL changes (new signature saved). */
  const [userDismissedExisting, setUserDismissedExisting] = useState(false);
  const prevExistingUrlRef = useRef(existingSignatureUrl);
  /** Local data-URL preview of what the user just drew (shown after they click Save in the pad). */
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio ?? 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    const displayW = width ?? canvas.parentElement?.clientWidth ?? 300;
    const displayH = height || DEFAULT_HEIGHT;
    const backingW = Math.round(displayW * dpr);
    const backingH = Math.round(displayH * dpr);
    canvas.width = backingW;
    canvas.height = backingH;
    ctx.scale(dpr, dpr);
    canvas.style.width = width ? `${width}px` : "100%";
    canvas.style.height = `${displayH}px`;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [width, height, penColor, penWidth]);

  useEffect(() => {
    if (showExisting) return;
    initCanvas();
  }, [showExisting, initCanvas]);

  useEffect(() => {
    const urlChanged = existingSignatureUrl !== prevExistingUrlRef.current;
    if (urlChanged) {
      prevExistingUrlRef.current = existingSignatureUrl;
      setUserDismissedExisting(false);
      // Server URL updated (new signature saved) – drop the local preview
      setLocalPreviewUrl(null);
    }
    if (!userDismissedExisting) {
      setShowExisting(!!existingSignatureUrl);
    }
  }, [existingSignatureUrl, userDismissedExisting]);

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (showExisting) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const point = getPoint(e, canvas);
      if (!point) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      setIsDrawing(true);
      setHasDrawn(true);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    },
    [showExisting]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || showExisting) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const point = getPoint(e, canvas);
      if (!point) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    },
    [isDrawing, showExisting]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || showExisting) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const point = getPointFromTouch(e, canvas);
      if (!point) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      setIsDrawing(true);
      setHasDrawn(true);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const point = getPointFromTouch(e, canvas);
      if (!point) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    };

    const handleTouchEnd = () => {
      setIsDrawing(false);
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [showExisting, isDrawing]);

  const handleSave = useCallback(() => {
    if (showExisting) return;
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    exportCroppedSignatureAsBlob(canvas, CROP_PADDING, (blob) => {
      const file = new File(
        [blob],
        `signature-${Date.now()}.png`,
        { type: "image/png" }
      );
      // Show a preview of the newly drawn signature
      const previewUrl = URL.createObjectURL(blob);
      setLocalPreviewUrl(previewUrl);
      setShowExisting(true);
      setUserDismissedExisting(true); // don't let the old server URL override
      onSave(file);
    });
  }, [showExisting, hasDrawn, onSave]);

  const handleClearAndRedraw = useCallback(() => {
    setUserDismissedExisting(true);
    setShowExisting(false);
    setHasDrawn(false);
    // Revoke the local preview if any
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
    }
    setTimeout(initCanvas, 0);
  }, [initCanvas, localPreviewUrl]);

  const visibleSignatureUrl = localPreviewUrl || existingSignatureUrl;

  if (showExisting && visibleSignatureUrl) {
    return (
      <div className="space-y-2">
        {label && (
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        )}
        <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 overflow-hidden">
          <img
            src={visibleSignatureUrl}
            alt="Existing signature"
            className="w-full h-auto max-h-[200px] object-contain bg-white"
            onError={() => {
              // If the image fails to load (e.g. storage file deleted), fall back to the drawing canvas
              setShowExisting(false);
              setUserDismissedExisting(true);
              setHasDrawn(false);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAndRedraw}
          >
            <Pen className="h-4 w-4 mr-1" />
            Sign again
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      )}
      <div
        className="rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted/20 overflow-hidden touch-none"
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
          style={{ width: width ? `${width}px` : "100%", height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
      <div className="flex flex-wrap gap-2 w-full min-w-0 sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          disabled={!hasDrawn}
          className="flex-1 min-w-[100px]"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!hasDrawn}
          className="flex-1 min-w-[100px]"
        >
          <Check className="h-4 w-4 mr-1" />
          Save
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="flex-1 min-w-[100px]">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
