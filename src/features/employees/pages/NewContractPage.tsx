import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { getEffectiveTemplates, getDefaultTemplate } from "@/lib/contractTemplates";
import { Button } from "@/components/ui/button";
import { ContractForm } from "@/features/contracts/components/ContractForm";
import type { ContractFormValues } from "@/lib/validations/contract";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };

export function NewContractPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organizationId, organization, isLoading: userLoading } = useCurrentUser();
  const contractsEnabled = useModuleEnabled("contracts");
  const employeeId = id as Id<"employees"> | undefined;
  const employee = useQuery(
    api.employees.queries.getById,
    employeeId ? { id: employeeId } : "skip"
  );
  const createContract = useMutation(api.contracts.mutations.create);
  const saveContractSignature = useMutation(api.contracts.actions.saveContractSignature);
  const generateUploadUrl = useMutation(api.lib.storage.generateUploadUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const templates = useMemo(() => getEffectiveTemplates(organization ?? undefined), [organization]);
  const defaultTemplate = useMemo(() => getDefaultTemplate(organization ?? undefined), [organization]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const selectedTemplate =
    templates.find((t) => t.id === (selectedTemplateId ?? defaultTemplate?.id)) ??
    defaultTemplate ??
    templates[0] ??
    null;

  const handleSubmit = async (
    values: ContractFormValues,
    signatureFile: File | null,
    html: { termsAndConditionsHtml: string }
  ) => {
    if (!organizationId || !employeeId) return;
    setIsSubmitting(true);
    setSubmitError(null);
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
        templateId: selectedTemplate?.id,
        companyName: selectedTemplate?.companyName,
        employerSignatureUrl: selectedTemplate?.employerSignatureUrl,
        employerSignatureStorageId: selectedTemplate?.employerSignatureStorageId as Id<"_storage"> | undefined,
      });
      if (signatureFile) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": signatureFile.type },
          body: signatureFile,
        });
        if (!response.ok) throw new Error("Upload failed");
        const { storageId } = await response.json();
        await saveContractSignature({ contractId, storageId });
      }
      navigate(`/employees/${employeeId}/contracts/${contractId}`);
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : "Failed to create contract. Please try again.");
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

  const displayName = [employee.title ? (TITLES[employee.title] ?? employee.title) : "", employee.firstName, employee.lastName].filter(Boolean).join(" ");
  const nameSurname = [employee.firstName, employee.secondName, employee.lastName].filter(Boolean).join(" ");

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <Link to={`/employees/${employeeId}/contracts`} className="shrink-0">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold break-words min-w-0 flex-1">New contract · {displayName}</h1>
      </div>

      {submitError && (
        <p className="text-sm text-destructive">{submitError}</p>
      )}

      {templates.length > 1 && (
        <div className="space-y-2 w-full min-w-0">
          <Label htmlFor="template-select" className="text-xs">Template</Label>
          <select
            id="template-select"
            className="flex h-9 w-full min-w-0 sm:min-w-[100px] sm:flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedTemplateId ?? selectedTemplate?.id ?? ""}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.isDefault ? " (default)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <ContractForm
        key={selectedTemplate?.id ?? "single"}
        defaultValues={{
          nameSurname,
          idNumber: employee.idNumber,
          employeeNo: employee.employeeNo ?? "",
          contractHeading: selectedTemplate?.contractHeading ?? "",
          contractCategory: selectedTemplate?.contractCategory ?? "",
          termsAndConditionsHtml: selectedTemplate?.defaultTermsAndConditions ?? "",
        }}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/employees/${employeeId}/contracts`)}
        isSubmitting={isSubmitting}
        submitLabel="Create contract"
        companyName={selectedTemplate?.companyName ?? ""}
        employerSignatureUrl={selectedTemplate?.employerSignatureUrl ?? undefined}
      />
    </div>
  );
}
