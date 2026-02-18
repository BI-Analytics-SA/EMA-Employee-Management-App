import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { Button } from "@/components/ui/button";

/**
 * Shows a banner when a new app version is available (Layer 2: SW prompt, or Layer 3: version.json).
 * Renders nothing until an update is detected.
 */
export function UpdateNotification() {
  const { updateAvailable } = useVersionCheck();
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh,
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_, registration) {
      registrationRef.current = registration ?? null;
    },
  });

  // When user returns to the tab, ask the browser to check for a new service worker.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && registrationRef.current) {
        registrationRef.current.update();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const showBanner = needRefresh || updateAvailable;

  const handleRefresh = () => {
    if (needRefresh && typeof updateServiceWorker === "function") {
      updateServiceWorker(true);
    } else {
      window.location.reload();
    }
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-4 border-t bg-background px-4 py-3 shadow-lg"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-foreground">
        A new version of Pepl is available.
      </p>
      <Button size="sm" onClick={handleRefresh}>
        Refresh now
      </Button>
    </div>
  );
}
