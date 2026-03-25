import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { extractConvexError } from "@/lib/convex-error";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

type DataManagementField = "departments" | "deptGroups" | "shifts" | "shiftAllocations";

const TABS: { id: DataManagementField; label: string }[] = [
  { id: "departments", label: "Departments" },
  { id: "deptGroups", label: "Department Groups" },
  { id: "shifts", label: "Shifts" },
  { id: "shiftAllocations", label: "Shift Allocations" },
];

export function DataManagementPage() {
  const { organizationId, organization, isAdmin, isLoading: userLoading, hasNoOrganizations } = useCurrentUser();
  const addItem = useMutation(api.organizations.mutations.addSettingsItem);
  const removeItem = useMutation(api.organizations.mutations.removeSettingsItem);

  const [activeTab, setActiveTab] = useState<DataManagementField>("departments");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items: string[] = organization?.settings?.[activeTab] ?? [];

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current != null) {
        clearTimeout(messageTimeoutRef.current);
        messageTimeoutRef.current = null;
      }
    };
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const scheduleClearMessages = () => {
    if (messageTimeoutRef.current != null) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      messageTimeoutRef.current = null;
      clearMessages();
    }, 3000);
  };

  const handleAdd = async () => {
    if (!organizationId) return;
    const trimmed = newValue.trim();
    if (!trimmed) {
      setError("Value cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await addItem({
        organizationId,
        field: activeTab,
        value: trimmed,
      });
      setSuccess("Added.");
      scheduleClearMessages();
      setNewValue("");
    } catch (e) {
      setError(extractConvexError(e, "Failed to add."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (value: string) => {
    if (!organizationId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await removeItem({ organizationId, field: activeTab, value });
      setSuccess("Removed.");
      scheduleClearMessages();
    } catch (e) {
      setError(extractConvexError(e, "Failed to remove."));
    } finally {
      setIsSubmitting(false);
      setRemoveTarget(null);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasNoOrganizations || !organizationId) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">
          You need to belong to an organization to manage data.{" "}
          <Link to="/organizations/new" className="text-primary underline">
            Create or join an organization
          </Link>{" "}
          to get started.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4">
        <p className="text-destructive">Only organization admins can manage this data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Data Management</h1>
      <p className="text-sm text-muted-foreground">
        Define departments, department groups, shifts, and shift allocations for your organization. These options will appear in dropdowns when adding or editing employees.
      </p>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setActiveTab(tab.id); clearMessages(); }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-md border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary bg-muted/50"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="bg-muted/70 px-4 py-3 border-b">
          <h2 className="text-sm font-semibold">{TABS.find((t) => t.id === activeTab)?.label}</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1 min-w-0 flex-1 sm:max-w-xs">
              <Label htmlFor="new-value">Add new</Label>
              <Input
                id="new-value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={
                  activeTab === "departments"
                    ? "e.g. Sales"
                    : activeTab === "deptGroups"
                      ? "e.g. CAPS1"
                      : activeTab === "shifts"
                        ? "e.g. A"
                        : "e.g. COR"
                }
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="h-9"
              />
            </div>
            <Button size="sm" onClick={handleAdd} disabled={isSubmitting || !newValue.trim()}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No items yet. Add one above to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <span className="font-medium">{item}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRemoveTarget(item)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
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
        title="Remove item"
        description={`Remove "${removeTarget}"? This will not change employees already using this value.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
