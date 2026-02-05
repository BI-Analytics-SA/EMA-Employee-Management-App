import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, ZoomIn, ZoomOut, RotateCw, Loader2, Maximize2 } from "lucide-react";

const STORAGE_KEY = "docViewerSize";
const DEFAULT_WIDTH_PCT = 0.85;
const DEFAULT_HEIGHT_PCT = 0.85;
const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;

export type DocumentViewerProps = {
  /** URL of the document (image or PDF). */
  url: string;
  /** File name for download. */
  fileName?: string;
  /** MIME type e.g. image/jpeg, application/pdf. */
  fileType?: string;
  onClose: () => void;
};

const isPdf = (type: string) =>
  type === "application/pdf" || type?.toLowerCase().includes("pdf");

const isImage = (type: string) =>
  type?.startsWith("image/") ?? false;

export function DocumentViewer({
  url,
  fileName = "document",
  fileType = "",
  onClose,
}: DocumentViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === "undefined") {
      return { width: 1024, height: 768 };
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { width: number; height: number };
        if (parsed.width >= MIN_WIDTH && parsed.height >= MIN_HEIGHT) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return {
      width: Math.round(window.innerWidth * DEFAULT_WIDTH_PCT),
      height: Math.round(window.innerHeight * DEFAULT_HEIGHT_PCT),
    };
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w >= MIN_WIDTH && h >= MIN_HEIGHT) {
        setDimensions((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dimensions));
    } catch {
      // ignore
    }
  }, [dimensions]);

  const handleResetSize = useCallback(() => {
    setDimensions({
      width: Math.round(window.innerWidth * DEFAULT_WIDTH_PCT),
      height: Math.round(window.innerHeight * DEFAULT_HEIGHT_PCT),
    });
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [url, fileName]);

  const showImageControls = isImage(fileType);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Document viewer"
    >
      <div
        ref={containerRef}
        className="relative flex flex-col rounded-lg bg-background shadow-lg overflow-auto resize min-w-[320px] min-h-[240px]"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          maxWidth: "95vw",
          maxHeight: "95vh",
        }}
        onClick={(e) => e.stopPropagation()}
        title="Drag the bottom-right corner to resize"
      >
        {/* Large visible resize handle in corner so users know where to drag */}
        <div
          className="absolute bottom-0 right-0 w-24 h-24 flex flex-col items-end justify-end gap-0.5 p-3 pointer-events-none rounded-tl-xl bg-muted border-t-4 border-l-4 border-foreground/40"
          aria-hidden
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-foreground/70 shrink-0"
          >
            <path d="M21 15v6h-6M3 9V3h6M21 3l-7 7M3 21l7-7" />
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/60">
            Resize
          </span>
        </div>
        <div className="flex items-center justify-between border-b px-3 py-2 shrink-0">
          <span className="truncate text-sm font-medium text-foreground">
            {fileName}
          </span>
          <div className="flex items-center gap-2">
            {showImageControls && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setScale((s) => Math.min(s + 0.25, 3))}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setRotate((r) => (r + 90) % 360)}
                  aria-label="Rotate"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleResetSize}
              aria-label="Reset size"
              title="Reset size"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="gap-1"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download
            </Button>
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
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
          {isPdf(fileType) ? (
            <iframe
              src={url}
              title={fileName}
              className="h-full min-h-[200px] w-full rounded border bg-muted"
            />
          ) : isImage(fileType) ? (
            <img
              src={url}
              alt={fileName}
              className="max-h-full max-w-full object-contain"
              style={{
                transform: `scale(${scale}) rotate(${rotate}deg)`,
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <p className="text-sm">Preview not available for this file type.</p>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download {fileName}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
