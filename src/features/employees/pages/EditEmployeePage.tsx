import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { EmployeeForm } from "../components/EmployeeForm";
import type { EmployeeFormValues } from "@/lib/validations/employee";
import { Id } from "../../../../convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { extractConvexError } from "@/lib/convex-error";

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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: EmployeeFormValues) => {
    if (!employeeId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updateMutation({
        id: employeeId,
        idNumber: values.idNumber,
        employeeNo: values.employeeNo || undefined,
        title: values.title || undefined,
        initials: values.initials || undefined,
        firstName: values.firstName || undefined,
        secondName: values.secondName || undefined,
        lastName: values.lastName || undefined,
        knownAs: values.knownAs || undefined,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender || undefined,
        ethnicGroup: values.ethnicGroup || undefined,
        language: values.language || undefined,
        cellNumber: values.cellNumber || undefined,
        alternativeNumber: values.alternativeNumber || undefined,
        email: values.email || undefined,
        resUnit: values.resUnit || undefined,
        resComplex: values.resComplex || undefined,
        resStreetNo: values.resStreetNo || undefined,
        resStreetName: values.resStreetName || undefined,
        resSuburb: values.resSuburb || undefined,
        resCity: values.resCity || undefined,
        resPostCode: values.resPostCode || undefined,
        residentialCountry: values.residentialCountry || undefined,
        dateRegistered: values.dateRegistered,
        dateEngaged: values.dateEngaged,
        lastDateWorked: values.lastDateWorked,
        uifEndDate: values.uifEndDate,
        taxNumber: values.taxNumber || undefined,
        certificate: values.certificate || undefined,
        hrsPerPeriod: values.hrsPerPeriod,
        hoursPerDay: values.hoursPerDay,
        workAddressCode: values.workAddressCode,
        companyNumber: values.companyNumber || undefined,
        training: values.training,
        shift: values.shift || undefined,
        shiftAllocation: values.shiftAllocation || undefined,
        deptGroup: values.deptGroup || undefined,
        departmentWorked: values.departmentWorked || undefined,
        department: values.department || undefined,
        maritalStatus: values.maritalStatus || undefined,
        illnessCondition: values.illnessCondition || undefined,
        payMethod: values.payMethod || undefined,
        bankAccType: values.bankAccType || undefined,
        bankAccNo: values.bankAccNo || undefined,
        bankName: values.bankName || undefined,
        branchCode: values.branchCode || undefined,
        accHolder: values.accHolder || undefined,
        accRelationship: values.accRelationship || undefined,
      });
      navigate(returnTo ?? `/employees/${employeeId}`);
    } catch (err) {
      console.error(err);
      setSubmitError(extractConvexError(err, "Failed to save changes. Please try again."));
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
      {submitError && (
        <p className="text-sm text-destructive mb-4">{submitError}</p>
      )}
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
