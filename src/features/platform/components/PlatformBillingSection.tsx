import { useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import * as XLSX from "xlsx";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Lightbulb, ChevronDown } from "lucide-react";
import { PlatformTrendChart } from "./PlatformTrendChart";
import { cn } from "@/lib/utils";
import { formatDateInput } from "@/lib/dateUtils";

const MODULE_SHORT: Record<string, string> = {
  contracts: "Con",
  documents: "Doc",
  exporting: "Exp",
  jobs: "Job",
};

/** Uncontrolled date input — commits on blur so month arrows don't refetch mid-picker. */
function BillingDateInput({
  id,
  label,
  defaultValue,
  onCommit,
  className,
}: {
  id: string;
  label: string;
  defaultValue: string;
  onCommit: (value: string) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        ref={inputRef}
        id={id}
        type="date"
        key={defaultValue}
        defaultValue={defaultValue}
        className={className}
        onBlur={() => {
          const value = inputRef.current?.value;
          if (value && value !== defaultValue) {
            onCommit(value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
}

function formatDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPlan(status: string): string {
  switch (status) {
    case "trial":
      return "Trial";
    case "active":
      return "Paid";
    case "expired":
      return "Expired";
    case "legacy_active":
      return "Legacy (paid)";
    default:
      return status;
  }
}

const ANALYTICS_IDEAS = [
  "Last login per org and active users in the last 7/30 days (from profile lastLoginAt).",
  "Employee growth: new employees added per month per org.",
  "Module adoption: % of paid orgs with each module enabled.",
  "Trial conversion rate: sign-ups that received planActivatedAt within 14 days.",
  "Churn risk: paid orgs with no login in 30+ days.",
  "Average revenue per organisation (ARPO) and module attach rate.",
  "Contract/document activity: counts of records created per org per month (needs usage aggregates).",
  "Time-to-first-employee after sign-up.",
];

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  planStatus: string;
  signedUpAt: number;
  payingSince: number | null;
  daysAsPayingCustomer: number | null;
  isInvoiced: boolean;
  isTrialUsage: boolean;
  moduleSource: string;
  modules: Record<string, boolean>;
  moduleCount: number;
  monthlyInvoiceZar: number;
  memberCount: number;
  activeMembers30d: number;
  employeeCount: number;
  lastActiveAt: number | null;
};

function ModuleBadges({ row }: { row: OrgRow }) {
  return (
    <>
      <div className="flex flex-wrap gap-1">
        {(["contracts", "documents", "exporting", "jobs"] as const).map((key) => (
          <span
            key={key}
            className={cn(
              "rounded px-1.5 py-0.5 text-xs border",
              row.modules[key]
                ? "bg-accent/15 border-accent/40 text-foreground"
                : "bg-muted/50 text-muted-foreground border-transparent"
            )}
            title={key}
          >
            {MODULE_SHORT[key]}
          </span>
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground capitalize">{row.moduleSource}</span>
    </>
  );
}

function OrgTable({
  rows,
  showRevenue,
  footerLabel,
}: {
  rows: OrgRow[];
  showRevenue: boolean;
  footerLabel: string;
}) {
  const totals = useMemo(() => {
    return {
      modules: rows.reduce((s, r) => s + r.moduleCount, 0),
      revenue: rows.reduce((s, r) => s + r.monthlyInvoiceZar, 0),
    };
  }, [rows]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium">Organisation</th>
            <th className="px-3 py-2 font-medium">Plan</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Signed up</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Paying since</th>
            <th className="px-3 py-2 font-medium">Days paid</th>
            <th className="px-3 py-2 font-medium">Modules</th>
            <th className="px-3 py-2 font-medium text-right">Count</th>
            {showRevenue && (
              <th className="px-3 py-2 font-medium text-right whitespace-nowrap">R/mo ex VAT</th>
            )}
            <th className="px-3 py-2 font-medium text-right">Employees</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Last active</th>
            <th className="px-3 py-2 font-medium text-right">Active 30d</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-muted/30">
              <td className="px-3 py-2">
                <div className="font-medium">{row.name}</div>
                <div className="text-xs text-muted-foreground">{row.slug}</div>
              </td>
              <td className="px-3 py-2">{formatPlan(row.planStatus)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.signedUpAt)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.payingSince)}</td>
              <td className="px-3 py-2 text-right">{row.daysAsPayingCustomer ?? "—"}</td>
              <td className="px-3 py-2">
                <ModuleBadges row={row} />
              </td>
              <td className="px-3 py-2 text-right font-medium">{row.moduleCount}</td>
              {showRevenue && (
                <td className="px-3 py-2 text-right font-medium">
                  R{row.monthlyInvoiceZar.toLocaleString()}
                </td>
              )}
              <td className="px-3 py-2 text-right">{row.employeeCount}</td>
              <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                {formatDate(row.lastActiveAt)}
              </td>
              <td className="px-3 py-2 text-right">{row.activeMembers30d}</td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && (
          <tfoot>
            <tr className="bg-muted/40 font-semibold">
              <td className="px-3 py-2" colSpan={6}>
                {footerLabel} ({rows.length} orgs)
              </td>
              <td className="px-3 py-2 text-right">{totals.modules}</td>
              {showRevenue && (
                <td className="px-3 py-2 text-right">R{totals.revenue.toLocaleString()}</td>
              )}
              <td colSpan={3} />
            </tr>
          </tfoot>
        )}
      </table>
      {rows.length === 0 && (
        <p className="p-6 text-sm text-muted-foreground text-center">No organisations in this group.</p>
      )}
    </div>
  );
}

export function PlatformBillingSection() {
  const now = Date.now();
  const defaultStart = now - 90 * 24 * 60 * 60 * 1000;

  const [rangeStart, setRangeStart] = useState(() => formatDateInput(defaultStart));
  const [rangeEnd, setRangeEnd] = useState(() => formatDateInput(now));
  const [granularity, setGranularity] = useState<"day" | "month">("month");
  const [expiredTrialsOpen, setExpiredTrialsOpen] = useState(false);

  const analytics = useQuery(api.platform.queries.getBillingAnalytics, {
    startDate: rangeStart,
    endDate: rangeEnd,
    granularity,
  });

  const exportExcel = () => {
    if (!analytics?.invoicingRows) return;
    const paid = analytics.invoicingRows.map((r) => ({
      Organisation: r.name,
      Slug: r.slug,
      Plan: formatPlan(r.planStatus),
      "Signed up": formatDate(r.signedUpAt),
      "Paying since": formatDate(r.payingSince),
      "Days as paying customer": r.daysAsPayingCustomer ?? "",
      "Module source": r.moduleSource,
      Contracts: r.modules.contracts ? "Yes" : "",
      Documents: r.modules.documents ? "Yes" : "",
      Exporting: r.modules.exporting ? "Yes" : "",
      Jobs: r.modules.jobs ? "Yes" : "",
      "Module count": r.moduleCount,
      "Monthly (ZAR ex VAT)": r.monthlyInvoiceZar,
      Members: r.memberCount,
      "Active members (30d)": r.activeMembers30d,
      Employees: r.employeeCount,
      "Last active": formatDate(r.lastActiveAt),
    }));
    const trial = (analytics.trialUsageRows ?? []).map((r) => ({
      Organisation: r.name,
      Slug: r.slug,
      "Signed up": formatDate(r.signedUpAt),
      "Enabled modules count": r.moduleCount,
      Contracts: r.modules.contracts ? "Yes" : "",
      Documents: r.modules.documents ? "Yes" : "",
      Exporting: r.modules.exporting ? "Yes" : "",
      Jobs: r.modules.jobs ? "Yes" : "",
      Members: r.memberCount,
      "Last active": formatDate(r.lastActiveAt),
    }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(paid), "Invoicing (paid)");
    if (trial.length > 0) {
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(trial), "Trial usage");
    }
    XLSX.writeFile(book, `pepl-billing-${rangeStart}-to-${rangeEnd}.xlsx`);
  };

  const historyNote =
    analytics &&
    analytics.snapshot.orgsWithPlanHistory < analytics.snapshot.totalOrgs
      ? `${analytics.snapshot.orgsWithPlanHistory} of ${analytics.snapshot.totalOrgs} orgs have plan history for trend lines. Set dates on Manage organisations and save to rebuild history.`
      : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Billing analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            All figures use stored dates only — no estimates. Paid orgs are invoiced on{" "}
            <strong>allowed</strong> modules; trial orgs show <strong>enabled</strong> module usage
            (not billed). Set sign-up, trial, and conversion dates under Manage organisations.
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <BillingDateInput
              id="billing-start"
              label="From"
              defaultValue={rangeStart}
              onCommit={setRangeStart}
              className="w-[160px]"
            />
            <BillingDateInput
              id="billing-end"
              label="To"
              defaultValue={rangeEnd}
              onCommit={setRangeEnd}
              className="w-[160px]"
            />
            <div className="space-y-2">
              <Label>Group by</Label>
              <div className="flex rounded-lg border p-1 gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={granularity === "day" ? "default" : "ghost"}
                  onClick={() => setGranularity("day")}
                >
                  Day
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={granularity === "month" ? "default" : "ghost"}
                  onClick={() => setGranularity("month")}
                >
                  Month
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {analytics ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">On trial (today)</p>
              <p className="text-2xl font-bold">{analytics.snapshot.activeTrial}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Paid (today)</p>
              <p className="text-2xl font-bold">{analytics.snapshot.activePaid}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Invoiced modules (paid)</p>
              <p className="text-2xl font-bold">{analytics.snapshot.totalInvoicedModules}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Trial modules in use</p>
              <p className="text-2xl font-bold">{analytics.snapshot.totalTrialModulesInUse}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Monthly invoicing (paid only)</p>
              <p className="text-2xl font-bold">
                R{analytics.snapshot.totalMonthlyRevenueZar.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organisations over time</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {analytics === undefined && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          <PlatformTrendChart data={analytics?.trend ?? []} />
          <p className="mt-4 text-xs text-muted-foreground">
            New sign-ups and paid activations use <strong>signedUpAt</strong> and{" "}
            <strong>planActivatedAt</strong>. Trial and paid counts at each period end come from
            plan event history (rebuilt when you save an org on Manage organisations).
            {analytics && historyNote && <> {historyNote}</>}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Date range applies when you close the calendar (click a day or click away).
          </p>
        </CardContent>
      </Card>

      {analytics && (
        <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-lg">Invoicing snapshot — paid only (today)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={exportExcel}>
            <Download className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <OrgTable
            rows={analytics.invoicingRows as OrgRow[]}
            showRevenue
            footerLabel="Invoicing totals"
          />
        </CardContent>
      </Card>

      {(analytics.trialUsageRows?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trial module usage (not billed)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <OrgTable
              rows={analytics.trialUsageRows as OrgRow[]}
              showRevenue={false}
              footerLabel="Trial module totals"
            />
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left hover:bg-muted/30 transition-colors"
          onClick={() => setExpiredTrialsOpen((open) => !open)}
          aria-expanded={expiredTrialsOpen}
        >
          <div>
            <p className="text-lg font-semibold">Expired trials</p>
            <p className="text-sm text-muted-foreground">
              {analytics.expiredTrialOrgs.length} organisation
              {analytics.expiredTrialOrgs.length !== 1 ? "s" : ""} — trial ended, not on a paid
              plan
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              expiredTrialsOpen && "rotate-180"
            )}
          />
        </button>
        {expiredTrialsOpen && (
          <CardContent className="p-0 sm:p-0 border-t">
            {analytics.expiredTrialOrgs.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No expired trial organisations.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-3 py-2 font-medium">Organisation</th>
                      <th className="px-3 py-2 font-medium">Signed up</th>
                      <th className="px-3 py-2 font-medium whitespace-nowrap">Trial ended</th>
                      <th className="px-3 py-2 font-medium">Modules</th>
                      <th className="px-3 py-2 font-medium text-right">Count</th>
                      <th className="px-3 py-2 font-medium whitespace-nowrap">Last active</th>
                      <th className="px-3 py-2 font-medium text-right">Active 30d</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.expiredTrialOrgs.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <div className="font-medium">{row.name}</div>
                          <div className="text-xs text-muted-foreground">{row.slug}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {formatDate(row.signedUpAt)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {formatDate(row.trialEndedAt)}
                        </td>
                        <td className="px-3 py-2">
                          <ModuleBadges row={row as OrgRow} />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">{row.moduleCount}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                          {formatDate(row.lastActiveAt)}
                        </td>
                        <td className="px-3 py-2 text-right">{row.activeMembers30d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            More analytics you could add
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
            {ANALYTICS_IDEAS.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
