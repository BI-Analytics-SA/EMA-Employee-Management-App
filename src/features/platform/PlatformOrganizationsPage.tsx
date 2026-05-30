import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Save, Search, BarChart3, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/dateUtils";
import { PlatformBillingSection } from "./components/PlatformBillingSection";

type PlanStatusValue = "trial" | "active" | "expired" | "legacy_active";

type ModuleFlags = {
  contracts: boolean;
  documents: boolean;
  exporting: boolean;
  jobs: boolean;
};

const MODULE_LABELS: { key: keyof ModuleFlags; label: string }[] = [
  { key: "contracts", label: "Contracts" },
  { key: "documents", label: "Documents" },
  { key: "exporting", label: "Configurable export" },
  { key: "jobs", label: "Jobs" },
];

function msToDatetimeLocal(ms: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function msToDateInput(ms: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function datetimeLocalToMs(value: string): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function dateInputToMs(value: string): number | null {
  if (!value) return null;
  const ms = parseLocalDate(value);
  return ms === undefined ? null : ms;
}

function formatPlanLabel(status: PlanStatusValue): string {
  switch (status) {
    case "trial":
      return "Trial";
    case "active":
      return "Active (paid)";
    case "expired":
      return "Expired";
    case "legacy_active":
      return "Legacy (unrestricted)";
  }
}

export function PlatformOrganizationsPage() {
  const admins = useQuery(api.platform.queries.listPlatformAdmins);
  const organizations = useQuery(api.platform.queries.listOrganizations);
  const addAdmin = useMutation(api.platform.mutations.addPlatformAdmin);
  const removeAdmin = useMutation(api.platform.mutations.removePlatformAdmin);
  const updateOrganization = useMutation(api.platform.mutations.updateOrganization);
  const extendTrial = useMutation(api.platform.mutations.extendTrial);

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<Id<"organizations"> | null>(null);
  const [activeTab, setActiveTab] = useState<"billing" | "manage">("billing");

  const selected = useMemo(
    () => organizations?.find((o) => o.id === selectedId) ?? null,
    [organizations, selectedId]
  );

  const [editPlanStatus, setEditPlanStatus] = useState<PlanStatusValue>("active");
  const [editSignedUp, setEditSignedUp] = useState("");
  const [editTrialStarted, setEditTrialStarted] = useState("");
  const [editPlanActivated, setEditPlanActivated] = useState("");
  const [editPlanExpired, setEditPlanExpired] = useState("");
  const [editTrialEnds, setEditTrialEnds] = useState("");
  const [editAllowed, setEditAllowed] = useState<ModuleFlags>({
    contracts: false,
    documents: false,
    exporting: false,
    jobs: false,
  });
  const [configureAllowed, setConfigureAllowed] = useState(true);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgBusy, setOrgBusy] = useState(false);

  const loadSelectionIntoForm = (org: NonNullable<typeof selected>) => {
    setEditPlanStatus(org.planStatus as PlanStatusValue);
    setEditSignedUp(msToDateInput(org.signedUpAt));
    setEditTrialStarted(msToDateInput(org.trialStartedAt));
    setEditPlanActivated(msToDateInput(org.planActivatedAt));
    setEditPlanExpired(msToDateInput(org.planExpiredAt));
    setEditTrialEnds(msToDatetimeLocal(org.trialEndsAt));
    setEditAllowed({ ...org.allowedModules });
    setConfigureAllowed(org.hasAllowedModulesConfigured || org.planStatus === "active");
    setOrgError(null);
  };

  const handleSelectOrg = (id: Id<"organizations">) => {
    setSelectedId(id);
    const org = organizations?.find((o) => o.id === id);
    if (org) loadSelectionIntoForm(org);
  };

  const filteredOrgs = useMemo(() => {
    if (!organizations) return [];
    const q = search.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter(
      (o) =>
        o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)
    );
  }, [organizations, search]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminBusy(true);
    setAdminError(null);
    try {
      await addAdmin({ email: newAdminEmail });
      setNewAdminEmail("");
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Failed to add administrator");
    } finally {
      setAdminBusy(false);
    }
  };

  const handleRemoveAdmin = async (id: Id<"platformAdmins">) => {
    if (!confirm("Remove this platform administrator?")) return;
    setAdminBusy(true);
    setAdminError(null);
    try {
      await removeAdmin({ id });
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Failed to remove administrator");
    } finally {
      setAdminBusy(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!selectedId) return;
    setOrgBusy(true);
    setOrgError(null);
    try {
      const trialMs = datetimeLocalToMs(editTrialEnds) ?? undefined;
      await updateOrganization({
        organizationId: selectedId,
        planStatus: editPlanStatus,
        signedUpAt: editSignedUp ? dateInputToMs(editSignedUp) ?? undefined : undefined,
        trialStartedAt: editTrialStarted ? dateInputToMs(editTrialStarted) ?? undefined : undefined,
        planActivatedAt: editPlanActivated ? dateInputToMs(editPlanActivated) ?? undefined : undefined,
        planExpiredAt: editPlanExpired ? dateInputToMs(editPlanExpired) ?? undefined : undefined,
        trialEndsAt: trialMs,
        allowedModules: editAllowed,
        setAllowedModules: configureAllowed,
      });
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : "Failed to update organisation");
    } finally {
      setOrgBusy(false);
    }
  };

  const handleExtendTrial = async (days: number) => {
    if (!selectedId) return;
    setOrgBusy(true);
    setOrgError(null);
    try {
      const result = await extendTrial({
        organizationId: selectedId,
        additionalDays: days,
      });
      setEditPlanStatus("trial");
      setEditTrialEnds(msToDatetimeLocal(result.trialEndsAt));
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : "Failed to extend trial");
    } finally {
      setOrgBusy(false);
    }
  };

  if (admins === undefined || organizations === undefined) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & organisations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invoicing, analytics, and customer plan management.
        </p>
      </div>

      <div className="flex rounded-lg border p-1 gap-1 w-fit">
        <Button
          type="button"
          size="sm"
          variant={activeTab === "billing" ? "default" : "ghost"}
          onClick={() => setActiveTab("billing")}
        >
          <BarChart3 className="h-4 w-4 mr-1" />
          Billing & analytics
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === "manage" ? "default" : "ghost"}
          onClick={() => setActiveTab("manage")}
        >
          <Settings2 className="h-4 w-4 mr-1" />
          Manage organisations
        </Button>
      </div>

      {activeTab === "billing" && <PlatformBillingSection />}

      {activeTab === "manage" && (
        <div className="space-y-8">
      {/* Platform administrators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform administrators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Only these accounts can access this page and change organisation billing settings.
          </p>
          <ul className="divide-y rounded-lg border">
            {admins.map((admin) => (
              <li
                key={admin.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="font-medium">{admin.email}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={adminBusy || admins.length <= 1}
                  onClick={() => handleRemoveAdmin(admin.id)}
                  aria-label={`Remove ${admin.email}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddAdmin} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="new-admin-email">Add administrator email</Label>
              <Input
                id="new-admin-email"
                type="email"
                placeholder="colleague@bi-analytics.co.za"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
                disabled={adminBusy}
              />
            </div>
            <Button type="submit" disabled={adminBusy}>
              {adminBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </>
              )}
            </Button>
          </form>
          {adminError && <p className="text-sm text-destructive">{adminError}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Organisation list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-[32rem] overflow-y-auto rounded-lg border divide-y">
            {filteredOrgs.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => handleSelectOrg(org.id)}
                className={cn(
                  "w-full text-left px-4 py-3 transition-colors hover:bg-muted/50",
                  selectedId === org.id && "bg-accent/10 border-l-2 border-l-accent"
                )}
              >
                <p className="font-medium text-sm">{org.name}</p>
                <p className="text-xs text-muted-foreground">{org.slug}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatPlanLabel(org.planStatus as PlanStatusValue)}
                  {org.planStatus === "trial" && org.trialDaysRemaining !== null && (
                    <> · {org.trialDaysRemaining}d left</>
                  )}
                  {" · "}
                  {org.memberCount} member{org.memberCount !== 1 ? "s" : ""}
                </p>
              </button>
            ))}
            {filteredOrgs.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No organisations found.</p>
            )}
          </div>
        </div>

        {/* Edit panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selected ? selected.name : "Select an organisation"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selected ? (
                <p className="text-sm text-muted-foreground">
                  Choose an organisation from the list to edit its plan and modules.
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="plan-status">Plan status</Label>
                    <select
                      id="plan-status"
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={editPlanStatus}
                      onChange={(e) =>
                        setEditPlanStatus(e.target.value as PlanStatusValue)
                      }
                      disabled={orgBusy}
                    >
                      <option value="trial">Trial</option>
                      <option value="active">Active (paid)</option>
                      <option value="expired">Expired (locked out)</option>
                      <option value="legacy_active">Legacy (unrestricted)</option>
                    </select>
                  </div>

                  <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
                    <p className="text-sm font-medium">Billing & analytics dates</p>
                    <p className="text-xs text-muted-foreground">
                      Exact dates for sign-ups, trends, and invoicing. Saving rebuilds plan event
                      history for charts.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="signed-up">Signed up</Label>
                        <Input
                          id="signed-up"
                          type="date"
                          value={editSignedUp}
                          onChange={(e) => setEditSignedUp(e.target.value)}
                          disabled={orgBusy}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trial-started">Trial started</Label>
                        <Input
                          id="trial-started"
                          type="date"
                          value={editTrialStarted}
                          onChange={(e) => setEditTrialStarted(e.target.value)}
                          disabled={orgBusy}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-activated">Paying since (plan activated)</Label>
                        <Input
                          id="plan-activated"
                          type="date"
                          value={editPlanActivated}
                          onChange={(e) => setEditPlanActivated(e.target.value)}
                          disabled={orgBusy}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-expired">Plan expired (optional)</Label>
                        <Input
                          id="plan-expired"
                          type="date"
                          value={editPlanExpired}
                          onChange={(e) => setEditPlanExpired(e.target.value)}
                          disabled={orgBusy}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trial-ends">Trial ends</Label>
                    <Input
                      id="trial-ends"
                      type="datetime-local"
                      value={editTrialEnds}
                      onChange={(e) => setEditTrialEnds(e.target.value)}
                      disabled={orgBusy}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={orgBusy}
                        onClick={() => handleExtendTrial(7)}
                      >
                        +7 days
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={orgBusy}
                        onClick={() => handleExtendTrial(14)}
                      >
                        +14 days
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={orgBusy}
                        onClick={() => setEditTrialEnds("")}
                      >
                        Clear date
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Allowed modules (billing)</Label>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={configureAllowed}
                          onChange={(e) => setConfigureAllowed(e.target.checked)}
                          disabled={orgBusy}
                        />
                        Enforce entitlements
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When enforced, the customer can only enable modules you allow here. During
                      trial, all modules stay available regardless.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {MODULE_LABELS.map(({ key, label }) => (
                        <label
                          key={key}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border p-3 text-sm",
                            !configureAllowed && "opacity-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={editAllowed[key]}
                            onChange={(e) =>
                              setEditAllowed((prev) => ({
                                ...prev,
                                [key]: e.target.checked,
                              }))
                            }
                            disabled={orgBusy || !configureAllowed}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Currently enabled (customer toggles)</Label>
                    <div className="flex flex-wrap gap-2">
                      {MODULE_LABELS.map(({ key, label }) => (
                        <span
                          key={key}
                          className={cn(
                            "rounded-md px-2 py-1 text-xs border",
                            selected.enabledModules[key]
                              ? "bg-success/10 border-success/30 text-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {label}: {selected.enabledModules[key] ? "On" : "Off"}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleSaveOrg} disabled={orgBusy} className="w-full sm:w-auto">
                    {orgBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save changes
                  </Button>
                  {orgError && <p className="text-sm text-destructive">{orgError}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
