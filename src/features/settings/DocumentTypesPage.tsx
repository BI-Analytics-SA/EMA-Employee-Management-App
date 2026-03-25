import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { extractConvexError } from "@/lib/convex-error";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

type DocumentTypeRow = {
  id: string;
  name: string;
  requiresExpiry: boolean;
  color?: string;
};

export function DocumentTypesPage() {
  const { organizationId, organization, isAdmin, isLoading: userLoading } = useCurrentUser();
  const documentsEnabled = useModuleEnabled("documents");
  const addType = useMutation(api.organizations.mutations.addDocumentType);
  const updateType = useMutation(api.organizations.mutations.updateDocumentType);
  const removeType = useMutation(api.organizations.mutations.removeDocumentType);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRequiresExpiry, setEditRequiresExpiry] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newRequiresExpiry, setNewRequiresExpiry] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const documentTypes: DocumentTypeRow[] =
    organization?.settings?.documentTypes ?? [];

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAdd = async () => {
    if (!organizationId) return;
    const id = newId.trim().toLowerCase().replace(/\s+/g, "_");
    const name = newName.trim();
    if (!id || !name) {
      setError("ID and name are required.");
      return;
    }
    if (documentTypes.some((t) => t.id === id)) {
      setError("A document type with this ID already exists.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await addType({
        organizationId,
        documentType: { id, name, requiresExpiry: newRequiresExpiry },
      });
      setSuccess("Document type added.");
      setTimeout(clearMessages, 3000);
      setIsAdding(false);
      setNewId("");
      setNewName("");
      setNewRequiresExpiry(false);
    } catch (e) {
      setError(extractConvexError(e, "Failed to add."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!organizationId || !editingId) return;
    const name = editName.trim();
    if (!name) {
      setError("Name is required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await updateType({
        organizationId,
        id: editingId,
        name,
        requiresExpiry: editRequiresExpiry,
      });
      setSuccess("Document type updated.");
      setTimeout(clearMessages, 3000);
      setEditingId(null);
    } catch (e) {
      setError(extractConvexError(e, "Failed to update."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!organizationId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await removeType({ organizationId, id });
      setSuccess("Document type removed.");
      setTimeout(clearMessages, 3000);
    } catch (e) {
      setError(extractConvexError(e, "Failed to remove."));
    } finally {
      setIsSubmitting(false);
      setRemoveTarget(null);
    }
  };

  const startEdit = (row: DocumentTypeRow) => {
    setEditingId(row.id);
    setEditName(row.name);
    setEditRequiresExpiry(row.requiresExpiry);
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!documentsEnabled) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">The Documents module is not enabled for your organization.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4">
        <p className="text-destructive">Only admins can manage document types.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Document types</h1>
      <p className="text-sm text-muted-foreground">
        Define the types of documents employees can upload (e.g. ID Book, Warnings, Certificates).
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="bg-muted/70 px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold">Types</h2>
          {!isAdding ? (
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add type
            </Button>
          ) : null}
        </div>
        <div className="p-4 space-y-3">
          {isAdding && (
            <div className="flex flex-wrap gap-3 items-end p-3 rounded-lg border bg-muted/30">
              <div className="space-y-1 w-full min-w-0 sm:w-auto">
                <Label>ID (e.g. id_book)</Label>
                <Input
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="id_book"
                  className="h-9 w-full sm:w-40"
                />
              </div>
              <div className="space-y-1 w-full min-w-0 sm:w-auto">
                <Label>Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ID Book"
                  className="h-9 w-full sm:w-40"
                />
              </div>
              <label className="flex w-full min-w-0 sm:w-auto items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRequiresExpiry}
                  onChange={(e) => setNewRequiresExpiry(e.target.checked)}
                />
                <span className="text-sm">Requires expiry date</span>
              </label>
              <Button size="sm" onClick={handleAdd} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewId("");
                  setNewName("");
                  setNewRequiresExpiry(false);
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {documentTypes.length === 0 && !isAdding ? (
            <p className="text-sm text-muted-foreground py-4">
              No document types yet. Add one to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {documentTypes.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 min-w-0"
                >
                  {editingId === row.id ? (
                    <div className="flex flex-wrap gap-2 items-center flex-1 min-w-0">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-9 w-full min-w-0 sm:w-40"
                      />
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={editRequiresExpiry}
                          onChange={(e) => setEditRequiresExpiry(e.target.checked)}
                        />
                        Requires expiry
                      </label>
                      <Button size="sm" onClick={handleUpdate} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="font-medium">{row.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">({row.id})</span>
                        {row.requiresExpiry && (
                          <span className="text-xs text-muted-foreground ml-2">· Requires expiry</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(row)} disabled={isSubmitting}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRemoveTarget(row.id)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
        onConfirm={() => { if (removeTarget) handleRemove(removeTarget); }}
        title="Remove document type"
        description="Remove this document type? Existing documents of this type will not be deleted."
        confirmLabel="Remove"
      />
    </div>
  );
}
