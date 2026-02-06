import { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser, useHasRole } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { ContractForm, type ContractFormHandle } from "@/features/contracts/components/ContractForm";
import type { ContractFormValues } from "@/lib/validations/contract";
import { timestampToDateString } from "@/lib/validations/contract";
import { Loader2, ArrowLeft, FileText, FileDown, Trash2, ExternalLink } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

const TITLES: Record<string, string> = { MR: "Mr", MISS: "Miss", MRS: "Mrs", MS: "Ms" };

export function ContractDetailPage() {
  const { id, contractId } = useParams<{ id: string; contractId: string }>();
  const navigate = useNavigate();
  const { isLoading: userLoading } = useCurrentUser();
  const contractsEnabled = useModuleEnabled("contracts");
  const canManageContracts = useHasRole("manager");
  const employeeId = id as Id<"employees"> | undefined;
  const contractIdTyped = contractId as Id<"contracts"> | undefined;

  const employee = useQuery(
    api.employees.queries.getById,
    employeeId ? { id: employeeId } : "skip"
  );
  const contract = useQuery(
    api.contracts.queries.getById,
    contractIdTyped ? { id: contractIdTyped } : "skip"
  );
  const organization = useQuery(api.organizations.queries.getCurrentUserOrganization, undefined);

  const updateContract = useMutation(api.contracts.mutations.update);
  const saveContractSignature = useMutation(api.contracts.actions.saveContractSignature);
  const generateUploadUrl = useMutation(api.lib.storage.generateUploadUrl);
  const removeContract = useMutation(api.contracts.mutations.remove);
  const deleteContractPdf = useMutation(api.contracts.actions.deleteContractPdf);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingPdf, setDeletingPdf] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const contractFormRef = useRef<ContractFormHandle>(null);

  const companyName = organization?.settings?.contractTemplate?.companyName ?? "";

  const handleSubmit = async (
    values: ContractFormValues,
    signatureFile: File | null,
    html: { termsAndConditionsHtml: string }
  ) => {
    if (!contractIdTyped) return;
    setIsSubmitting(true);
    try {
      await updateContract({
        id: contractIdTyped,
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
      if (signatureFile) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": signatureFile.type },
          body: signatureFile,
        });
        if (!response.ok) throw new Error("Upload failed");
        const { storageId } = await response.json();
        await saveContractSignature({ contractId: contractIdTyped, storageId });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePdf = async () => {
    if (!contractIdTyped) return;
    setDeletingPdf(true);
    try {
      await deleteContractPdf({ contractId: contractIdTyped });
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingPdf(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!contractIdTyped || !employeeId) return;
    try {
      await removeContract({ id: contractIdTyped });
      navigate(`/employees/${employeeId}/contracts`);
    } catch (err) {
      console.error(err);
    }
  };

  if (userLoading || !employeeId || !contractIdTyped) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (employee === undefined || contract === undefined) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (employee === null || contract === null) {
    return (
      <div className="p-4">
        <p className="text-destructive">Employee or contract not found.</p>
        <Link to={`/employees/${employeeId}/contracts`}>
          <Button variant="link" className="mt-2">Back to contracts</Button>
        </Link>
      </div>
    );
  }

  if (!contractsEnabled) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">The Contracts module is not enabled.</p>
        <Link to={`/employees/${employeeId}/contracts`}>
          <Button variant="link" className="mt-2">Back to contracts</Button>
        </Link>
      </div>
    );
  }

  const displayName = `${TITLES[employee.title] ?? employee.title} ${employee.firstName} ${employee.lastName}`;
  const hasPdf = !!contract.pdfUrl;

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link to={`/employees/${employeeId}/contracts`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold truncate">
            Contract · {displayName} · {timestampToDateString(contract.signedDate)}
          </h1>
        </div>
        {canManageContracts && (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" form="contract-form" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => contractFormRef.current?.generatePdf()}
            >
              Generate PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/employees/${employeeId}/contracts`)}
            >
              Cancel
            </Button>
            {confirmDelete ? (
              <>
                <span className="text-sm text-muted-foreground">Delete?</span>
                <Button variant="destructive" size="sm" onClick={handleDeleteContract}>
                  Yes, delete
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete contract
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden p-3 space-y-2">
        <h2 className="text-sm font-semibold">PDF</h2>
        {hasPdf ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <FileText className="h-4 w-4" />
              PDF generated
            </span>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={contract.pdfUrl!} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                View PDF
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={contract.pdfUrl!} download={`contract-${contractIdTyped}.pdf`}>
                <FileDown className="h-4 w-4 mr-1" />
                Download
              </a>
            </Button>
            {canManageContracts && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDeletePdf}
                disabled={deletingPdf}
              >
                {deletingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete PDF"}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No PDF yet. Save the contract, then use &quot;Generate PDF&quot; below.
          </p>
        )}
      </div>

      {canManageContracts && (
        <ContractForm
          ref={contractFormRef}
          defaultValues={{
            nameSurname: contract.nameSurname,
            idNumber: contract.idNumber,
            employeeNo: contract.employeeNo,
            signedDate: timestampToDateString(contract.signedDate),
            startDate: timestampToDateString(contract.startDate),
            dateEngaged: contract.dateEngaged ? timestampToDateString(contract.dateEngaged) : undefined,
            contractHeading: contract.contractHeading ?? "",
            contractCategory: contract.contractCategory ?? "",
            placeOfSignature: contract.placeOfSignature ?? "",
            termsAndConditionsHtml: contract.termsAndConditionsHtml ?? "",
          }}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/employees/${employeeId}/contracts`)}
          isSubmitting={isSubmitting}
          submitLabel="Save changes"
          contractId={contractIdTyped}
          companyName={companyName}
          signatureUrl={contract.signatureUrl}
          employerSignatureUrl={organization?.settings?.contractTemplate?.employerSignatureUrl ?? undefined}
        />
      )}

      {canManageContracts && (
        <div className="pt-4 border-t">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Delete this contract?</span>
              <Button variant="destructive" size="sm" onClick={handleDeleteContract}>
                Yes, delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete contract
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
