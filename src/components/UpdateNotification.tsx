import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";

const RELOAD_FALLBACK_MS = 1500;

/**
 * Shows a banner only when the service worker has a waiting update (new deploy detected).
 * Single layer: service worker prompt mode.
 */
export function UpdateNotification() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // When the new service worker takes control, reload so the page uses the new build.
  // Clear any pending fallback timeout so we don't double-reload.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onControllerChange = () => {
      if (reloadTimeoutRef.current) {
        clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
    };
  }, []);

  // Only show when the SW has a waiting update (new build detected). Dev excluded.
  const showBanner = !import.meta.env.DEV && needRefresh;

  const handleRefresh = () => {
    if (needRefresh && typeof updateServiceWorker === "function") {
      updateServiceWorker(true);
      // If no waiting worker, controllerchange never fires; reload after a short delay.
      reloadTimeoutRef.current = setTimeout(() => {
        reloadTimeoutRef.current = null;
        window.location.reload();
      }, RELOAD_FALLBACK_MS);
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
