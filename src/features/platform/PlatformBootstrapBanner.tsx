import { useMutation, useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2, Shield } from "lucide-react";
import { useState } from "react";

export function PlatformBootstrapBanner() {
  const canBootstrap = useQuery(api.platform.queries.canBootstrapPlatform);
  const bootstrap = useMutation(api.platform.mutations.bootstrapIfEmpty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (canBootstrap !== true) return null;

  const handleBootstrap = async () => {
    setBusy(true);
    setError(null);
    try {
      await bootstrap({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Set up platform administration</p>
          <p className="text-xs text-muted-foreground mt-1">
            Enable your account to manage all organisations, plans, and module entitlements.
          </p>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" onClick={handleBootstrap} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          Activate platform access
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to="/platform/organizations">Open after setup</Link>
        </Button>
      </div>
    </div>
  );
}
