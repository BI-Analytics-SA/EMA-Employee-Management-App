import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { EmployeeForm } from "../components/EmployeeForm";
import type { EmployeeFormValues } from "@/lib/validations/employee";
import { Id } from "../../../../convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { useState } from "react";

/** Allow only same-origin paths (no protocol, no //). Exported for tests. */
export function getSafeReturnTo(searchParams: URLSearchParams): string | null {
  const returnTo = searchParams.get("returnTo");
  if (!returnTo || typeof returnTo !== "string") return null;
  const trimmed = returnTo.trim();
  if (trimmed === "" || !trimmed.startsWith("/") || trimmed.includes("//")) return null;
  return trimmed;
}

export function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams);
  const { organizationId, isLoading: userLoading } = useCurrentUser();
  const employeeId = id as Id<"employees"> | undefined;
  const employee = useQuery(
    api.employees.queries.getById,
    employeeId ? { id: employeeId } : "skip"
  );
  const updateMutation = useMutation(api.employees.mutations.update);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: EmployeeFormValues) => {
    if (!employeeId) return;
    setIsSubmitting(true);
    try {
      await updateMutation({
        id: employeeId,
        idNumber: values.idNumber,
        employeeNo: values.employeeNo || undefined,
        title: values.title,
        initials: values.initials,
        firstName: values.firstName,
        secondName: values.secondName || undefined,
        lastName: values.lastName,
        knownAs: values.knownAs,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        ethnicGroup: values.ethnicGroup,
        cellNumber: values.cellNumber,
        resStreetNo: values.resStreetNo,
        resStreetName: values.resStreetName,
        resSuburb: values.resSuburb,
        resCity: values.resCity,
        resPostCode: values.resPostCode,
        dateRegistered: values.dateRegistered,
        dateEngaged: values.dateEngaged,
        taxNumber: values.taxNumber || undefined,
        certificate: values.certificate || undefined,
        payMethod: values.payMethod,
        bankAccType: values.bankAccType,
        bankAccNo: values.bankAccNo || undefined,
        bankName: values.bankName || undefined,
        branchCode: values.branchCode || undefined,
        accHolder: values.accHolder || undefined,
        accRelationship: values.accRelationship,
      });
      navigate(returnTo ?? `/employees/${employeeId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || !organizationId) {
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
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Employee</h1>
      <EmployeeForm
        organizationId={organizationId}
        employee={employee}
        onSubmit={handleSubmit}
        onCancel={() => navigate(returnTo ?? `/employees/${employeeId}`)}
        isSubmitting={isSubmitting}
        submitLabel="Save changes"
      />
    </div>
  );
}
