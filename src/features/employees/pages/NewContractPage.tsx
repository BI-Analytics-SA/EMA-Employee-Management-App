import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { ContractForm } from "@/features/contracts/components/ContractForm";
import type { ContractFormValues } from "@/lib/validations/contract";
import { Loader2, ArrowLeft } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };

export function NewContractPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organizationId, isLoading: userLoading } = useCurrentUser();
  const contractsEnabled = useModuleEnabled("contracts");
  const employeeId = id as Id<"employees"> | undefined;
  const employee = useQuery(
    api.employees.queries.getById,
    employeeId ? { id: employeeId } : "skip"
  );
  const organization = useQuery(api.organizations.queries.getCurrentUserOrganization, undefined);
  const createContract = useMutation(api.contracts.mutations.create);
  const saveContractSignature = useMutation(api.contracts.actions.saveContractSignature);
  const generateUploadUrl = useMutation(api.lib.storage.generateUploadUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    values: ContractFormValues,
    signatureFile: File | null,
    html: { termsAndConditionsHtml: string }
  ) => {
    if (!organizationId || !employeeId) return;
    if (!signatureFile) return;
    setIsSubmitting(true);
    try {
      const contractId = await createContract({
        organizationId,
        employeeId,
        nameSurname: values.nameSurname,
        idNumber: values.idNumber,
        signedDate: values.signedDate,
        startDate: values.startDate,
        employeeNo: values.employeeNo,
        dateEngaged: values.dateEngaged,
        contractHeading: values.contractHeading || undefined,
        contractCategory: values.contractCategory || undefined,
        placeOfSignature: values.placeOfSignature || undefined,
        termsAndConditionsHtml: html.termsAndConditionsHtml || undefined,
      });
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": signatureFile.type },
        body: signatureFile,
      });
      if (!response.ok) throw new Error("Upload failed");
      const { storageId } = await response.json();
      await saveContractSignature({ contractId, storageId });
      navigate(`/employees/${employeeId}/contracts/${contractId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || !employeeId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (employee === undefined) {
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

  if (!contractsEnabled) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">The Contracts module is not enabled for your organization.</p>
        <Link to={`/employees/${employeeId}`}>
          <Button variant="link" className="mt-2">Back to employee</Button>
        </Link>
      </div>
    );
  }

  const displayName = `${TITLES[employee.title] ?? employee.title} ${employee.firstName} ${employee.lastName}`;
  const nameSurname = `${employee.firstName} ${employee.secondName ?? ""} ${employee.lastName}`.trim();
  const template = organization?.settings?.contractTemplate;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link to={`/employees/${employeeId}/contracts`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-bold truncate">New contract · {displayName}</h1>
      </div>

      <ContractForm
        defaultValues={{
          nameSurname,
          idNumber: employee.idNumber,
          employeeNo: employee.employeeNo ?? "",
          contractHeading: template?.contractHeading ?? "",
          contractCategory: template?.contractCategory ?? "",
          termsAndConditionsHtml: template?.defaultTermsAndConditions ?? "",
        }}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/employees/${employeeId}/contracts`)}
        isSubmitting={isSubmitting}
        submitLabel="Create contract"
        companyName={template?.companyName ?? ""}
        employerSignatureUrl={template?.employerSignatureUrl ?? undefined}
      />
    </div>
  );
}
