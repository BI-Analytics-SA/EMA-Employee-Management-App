import { cn } from "@/lib/utils";

export type ExpiryStatus = "expired" | "expiring_soon" | "valid" | "none";

export function getExpiryStatus(
  expiryDate: number | null | undefined,
  daysBeforeExpiry: number = 30
): ExpiryStatus {
  if (expiryDate == null) return "none";
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const threshold = now + daysBeforeExpiry * dayMs;
  if (expiryDate < now) return "expired";
  if (expiryDate <= threshold) return "expiring_soon";
  return "valid";
}

export function formatExpiryDate(expiryDate: number): string {
  return new Date(expiryDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export type ExpiryBadgeProps = {
  /** Expiry timestamp (ms) or null/undefined if no expiry. */
  expiryDate: number | null | undefined;
  /** Number of days before expiry to show "expiring soon". Default 30. */
  daysBeforeExpiry?: number;
  /** Show short label (e.g. "Expired") or full date. Default true = show label. */
  showLabel?: boolean;
  className?: string;
};

const statusConfig: Record<
  ExpiryStatus,
  { label: string; className: string }
> = {
  expired: {
    label: "Expired",
    className: "bg-destructive/15 text-destructive",
  },
  expiring_soon: {
    label: "Expiring soon",
    className: "bg-warning/15 text-warning-foreground",
  },
  valid: {
    label: "Valid",
    className: "bg-success/15 text-success",
  },
  none: {
    label: "No expiry",
    className: "bg-muted text-muted-foreground",
  },
};

export function ExpiryBadge({
  expiryDate,
  daysBeforeExpiry = 30,
  showLabel = true,
  className,
}: ExpiryBadgeProps) {
  const status = getExpiryStatus(expiryDate, daysBeforeExpiry);
  const config = statusConfig[status];
  const dateStr = expiryDate != null ? formatExpiryDate(expiryDate) : "";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
      title={expiryDate != null ? `Expires: ${dateStr}` : undefined}
    >
      {showLabel ? config.label : dateStr || "—"}
    </span>
  );
}
