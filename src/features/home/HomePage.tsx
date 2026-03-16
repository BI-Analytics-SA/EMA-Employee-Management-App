import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import {
  Users,
  AlertTriangle,
  FileText,
  UserPlus,
  FileDown,
  ArrowRight,
  Loader2,
  CalendarOff,
  FileQuestion,
} from "lucide-react";

export function HomePage() {
  const {
    organizationId,
    userName,
    role,
    organization,
    isLoading: userLoading,
  } = useCurrentUser();

  const documentsEnabled = useModuleEnabled("documents");
  const contractsEnabled = useModuleEnabled("contracts");
  const exportingEnabled = useModuleEnabled("exporting");

  const stats = useQuery(
    api.dashboard.queries.getDashboardStats,
    organizationId ? { organizationId } : "skip"
  );

  if (userLoading || !organizationId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isStatsLoading = stats === undefined;

  const roleLabelMap: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    user: "User",
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome card */}
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {userName || "there"}!
            </h1>
            {organization?.name && (
              <p className="mt-1 text-sm text-muted-foreground">
                {organization.name}
              </p>
            )}
          </div>
          {role && (
            <span className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
              {roleLabelMap[role] ?? role}
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Employees */}
        <StatCard
          icon={<Users className="h-5 w-5 text-accent" />}
          value={isStatsLoading ? null : stats.totalEmployees}
          label="Total Employees"
        />

        {/* Employees without Date Engaged */}
        <StatCard
          icon={<CalendarOff className="h-5 w-5 text-warning" />}
          value={isStatsLoading ? null : stats.employeesWithoutDateEngaged}
          label="No Date Engaged"
        />

        {/* Employees without Tax Number */}
        <StatCard
          icon={<FileQuestion className="h-5 w-5 text-warning" />}
          value={isStatsLoading ? null : stats.employeesWithoutTaxNumber}
          label="No Tax Number"
        />

        {/* Signed Contracts -- only when contracts module enabled */}
        {contractsEnabled && (
          <StatCard
            icon={<FileText className="h-5 w-5 text-accent" />}
            value={isStatsLoading ? null : (stats.totalContracts ?? 0)}
            label="Signed Contracts"
          />
        )}

        {/* Expiring Documents -- only when documents module enabled */}
        {documentsEnabled && (
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-warning" />}
            value={
              isStatsLoading ? null : (stats.expiringDocumentsCount ?? 0)
            }
            label="Expiring Documents"
            subtitle="Next 90 days"
          />
        )}
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="w-full min-w-0 sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link to="/employees/new">
                <UserPlus className="h-4 w-4" />
                Add Employee
              </Link>
            </Button>
          </div>
          <div className="w-full min-w-0 sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link to="/employees">
                <Users className="h-4 w-4" />
                View Employees
              </Link>
            </Button>
          </div>
          {exportingEnabled && (
            <div className="w-full min-w-0 sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link to="/employees">
                  <FileDown className="h-4 w-4" />
                  Export to Excel
                </Link>
              </Button>
            </div>
          )}
          {documentsEnabled && (
            <div className="w-full min-w-0 sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link to="/documents/expiring">
                  <AlertTriangle className="h-4 w-4" />
                  Expiring Documents
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Recently added employees */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-muted/70 px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">Recently Added Employees</h2>
          <Link
            to="/employees"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isStatsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stats.recentEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No employees yet. Add your first employee to get started.
            </p>
            <Link to="/employees/new" className="mt-4">
              <Button size="sm">
                <UserPlus className="h-4 w-4" />
                Add Employee
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 border-b bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Employee</span>
              <span className="w-36">ID Number</span>
              <span className="w-28">Added</span>
            </div>
            {/* Rows */}
            <ul className="divide-y">
              {stats.recentEmployees.map((emp) => {
                const initials = `${emp.firstName?.[0] ?? ""}${emp.lastName?.[0] ?? ""}`.toUpperCase();
                const addedDate = new Date(emp.createdAt).toLocaleDateString(
                  "en-ZA",
                  { day: "2-digit", month: "short", year: "numeric" }
                );
                return (
                  <li key={emp._id}>
                    <Link
                      to={`/employees/${emp._id}`}
                      className="flex items-center gap-4 px-4 py-3 min-h-[48px] hover:bg-muted/50 transition-colors"
                    >
                      {/* Avatar */}
                      {emp.imageUrl ? (
                        <img
                          src={emp.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                          {initials}
                        </div>
                      )}
                      {/* Name + subtitle */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {[emp.title, emp.firstName, emp.lastName].map(s => s?.trim()).filter(Boolean).join(" ")}
                        </p>
                        <p className="text-xs text-muted-foreground truncate sm:hidden">
                          ID: {emp.idNumber}
                        </p>
                      </div>
                      {/* ID number (desktop) */}
                      <span className="hidden sm:block w-36 text-sm text-muted-foreground truncate">
                        {emp.idNumber}
                      </span>
                      {/* Date added (desktop) */}
                      <span className="hidden sm:block w-28 text-sm text-muted-foreground truncate">
                        {addedDate}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card sub-component                                            */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  icon: React.ReactNode;
  value: number | null;
  label: string;
  subtitle?: string;
}

function StatCard({ icon, value, label, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card px-3 py-3 shadow-card min-w-0">
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 mt-0.5">
          {icon}
        </div>
        <div className="min-w-0">
          {value === null ? (
            <div className="h-6 w-10 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-xl font-bold leading-tight">{value}</p>
          )}
          <p className="text-[11px] leading-tight text-muted-foreground truncate">{label}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
