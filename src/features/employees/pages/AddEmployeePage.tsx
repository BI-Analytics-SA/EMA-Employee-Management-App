import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { EmployeeForm } from "../components/EmployeeForm";
import type { EmployeeFormValues } from "@/lib/validations/employee";
import { useState } from "react";

export function AddEmployeePage() {
  const navigate = useNavigate();
  const { organizationId, isLoading: userLoading } = useCurrentUser();
  const createMutation = useMutation(api.employees.mutations.create);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: EmployeeFormValues) => {
    if (!organizationId) return;
    setIsSubmitting(true);
    try {
      const id = await createMutation({
        organizationId,
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
      });
      navigate(`/employees/${id}`);
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
