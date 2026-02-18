import { useEffect, useRef, useState } from "react";
import { APP_VERSION } from "@/lib/version";

const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface VersionResponse {
  version: string;
}

/**
 * Polls /version.json and compares to the running app version.
 * Used as Layer 3 (safety net) for update detection when SW update is slow or absent.
 */
export function useVersionCheck(): { updateAvailable: boolean } {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = async () => {
    try {
      const res = await fetch("/version.json", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as VersionResponse;
      if (data.version && data.version !== APP_VERSION) {
        setUpdateAvailable(true);
      }
    } catch {
      // Ignore network errors (e.g. dev without version.json)
    }
  };

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, VERSION_CHECK_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        check();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return { updateAvailable };
}
