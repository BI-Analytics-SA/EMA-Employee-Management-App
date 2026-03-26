import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { extractConvexError } from "@/lib/convex-error";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  AlertCircle,
  Plus,
  Copy,
  Check,
  XCircle,
  Clock,
  CheckCircle2,
  UserPlus,
  Link2,
  Mail,
  Send,
  Users,
  Trash2,
  UserX,
  UserCheck,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

type Role = "admin" | "manager" | "user";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  user: "User",
};

const ROLE_OPTIONS: Role[] = ["admin", "manager", "user"];

const STATUS_ICONS = {
  pending: Clock,
  used: CheckCircle2,
  revoked: XCircle,
  expired: Clock,
};

const STATUS_COLORS = {
  pending: "text-warning-foreground bg-warning/15",
  used: "text-success bg-success/15",
  revoked: "text-destructive bg-destructive/15",
  expired: "text-muted-foreground bg-muted",
};


export function TeamPage() {
  const { organizationId, isAdmin, isLoading: userLoading, profile: currentProfile } = useCurrentUser();

  // Mutations
  const updateRole = useMutation(api.userProfiles.mutations.updateRole);
  const deactivateUser = useMutation(api.userProfiles.mutations.deactivateUser);
  const reactivateUser = useMutation(api.userProfiles.mutations.reactivateUser);
  const deleteUser = useMutation(api.userProfiles.mutations.deleteUser);
  const createInvite = useMutation(api.invites.mutations.create);
  const revokeInvite = useMutation(api.invites.mutations.revoke);
  const sendInviteEmail = useAction(api.invites.actions.sendInviteEmail);

  const members = useQuery(
    api.userProfiles.queries.listByOrganization,
    organizationId ? { organizationId } : "skip"
  );
  const invites = useQuery(
    api.invites.queries.listByOrganization,
    organizationId ? { organizationId } : "skip"
  );

  const [activeTab, setActiveTab] = useState<"members" | "invites">("members");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invites state
  const [isCreating, setIsCreating] = useState(false);
  const [newInviteRole, setNewInviteRole] = useState<Role>("user");
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(7);
  const [sendEmail, setSendEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ profileId: Id<"userProfiles">; name: string } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<{ profileId: Id<"userProfiles">; name: string } | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Id<"invites"> | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleUpdateRole = async (profileId: Id<"userProfiles">, role: Role) => {
    try {
      await updateRole({ profileId, role });
      setSuccess("Role updated");
      setTimeout(clearMessages, 3000);
    } catch (err) {
      setError(extractConvexError(err, "Failed to update role"));
    }
  };

  const handleDeactivate = async (profileId: Id<"userProfiles">) => {
    setIsDeactivating(true);
    try {
      await deactivateUser({ profileId });
      setSuccess("User deactivated");
      setTimeout(clearMessages, 3000);
    } catch (err) {
      setError(extractConvexError(err, "Failed to deactivate user"));
    } finally {
      setIsDeactivating(false);
      setDeactivateTarget(null);
    }
  };

  const handleReactivate = async (profileId: Id<"userProfiles">) => {
    try {
      await reactivateUser({ profileId });
      setSuccess("User reactivated");
      setTimeout(clearMessages, 3000);
    } catch (err) {
      setError(extractConvexError(err, "Failed to reactivate user"));
    }
  };

  const handleDeleteClick = (profileId: Id<"userProfiles">, name: string) => {
    setDeleteTarget({ profileId, name });
    setDeleteConfirmName("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteConfirmName.trim() !== deleteTarget.name) return;
    setIsDeleting(true);
    try {
      await deleteUser({ profileId: deleteTarget.profileId });
      setSuccess("User removed");
      setDeleteTarget(null);
      setDeleteConfirmName("");
      setTimeout(clearMessages, 3000);
    } catch (err) {
      setError(extractConvexError(err, "Failed to delete user"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    if (sendEmail && !newInviteEmail.trim()) {
      setError("Email address is required when sending an invite email");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const { inviteId } = await createInvite({
        organizationId,
        role: newInviteRole,
        email: newInviteEmail.trim() || undefined,
        expiresInDays,
      });
      if (sendEmail && newInviteEmail.trim()) {
        try {
          await sendInviteEmail({ inviteId });
          setSuccess(`Invite created and email sent to ${newInviteEmail}`);
        } catch (emailErr) {
          setError(`Invite created but email failed: ${extractConvexError(emailErr, "Unknown error")}`);
        }
      } else {
        setSuccess("Invite created successfully");
      }
      setIsCreating(false);
      setNewInviteEmail("");
      setNewInviteRole("user");
      setSendEmail(false);
    } catch (err) {
      setError(extractConvexError(err, "Failed to create invite"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async (inviteId: Id<"invites">, code: string) => {
    setSendingEmailFor(code);
    setError(null);
    try {
      await sendInviteEmail({ inviteId });
      setSuccess("Email sent successfully");
    } catch (err) {
      setError(extractConvexError(err, "Failed to send email"));
    } finally {
      setSendingEmailFor(null);
    }
  };

  const handleRevokeInvite = async (inviteId: Id<"invites">) => {
    setIsRevoking(true);
    try {
      await revokeInvite({ inviteId });
    } catch (err) {
      setError(extractConvexError(err, "Failed to revoke invite"));
    } finally {
      setIsRevoking(false);
      setRevokeTarget(null);
    }
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/onboarding?invite=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 text-warning" />
            <p>Only administrators can manage the team.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            Manage team members and invites
          </p>
        </div>
        {activeTab === "invites" && !isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invite
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "members"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Members
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("invites")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "invites"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus className="h-4 w-4 inline mr-2" />
          Invites
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 text-sm bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <span className="text-destructive">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-destructive hover:text-destructive/80">×</button>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 p-3 text-sm bg-success/10 border border-success/30 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <span className="text-success">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-success hover:text-success/80">×</button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Permanently delete user?</CardTitle>
              <button onClick={() => { setDeleteTarget(null); setDeleteConfirmName(""); }} className="text-muted-foreground hover:text-foreground">×</button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This cannot be undone. Type <strong>{deleteTarget.name}</strong> to confirm.
              </p>
              <div className="space-y-2">
                <Label htmlFor="deleteConfirmName">Confirm name</Label>
                <Input
                  id="deleteConfirmName"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={deleteTarget.name}
                  disabled={isDeleting}
                  className="font-medium"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirmName(""); }} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleteConfirmName.trim() !== deleteTarget.name || isDeleting}
                >
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete permanently"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "members" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Members</CardTitle>
            <CardDescription>View and manage organization members</CardDescription>
          </CardHeader>
          <CardContent>
            {members === undefined ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No members yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const isCurrentUser = currentProfile?._id === member._id;
                  const isDeactivated = !member.isActive;

                  return (
                    <div
                      key={member._id}
                      className={`flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg min-w-0 ${
                        isCurrentUser ? "bg-primary/5 border-primary/20" : ""
                      } ${isDeactivated ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name}</span>
                            {isCurrentUser && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">You</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">{member.email ?? "—"}</div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === "admin" ? "bg-primary/15 text-primary" :
                          member.role === "manager" ? "bg-accent/15 text-accent" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {ROLE_LABELS[member.role as Role]}
                        </span>
                        {isDeactivated && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive">Inactive</span>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isCurrentUser && (
                            <>
                              <select
                                value={member.role}
                                onChange={(e) => handleUpdateRole(member._id, e.target.value as Role)}
                                className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              >
                                {ROLE_OPTIONS.map((r) => (
                                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                ))}
                              </select>
                              {member.isActive ? (
                                <Button variant="outline" size="sm" onClick={() => setDeactivateTarget({ profileId: member._id, name: member.name })} className="text-warning">
                                  <UserX className="h-4 w-4 mr-1" />
                                  Deactivate
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => handleReactivate(member._id)}>
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Reactivate
                                </Button>
                              )}
                              <Button variant="destructive-outline" size="sm" onClick={() => handleDeleteClick(member._id, member.name)}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "invites" && (
        <>
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create New Invite</CardTitle>
                <CardDescription>Generate an invite link to share with a new team member</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateInvite} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <select
                        id="role"
                        value={newInviteRole}
                        onChange={(e) => setNewInviteRole(e.target.value as Role)}
                        className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        disabled={isSubmitting}
                      >
                        <option value="user">User - Can manage employees</option>
                        <option value="manager">Manager - Can manage contracts</option>
                        <option value="admin">Admin - Full access</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expires">Expires In</Label>
                      <select
                        id="expires"
                        value={expiresInDays ?? "never"}
                        onChange={(e) => setExpiresInDays(e.target.value === "never" ? undefined : Number(e.target.value))}
                        className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        disabled={isSubmitting}
                      >
                        <option value="1">1 day</option>
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email {sendEmail ? "(Required)" : "(Optional)"}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newInviteEmail}
                      onChange={(e) => setNewInviteEmail(e.target.value)}
                      disabled={isSubmitting}
                      required={sendEmail}
                    />
                    <p className="text-xs text-muted-foreground">
                      {sendEmail ? "The invite will only work for this specific email address" : "If specified, only this email can use the invite"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <Label htmlFor="sendEmail" className="cursor-pointer flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Send invite email automatically
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">We'll send an email with the invite link to the recipient</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {sendEmail ? <><Send className="h-4 w-4 mr-2" />Create & Send Invite</> : "Create Invite"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setError(null); }} disabled={isSubmitting}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Invites</CardTitle>
            </CardHeader>
            <CardContent>
              {invites === undefined ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : invites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invites yet</p>
                  <p className="text-sm">Create an invite to add team members</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invites.map((invite) => {
                    const StatusIcon = STATUS_ICONS[invite.effectiveStatus as keyof typeof STATUS_ICONS];
                    const statusColor = STATUS_COLORS[invite.effectiveStatus as keyof typeof STATUS_COLORS];
                    return (
                      <div key={invite._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="font-mono text-lg font-semibold tracking-wider">{invite.code}</div>
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ROLE_LABELS[invite.role as Role]}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusColor}`}>
                                <StatusIcon className="h-3 w-3" />
                                {invite.effectiveStatus}
                              </span>
                            </div>
                            <div className="text-muted-foreground text-xs mt-1 flex flex-wrap items-center gap-x-1">
                              {invite.email && <span>For: {invite.email}</span>}
                              {invite.email && invite.emailSentAt && (
                                <span className="inline-flex items-center gap-1 text-success"><Mail className="h-3 w-3" />email sent</span>
                              )}
                              {invite.email && !invite.emailSentAt && invite.effectiveStatus === "pending" && (
                                <span className="text-warning">(email not sent)</span>
                              )}
                              <span>· Created by {invite.creatorName}</span>
                              {invite.usedByName && <span>· Used by {invite.usedByName}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {invite.effectiveStatus === "pending" && (
                            <>
                              {invite.email && (
                                <Button variant="outline" size="sm" onClick={() => handleResendEmail(invite._id, invite.code)} title={invite.emailSentAt ? "Resend email" : "Send email"} disabled={sendingEmailFor === invite.code}>
                                  {sendingEmailFor === invite.code ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => copyInviteLink(invite.code)} title="Copy invite link">
                                {copiedCode === invite.code ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => copyInviteCode(invite.code)} title="Copy code">
                                {copiedCode === invite.code ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                              </Button>
                              <Button variant="destructive-outline" size="sm" onClick={() => setRevokeTarget(invite._id)}>
                                Revoke
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}
        onConfirm={() => { if (deactivateTarget) handleDeactivate(deactivateTarget.profileId); }}
        title="Deactivate user"
        description={`Are you sure you want to deactivate ${deactivateTarget?.name ?? "this user"}? They will lose access.`}
        confirmLabel="Deactivate"
        loading={isDeactivating}
      />

      <ConfirmDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}
        onConfirm={() => { if (revokeTarget) handleRevokeInvite(revokeTarget); }}
        title="Revoke invite"
        description="Revoke this invite? The code will no longer work."
        confirmLabel="Revoke"
        variant="default"
        loading={isRevoking}
      />
    </div>
  );
}
