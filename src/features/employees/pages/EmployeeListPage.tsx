import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScanner } from "@/components/shared/BarcodeScanner";
import { ClearColumnsDialog } from "@/features/employees/components/ClearColumnsDialog";
import { ExportButton } from "@/features/employees/components/ExportButton";
import { Loader2, UserPlus, Search, QrCode, Users, X, FileUp } from "lucide-react";
import { usePaginatedQuery } from "convex/react";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";

export function EmployeeListPage() {
  const { organizationId, isLoading: userLoading, isAdmin } = useCurrentUser();
  const exportingEnabled = useModuleEnabled("exporting");
  const [searchId, setSearchId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const { results, status, loadMore } = usePaginatedQuery(
    api.employees.queries.list,
    organizationId ? { organizationId } : "skip",
    { initialNumItems: 20 }
  );

  const searchResults = useQuery(
    api.employees.queries.searchByIdNumber,
    organizationId && searchQuery.trim()
      ? { organizationId, idNumber: searchQuery.trim() }
      : "skip"
  );

  if (userLoading || !organizationId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showSearch = searchQuery.trim().length > 0;
  const list = showSearch ? searchResults ?? [] : results ?? [];
  const isLoadingList = showSearch
    ? searchResults === undefined
    : status === "LoadingFirstPage";

  const totalCount = results?.length ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <div className="grid grid-cols-2 gap-2 w-full lg:flex lg:flex-wrap lg:w-auto lg:justify-end">
          {exportingEnabled && (
            <ExportButton className="w-full lg:w-auto" />
          )}
          {isAdmin && (
            <ClearColumnsDialog organizationId={organizationId} />
          )}
          <Button variant="outline" asChild className="w-full lg:w-auto">
            <Link to="/employees/import">
              <FileUp className="h-4 w-4" />
              Import
            </Link>
          </Button>
          <Button asChild className="w-full lg:w-auto">
            <Link to="/employees/new">
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Total Employees</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full min-w-0 sm:flex-1 sm:min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID number (13 digits)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearchQuery(searchId)}
            maxLength={13}
            className={`pl-9${searchQuery ? " pr-8" : ""}`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchId(""); setSearchQuery(""); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Clear filter"
              title="Clear filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex w-full min-w-0 gap-2 sm:w-auto">
          <Button
            onClick={() => setSearchQuery(searchId)}
            className="flex-1 sm:flex-initial min-w-0 px-6"
          >
            Search
          </Button>
          <Button
            variant="outline"
            onClick={() => setScannerOpen(true)}
            title="Scan for ID number"
            className="flex-1 sm:flex-initial min-w-0 px-6"
          >
            <QrCode className="h-4 w-4" />
            Scan
          </Button>
        </div>
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => {
          const trimmed = code.trim();
          setSearchId(trimmed);
          setSearchQuery(trimmed);
          setScannerOpen(false);
        }}
      />

      {/* Employee table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoadingList ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {showSearch
                ? "No employees match that ID number."
                : "No employees yet. Add your first employee to get started."}
            </p>
            {!showSearch && (
              <Link to="/employees/new" className="mt-4">
                <Button size="sm">
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Employee</span>
              <span className="w-36">ID Number</span>
              <span className="w-28">Employee #</span>
            </div>
            {/* Table rows */}
            <ul className="divide-y">
              {list.map((emp) => {
                const initials = `${emp.firstName?.[0] ?? ""}${emp.lastName?.[0] ?? ""}`.toUpperCase();
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
                          {[emp.title, emp.firstName, emp.lastName].filter(Boolean).join(" ")}
                        </p>
                        <p className="text-xs text-muted-foreground truncate sm:hidden">
                          ID: {emp.idNumber}
                        </p>
                      </div>
                      {/* ID number (desktop) */}
                      <span className="hidden sm:block w-36 text-sm text-muted-foreground truncate">
                        {emp.idNumber}
                      </span>
                      {/* Employee number (desktop) */}
                      <span className="hidden sm:block w-28 text-sm text-muted-foreground truncate">
                        {emp.employeeNo || "—"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* Load more */}
        {!showSearch && status === "CanLoadMore" && (
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full" onClick={() => loadMore(20)}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
