import { useState } from "react";
import { X } from "lucide-react";
import { usePlanStatus } from "@/hooks/useModuleEnabled";

const DISMISS_KEY = "pepl-trial-banner-dismissed";

export function TrialBanner() {
  const { isTrial, trialDaysRemaining } = usePlanStatus();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!isTrial || dismissed) return null;

  const dayLabel =
    trialDaysRemaining === 1 ? "1 day" : `${trialDaysRemaining} days`;

  return (
    <div className="relative border-b border-accent/30 bg-accent/10 px-4 py-2.5 text-center text-sm text-foreground">
      <p>
        <span className="font-medium">
          {dayLabel} left in your free trial
        </span>
        {" — "}
        all features included. Contact us when you&apos;re ready to upgrade.
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            sessionStorage.setItem(DISMISS_KEY, "1");
          } catch {
            // ignore
          }
          setDismissed(true);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Dismiss trial banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
