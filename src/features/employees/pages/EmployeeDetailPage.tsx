import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Camera, PenLine, FileText, Stethoscope, Trash2, User, FileStack } from "lucide-react";
import { getExpiryStatus } from "@/components/shared/ExpiryBadge";
import { Id } from "../../../../convex/_generated/dataModel";
import { timestampToDateString } from "@/lib/validations/employee";
import { useState } from "react";
import { useMutation } from "convex/react";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };
const GENDERS: Record<string, string> = { M: "Male", F: "Female" };
const ETHNIC: Record<string, string> = {
  A: "African",
  C: "Coloured",
  W: "White",
  I: "Indian",
  B: "Black",
};

// Section card styling - matches form styling
const sectionClass = "rounded-lg border bg-card overflow-hidden";
const sectionHeaderClass = "bg-muted/70 px-3 py-2 border-b";
const sectionTitleClass = "text-sm font-semibold text-foreground";
const sectionContentClass = "p-3 text-sm";

// Info row component
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoading: userLoading } = useCurrentUser();
  const employeeId = id as Id<"employees"> | undefined;
  const employee = useQuery(
    api.employees.queries.getById,
    employeeId ? { id: employeeId } : "skip"
  );
  const documents = useQuery(
    api.documents.queries.listByEmployee,
    employeeId ? { employeeId } : "skip"
  );
  const removeMutation = useMutation(api.employees.mutations.remove);
  const contractsEnabled = useModuleEnabled("contracts");
  const medicalEnabled = useModuleEnabled("medical");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!employeeId) return;
    if (!window.confirm("Delete this employee? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await removeMutation({ id: employeeId });
      navigate("/employees");
    } finally {
      setIsDeleting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!employeeId || employee === undefined) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (employee === null) {
    return (
      <div className="p-4">
        <p className="text-destructive">Employee not found.</p>
        <Link to="/employees">
          <Button variant="link" className="mt-2">Back to list</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Dashboard Header - Photo, Name, Actions */}
      <div className={sectionClass}>
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          {/* Photo placeholder */}
          <div className="shrink-0 flex justify-center sm:justify-start">
            <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border">
              {employee.imageUrl ? (
                <img
                  src={employee.imageUrl}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Name and summary */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold">
              {TITLES[employee.title] ?? employee.title} {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-muted-foreground text-sm">
              Known as: {employee.knownAs}
            </p>
            <p className="text-muted-foreground text-sm">
              ID: {employee.idNumber}
              {employee.employeeNo && ` · Emp #${employee.employeeNo}`}
            </p>
          </div>

          {/* Action buttons - vertical on mobile, horizontal on desktop */}
          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <Link to={`/employees/${employee._id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Link to={`/employees/${employee._id}/capture`}>
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-1" />
                Photo
              </Button>
            </Link>
            <Link to={`/employees/${employee._id}/signature-demo`}>
              <Button variant="outline" size="sm" title="Demo – test signature capture">
                <PenLine className="h-4 w-4 mr-1" />
                Test Signature
              </Button>
            </Link>
            {contractsEnabled && (
              <Link to={`/employees/${employee._id}/contracts`}>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  Contracts
                </Button>
              </Link>
            )}
            {medicalEnabled && (
              <Link to={`/employees/${employee._id}/medical`}>
                <Button variant="outline" size="sm">
                  <Stethoscope className="h-4 w-4 mr-1" />
                  Medical
                </Button>
              </Link>
            )}
            <Link to={`/employees/${employee._id}/documents`}>
              <Button variant="outline" size="sm">
                <FileStack className="h-4 w-4 mr-1" />
                Documents
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="flex flex-wrap gap-3">
        {/* Personal */}
        <section className={`${sectionClass} w-full sm:w-auto sm:min-w-[280px] sm:flex-1`}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Personal</h3>
          </div>
          <div className={`${sectionContentClass} space-y-1`}>
            <InfoRow label="Full name" value={`${employee.firstName} ${employee.secondName || ""} ${employee.lastName}`.trim()} />
            <InfoRow label="Date of birth" value={timestampToDateString(employee.dateOfBirth) || "—"} />
            <InfoRow label="Gender" value={GENDERS[employee.gender] ?? employee.gender} />
            <InfoRow label="Ethnic group" value={ETHNIC[employee.ethnicGroup] ?? employee.ethnicGroup} />
          </div>
        </section>

        {/* Contact */}
        <section className={`${sectionClass} w-full sm:w-auto sm:min-w-[220px] sm:flex-1`}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Contact</h3>
          </div>
          <div className={`${sectionContentClass} space-y-1`}>
            <InfoRow label="Cell" value={employee.cellNumber} />
          </div>
        </section>

        {/* Address */}
        <section className={`${sectionClass} w-full sm:w-auto sm:min-w-[280px] sm:flex-1`}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Address</h3>
          </div>
          <div className={sectionContentClass}>
            <p>{employee.resStreetNo} {employee.resStreetName}</p>
            <p>{employee.resSuburb}, {employee.resCity} {employee.resPostCode}</p>
          </div>
        </section>

        {/* Dates */}
        <section className={`${sectionClass} w-full sm:w-auto sm:min-w-[260px] sm:flex-1`}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Dates</h3>
          </div>
          <div className={`${sectionContentClass} space-y-1`}>
            <InfoRow label="Date registered" value={timestampToDateString(employee.dateRegistered)} />
            <InfoRow label="Date engaged" value={timestampToDateString(employee.dateEngaged)} />
          </div>
        </section>

        {/* Documents */}
        <section className={`${sectionClass} w-full sm:w-auto sm:min-w-[260px] sm:flex-1`}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Documents</h3>
          </div>
          <div className={`${sectionContentClass} space-y-2`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground">
                {documents === undefined ? "…" : documents.length} document{documents?.length !== 1 ? "s" : ""}
              </span>
              {documents && documents.length > 0 && (() => {
                const hasExpiring = documents.some(
                  (d) => d.expiryDate != null && getExpiryStatus(d.expiryDate, 30) !== "valid" && getExpiryStatus(d.expiryDate, 30) !== "none"
                );
                return hasExpiring ? (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Some expiring soon</span>
                ) : null;
              })()}
            </div>
            <Link to={`/employees/${employee._id}/documents`}>
              <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                View documents
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
