import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Camera, FileText, Trash2, User, FileStack } from "lucide-react";
import { getExpiryStatus } from "@/components/shared/ExpiryBadge";
import { Id } from "../../../../convex/_generated/dataModel";
import { timestampToDateString } from "@/lib/validations/employee";
import {
  PAY_METHODS,
  BANK_ACC_TYPES,
  BRANCH_CODES,
  ACC_RELATIONSHIPS,
} from "@/lib/constants/bankDetails";
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

const payMethodLabels: Record<string, string> = Object.fromEntries(PAY_METHODS.map((p) => [p.value, p.label]));
const bankAccTypeLabels: Record<string, string> = Object.fromEntries(BANK_ACC_TYPES.map((b) => [b.value, b.label]));
const accRelationshipLabels: Record<string, string> = Object.fromEntries(ACC_RELATIONSHIPS.map((a) => [a.value, a.label]));
function branchCodeForBank(bankName: string | undefined): string {
  if (!bankName) return "";
  return BRANCH_CODES[bankName] ?? "";
}

// Section card styling
const sectionClass = "rounded-lg border bg-card overflow-hidden";
const sectionHeaderClass = "bg-muted/70 px-4 py-3 border-b";
const sectionTitleClass = "text-sm font-semibold text-foreground";
const sectionContentClass = "p-4 text-sm";

// Info row component
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 min-h-[28px]">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="truncate">{value}</span>
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
  const documentsEnabled = useModuleEnabled("documents");
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
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (employee === null) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-destructive">Employee not found.</p>
        <Link to="/employees">
          <Button variant="link" className="mt-2">Back to list</Button>
        </Link>
      </div>
    );
  }

  const initials = `${employee.firstName?.[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Profile header card */}
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-5">
          {/* Avatar */}
          <div className="shrink-0 flex justify-center sm:justify-start">
            {employee.imageUrl ? (
              <img
                src={employee.imageUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold ring-2 ring-border">
                {initials || <User className="h-8 w-8" />}
              </div>
            )}
          </div>

          {/* Name + subtitle - min-width so name stays on one line and buttons wrap when tight */}
          <div className="flex-1 min-w-[260px] text-center sm:text-left">
            <h1 className="text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis">
              {TITLES[employee.title] ?? employee.title} {employee.firstName} {employee.lastName}
            </h1>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Known as: {employee.knownAs}</span>
              <span className="whitespace-nowrap">
                ID: {employee.idNumber}
                {employee.employeeNo && ` · Emp #${employee.employeeNo}`}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <Link to={`/employees/${employee._id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Link to={`/employees/${employee._id}/capture`}>
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4" />
                Photo
              </Button>
            </Link>
            {contractsEnabled && (
              <Link to={`/employees/${employee._id}/contracts`}>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4" />
                  Contracts
                </Button>
              </Link>
            )}
            {documentsEnabled && (
              <Link to={`/employees/${employee._id}/documents`}>
                <Button variant="outline" size="sm">
                  <FileStack className="h-4 w-4" />
                  Documents
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="flex flex-wrap gap-4">
        {/* Personal */}
        <section className={`${sectionClass} w-full min-w-0 sm:w-auto sm:min-w-[280px] sm:flex-1`}>
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
        <section className={`${sectionClass} w-full min-w-0 sm:w-auto sm:min-w-[280px] sm:flex-1`}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Contact</h3>
          </div>
          <div className={`${sectionContentClass} space-y-1`}>
            <InfoRow label="Cell" value={employee.cellNumber} />
          </div>
        </section>

        {/* Address */}
        <section className={`${sectionClass} w-full min-w-0 sm:w-auto sm:min-w-[280px] sm:flex-1`}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Address</h3>
          </div>
          <div className={sectionContentClass}>
            <p>{employee.resStreetNo} {employee.resStreetName}</p>
            <p>{employee.resSuburb}, {employee.resCity} {employee.resPostCode}</p>
          </div>
        </section>

        {/* Dates */}
        <section className={`${sectionClass} w-full min-w-0 sm:w-auto sm:min-w-[280px] sm:flex-1`}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Dates</h3>
          </div>
          <div className={`${sectionContentClass} space-y-1`}>
            <InfoRow label="Date registered" value={timestampToDateString(employee.dateRegistered)} />
            <InfoRow label="Date engaged" value={timestampToDateString(employee.dateEngaged)} />
          </div>
        </section>

        {/* Banking Details */}
        <section className={`${sectionClass} w-full min-w-0 sm:w-auto sm:min-w-[280px] sm:flex-1`}>
          <div className={sectionHeaderClass}>
            <h3 className={sectionTitleClass}>Banking Details</h3>
          </div>
          <div className={`${sectionContentClass} space-y-1`}>
            <InfoRow label="Pay method" value={payMethodLabels[employee.payMethod ?? "03"]} />
            <InfoRow label="Bank name" value={employee.bankName} />
            <InfoRow label="Branch code" value={employee.branchCode ?? branchCodeForBank(employee.bankName)} />
            <InfoRow label="Account type" value={bankAccTypeLabels[employee.bankAccType ?? "S"]} />
            <InfoRow label="Account number" value={employee.bankAccNo} />
            <InfoRow label="Account holder" value={employee.accHolder} />
            <InfoRow label="Relationship" value={accRelationshipLabels[employee.accRelationship ?? "O"]} />
          </div>
        </section>

        {/* Documents */}
        {documentsEnabled && (
          <section className={`${sectionClass} w-full min-w-0 sm:w-auto sm:min-w-[280px] sm:flex-1`}>
            <div className={sectionHeaderClass}>
              <h3 className={sectionTitleClass}>Documents</h3>
            </div>
            <div className={`${sectionContentClass} space-y-2`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground">
                  {documents === undefined ? "..." : documents.length} document{documents?.length !== 1 ? "s" : ""}
                </span>
                {documents && documents.length > 0 && (() => {
                  const hasExpiring = documents.some(
                    (d) => d.expiryDate != null && getExpiryStatus(d.expiryDate, 30) !== "valid" && getExpiryStatus(d.expiryDate, 30) !== "none"
                  );
                  return hasExpiring ? (
                    <span className="inline-flex items-center rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">Some expiring soon</span>
                  ) : null;
                })()}
              </div>
              <Link to={`/employees/${employee._id}/documents`}>
                <Button variant="link" size="sm" className="h-auto p-0 text-accent">
                  View documents
                </Button>
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
