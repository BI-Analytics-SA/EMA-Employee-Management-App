import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Registers the service worker and detects when a new version is waiting.
 * Based on the standard SW lifecycle: updatefound → statechange → waiting.
 * Includes a visibilitychange trigger so returning users get prompted quickly.
 */
export function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const updateServiceWorker = useCallback(() => {
    if (!waitingWorker) return;

    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    waitingWorker.addEventListener("statechange", (e) => {
      if ((e.target as ServiceWorker).state === "activated") {
        window.location.reload();
      }
    });
  }, [waitingWorker]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        registrationRef.current = registration;

        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setIsUpdateAvailable(true);
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(newWorker);
              setIsUpdateAvailable(true);
            }
          });
        });
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    register();

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        registrationRef.current
      ) {
        registrationRef.current.update();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return { isUpdateAvailable, updateServiceWorker };
}
