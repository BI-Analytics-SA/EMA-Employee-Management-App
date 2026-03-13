import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ExternalLink, Eye } from "lucide-react";
import { ExpiryBadge, formatExpiryDate } from "@/components/shared/ExpiryBadge";
import { DocumentViewer } from "@/components/shared/DocumentViewer";
import { useState } from "react";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };

export function ExpiringDocumentsPage() {
  const { organization, isLoading: userLoading } = useCurrentUser();
  const documentsEnabled = useModuleEnabled("documents");
  const [daysFilter, setDaysFilter] = useState<30 | 60 | 90>(90);
  const [viewingDoc, setViewingDoc] = useState<{
    url: string;
    fileName: string;
    fileType: string;
  } | null>(null);

  const expiring = useQuery(
    api.documents.queries.getExpiringWithEmployees,
    organization?._id
      ? { organizationId: organization._id, daysAhead: daysFilter }
      : "skip"
  );

  const list = expiring ?? [];

  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!documentsEnabled) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">The Documents module is not enabled for your organization.</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No organization found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 min-w-0">
        <h1 className="text-2xl font-bold min-w-0">Expiring documents</h1>
        <div className="flex flex-wrap gap-2 w-full">
          {([30, 60, 90] as const).map((d) => (
            <Button
              key={d}
              variant={daysFilter === d ? "default" : "outline"}
              size="sm"
              onClick={() => setDaysFilter(d)}
              className="flex-1 min-w-[80px]"
            >
              {d} days
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="bg-muted/70 px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">
            Documents expiring in the next {daysFilter} days (or already expired)
          </h2>
        </div>
        <div className="p-4">
          {expiring === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              No documents expiring in this period.
            </p>
          ) : (
            <ul className="space-y-2">
              {list.map(({ document: doc, employee }) => {
                const employeeName = employee
                  ? `${TITLES[employee.title] ?? employee.title} ${employee.firstName} ${employee.lastName}`
                  : "Unknown employee";
                return (
                  <li
                    key={doc._id}
                    className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 min-w-0"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {doc.title || doc.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.documentType}
                          {doc.expiryDate != null &&
                            ` · Expires ${formatExpiryDate(doc.expiryDate)}`}
                        </p>
                      </div>
                      <ExpiryBadge
                        expiryDate={doc.expiryDate}
                        daysBeforeExpiry={30}
                        className="shrink-0"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 w-full border-t border-border/50 pt-2">
                      <Link to={`/employees/${doc.employeeId}/documents`} className="flex-1 min-w-[100px]">
                        <Button variant="ghost" size="sm" className="gap-1 w-full truncate max-w-full">
                          <ExternalLink className="h-4 w-4 shrink-0" />
                          <span className="truncate">{employeeName}</span>
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-[100px]"
                        onClick={() =>
                          setViewingDoc({
                            url: doc.fileUrl,
                            fileName: doc.fileName,
                            fileType: doc.fileType,
                          })
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {viewingDoc && (
        <DocumentViewer
          url={viewingDoc.url}
          fileName={viewingDoc.fileName}
          fileType={viewingDoc.fileType}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}
