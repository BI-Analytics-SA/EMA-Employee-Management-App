import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ExternalLink, Eye, Briefcase } from "lucide-react";
import { ExpiryBadge, formatExpiryDate } from "@/components/shared/ExpiryBadge";
import { DocumentViewer } from "@/components/shared/DocumentViewer";
import { useMemo, useState } from "react";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };

type SourceFilter = "all" | "employee" | "job";

type UnifiedItem = {
  id: string;
  source: "employee" | "job";
  title: string;
  documentType: string;
  expiryDate: number | undefined;
  fileUrl: string;
  fileName: string;
  fileType: string;
  linkTo: string;
  linkLabel: string;
};

export function ExpiringDocumentsPage() {
  const { organization, isLoading: userLoading } = useCurrentUser();
  const documentsEnabled = useModuleEnabled("documents");
  const jobsEnabled = useModuleEnabled("jobs");
  const anyEnabled = documentsEnabled || jobsEnabled;
  const showSourceFilter = documentsEnabled && jobsEnabled;

  // Build type name lookup maps for resolving IDs to names
  const docTypeNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const dt of organization?.settings?.documentTypes ?? []) map[dt.id] = dt.name;
    return map;
  }, [organization?.settings?.documentTypes]);
  const jobDocTypeNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const dt of organization?.settings?.jobDocumentTypes ?? []) map[dt.id] = dt.name;
    return map;
  }, [organization?.settings?.jobDocumentTypes]);

  const [daysFilter, setDaysFilter] = useState<30 | 60 | 90>(90);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [viewingDoc, setViewingDoc] = useState<{
    url: string;
    fileName: string;
    fileType: string;
  } | null>(null);

  const expiringEmployeeDocs = useQuery(
    api.documents.queries.getExpiringWithEmployees,
    documentsEnabled && organization?._id
      ? { organizationId: organization._id, daysAhead: daysFilter }
      : "skip"
  );

  const expiringJobDocs = useQuery(
    api.jobDocuments.queries.getExpiringWithJobs,
    jobsEnabled && organization?._id
      ? { organizationId: organization._id, daysAhead: daysFilter }
      : "skip"
  );

  const unified = useMemo(() => {
    const items: UnifiedItem[] = [];

    if (sourceFilter !== "job" && expiringEmployeeDocs) {
      for (const { document: doc, employee } of expiringEmployeeDocs) {
        const employeeName = employee
          ? `${employee.title ? (TITLES[employee.title] ?? employee.title) : ""} ${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim() || "Unknown employee"
          : "Unknown employee";
        items.push({
          id: doc._id,
          source: "employee",
          title: doc.title || doc.fileName,
          documentType: docTypeNames[doc.documentType] ?? doc.documentType,
          expiryDate: doc.expiryDate,
          fileUrl: doc.fileUrl,
          fileName: doc.fileName,
          fileType: doc.fileType,
          linkTo: `/employees/${doc.employeeId}/documents`,
          linkLabel: employeeName,
        });
      }
    }

    if (sourceFilter !== "employee" && expiringJobDocs) {
      for (const { document: doc, job } of expiringJobDocs) {
        items.push({
          id: doc._id,
          source: "job",
          title: doc.title || doc.fileName,
          documentType: jobDocTypeNames[doc.documentType] ?? doc.documentType,
          expiryDate: doc.expiryDate,
          fileUrl: doc.fileUrl,
          fileName: doc.fileName,
          fileType: doc.fileType,
          linkTo: `/jobs/${doc.jobId}`,
          linkLabel: job?.title ?? "Unknown job",
        });
      }
    }

    // Sort by expiry date ascending (soonest first)
    items.sort((a, b) => (a.expiryDate ?? 0) - (b.expiryDate ?? 0));
    return items;
  }, [expiringEmployeeDocs, expiringJobDocs, sourceFilter, docTypeNames, jobDocTypeNames]);

  const isLoading =
    (documentsEnabled && expiringEmployeeDocs === undefined) ||
    (jobsEnabled && expiringJobDocs === undefined);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!anyEnabled) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No modules with expiry tracking are enabled for your organization.</p>
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
        <h1 className="text-2xl font-bold min-w-0">Expiring items</h1>
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
        {showSourceFilter && (
          <div className="flex flex-wrap gap-2">
            {(["all", "employee", "job"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                  sourceFilter === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/30"
                }`}
              >
                {s === "all" ? "All" : s === "employee" ? "Employee Documents" : "Job Documents"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="bg-muted/70 px-3 py-2 border-b">
          <h2 className="text-sm font-semibold">
            Items expiring in the next {daysFilter} days (or already expired)
          </h2>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : unified.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              No items expiring in this period.
            </p>
          ) : (
            <ul className="space-y-2">
              {unified.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 min-w-0"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {item.source === "job" ? (
                      <Briefcase className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                    ) : (
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.documentType}
                        {item.expiryDate != null &&
                          ` · Expires ${formatExpiryDate(item.expiryDate)}`}
                      </p>
                    </div>
                    <ExpiryBadge
                      expiryDate={item.expiryDate}
                      daysBeforeExpiry={30}
                      className="shrink-0"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 w-full border-t border-border/50 pt-2">
                    <Link to={item.linkTo} className="flex-1 min-w-[100px]">
                      <Button variant="ghost" size="sm" className="gap-1 w-full truncate max-w-full">
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.linkLabel}</span>
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[100px]"
                      onClick={() =>
                        setViewingDoc({
                          url: item.fileUrl,
                          fileName: item.fileName,
                          fileType: item.fileType,
                        })
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </li>
              ))}
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
