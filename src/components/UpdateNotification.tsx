import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Button } from "@/components/ui/button";

/**
 * Shows a banner when the service worker has a waiting update (new deploy detected).
 * Hidden in development and when no update is available.
 */
export function UpdateNotification() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  if (import.meta.env.DEV || !isUpdateAvailable) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-4 border-t bg-background px-4 py-3 shadow-lg"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-foreground">
        A new version of Pepl is available.
      </p>
      <Button size="sm" onClick={updateServiceWorker}>
        Refresh now
      </Button>
    </div>
  );
}
