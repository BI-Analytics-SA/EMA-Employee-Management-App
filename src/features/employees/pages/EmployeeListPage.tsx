import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarcodeScanner } from "@/components/shared/BarcodeScanner";
import { ExportButton } from "@/features/employees/components/ExportButton";
import { Loader2, UserPlus, Search, QrCode, Users, X } from "lucide-react";
import { usePaginatedQuery } from "convex/react";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";

export function EmployeeListPage() {
  const { organizationId, isLoading: userLoading } = useCurrentUser();
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <div className="flex flex-wrap w-full gap-2 sm:w-auto min-w-0">
          {exportingEnabled && (
            <div className="flex-1 min-w-0 sm:flex-initial">
              <ExportButton className="w-full sm:w-auto" />
            </div>
          )}
          <Button asChild className="flex-1 min-w-0 sm:flex-initial w-full sm:w-auto">
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
            className="pl-9"
          />
        </div>
        <div className="flex w-full min-w-0 gap-2 sm:w-auto sm:flex-1">
          <Button
            variant="outline"
            onClick={() => setScannerOpen(true)}
            title="Scan for ID number"
            className="flex-1 min-w-0"
          >
            <QrCode className="h-4 w-4" />
            Scan
          </Button>
          <Button
            onClick={() => setSearchQuery(searchId)}
            className="flex-1 min-w-0"
          >
            Search
          </Button>
        </div>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchId("");
              setSearchQuery("");
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            ID: {searchQuery}
            <X className="h-3 w-3" />
          </button>
        )}
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
                          {emp.title} {emp.firstName} {emp.lastName}
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
