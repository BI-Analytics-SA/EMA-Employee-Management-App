import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { EmployeeForm } from "../components/EmployeeForm";
import type { EmployeeFormValues } from "@/lib/validations/employee";
import { useState } from "react";
import { extractConvexError } from "@/lib/convex-error";

export function AddEmployeePage() {
  const navigate = useNavigate();
  const { organizationId, isLoading: userLoading } = useCurrentUser();
  const createMutation = useMutation(api.employees.mutations.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (values: EmployeeFormValues) => {
    if (!organizationId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const id = await createMutation({
        organizationId,
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
      navigate(`/employees/${id}`);
    } catch (err) {
      console.error(err);
      setSubmitError(extractConvexError(err, "Failed to add employee. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || !organizationId) {
    return null;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Add Employee</h1>
      {submitError && (
        <p className="text-sm text-destructive mb-4">{submitError}</p>
      )}
      <EmployeeForm
        organizationId={organizationId}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/employees")}
        isSubmitting={isSubmitting}
        submitLabel="Add Employee"
      />
    </div>
  );
}
