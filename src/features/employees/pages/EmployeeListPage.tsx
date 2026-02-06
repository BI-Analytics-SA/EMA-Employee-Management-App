import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarcodeScanner } from "@/components/shared/BarcodeScanner";
import { ExportButton } from "@/features/employees/components/ExportButton";
import { Loader2, UserPlus, Search, QrCode } from "lucide-react";
import { usePaginatedQuery } from "convex/react";

export function EmployeeListPage() {
  const { organizationId, isLoading: userLoading } = useCurrentUser();
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton />
          <Link to="/employees/new">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search by ID Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Enter ID number (13 digits)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSearchQuery(searchId)}
              maxLength={13}
              className="min-w-[180px] flex-1"
            />
            <Button
              variant="outline"
              onClick={() => setScannerOpen(true)}
              title="Scan for ID number"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scan
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSearchQuery(searchId)}
            >
              Search
            </Button>
            {searchQuery && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchId("");
                  setSearchQuery("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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

      <Card>
        <CardContent className="p-0">
          {isLoadingList ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {showSearch
                ? "No employees match that ID number."
                : "No employees yet. Add your first employee to get started."}
            </div>
          ) : (
            <ul className="divide-y">
              {list.map((emp) => (
                <li key={emp._id}>
                  <Link
                    to={`/employees/${emp._id}`}
                    className="block p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium">
                      {emp.title} {emp.initials} {emp.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {emp.idNumber}
                      {emp.employeeNo && ` · Emp #${emp.employeeNo}`}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!showSearch && status === "CanLoadMore" && (
            <div className="p-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => loadMore(20)}>
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
