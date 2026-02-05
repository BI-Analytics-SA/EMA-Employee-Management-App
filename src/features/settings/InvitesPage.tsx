import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

type Role = "admin" | "manager" | "nurse" | "user";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  nurse: "Nurse",
  user: "User",
};

const STATUS_ICONS = {
  pending: Clock,
  used: CheckCircle2,
  revoked: XCircle,
  expired: Clock,
};

const STATUS_COLORS = {
  pending: "text-yellow-600 bg-yellow-50",
  used: "text-green-600 bg-green-50",
  revoked: "text-red-600 bg-red-50",
  expired: "text-gray-600 bg-gray-50",
};

export function InvitesPage() {
  const { organizationId, isAdmin, isLoading: userLoading } = useCurrentUser();
  const createInvite = useMutation(api.invites.mutations.create);
  const revokeInvite = useMutation(api.invites.mutations.revoke);
  const sendInviteEmail = useAction(api.invites.actions.sendInviteEmail);

  const invites = useQuery(
    api.invites.queries.listByOrganization,
    organizationId ? { organizationId } : "skip"
  );

  const [isCreating, setIsCreating] = useState(false);
  const [newInviteRole, setNewInviteRole] = useState<Role>("user");
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(7);
  const [sendEmail, setSendEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    // Validate email is provided if sending email
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

      // Send email if requested
      if (sendEmail && newInviteEmail.trim()) {
        try {
          await sendInviteEmail({ inviteId });
          setSuccess(`Invite created and email sent to ${newInviteEmail}`);
        } catch (emailErr) {
          setError(
            `Invite created but email failed to send: ${emailErr instanceof Error ? emailErr.message : "Unknown error"}`
          );
        }
      } else {
        setSuccess("Invite created successfully");
      }

      setIsCreating(false);
      setNewInviteEmail("");
      setNewInviteRole("user");
      setSendEmail(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
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
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSendingEmailFor(null);
    }
  };

  const handleRevokeInvite = async (inviteId: Id<"invites">) => {
    try {
      await revokeInvite({ inviteId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke invite");
    }
  };

  const copyInviteLink = async (code: string) => {
    const link = `${window.location.origin}/onboarding?invite=${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
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
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <p>Only administrators can manage invites.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Invites</h1>
          <p className="text-muted-foreground">
            Invite new members to your organization
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invite
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 text-sm bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-3 text-sm bg-green-50 border border-green-200 rounded-md">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <span className="text-green-700">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Invite</CardTitle>
            <CardDescription>
              Generate an invite link to share with a new team member
            </CardDescription>
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
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isSubmitting}
                  >
                    <option value="user">User - Can manage employees</option>
                    <option value="nurse">Nurse - Can manage medical records</option>
                    <option value="manager">Manager - Can manage contracts</option>
                    <option value="admin">Admin - Full access</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires">Expires In</Label>
                  <select
                    id="expires"
                    value={expiresInDays ?? "never"}
                    onChange={(e) =>
                      setExpiresInDays(
                        e.target.value === "never" ? undefined : Number(e.target.value)
                      )
                    }
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <Label htmlFor="email">
                  Email {sendEmail ? "(Required)" : "(Optional)"}
                </Label>
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
                  {sendEmail
                    ? "The invite will only work for this specific email address"
                    : "If specified, only this email can use the invite"}
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
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We'll send an email with the invite link to the recipient
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {sendEmail ? (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create & Send Invite
                    </>
                  ) : (
                    "Create Invite"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
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
                  <div
                    key={invite._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-lg font-semibold tracking-wider">
                        {invite.code}
                      </div>
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {ROLE_LABELS[invite.role as Role]}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusColor}`}>
                            <StatusIcon className="h-3 w-3" />
                            {invite.effectiveStatus}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xs mt-1 flex flex-wrap items-center gap-x-1">
                          {invite.email && <span>For: {invite.email}</span>}
                          {invite.email && invite.emailSentAt && (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <Mail className="h-3 w-3" />
                              email sent
                            </span>
                          )}
                          {invite.email && !invite.emailSentAt && invite.effectiveStatus === "pending" && (
                            <span className="text-yellow-600">(email not sent)</span>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendEmail(invite._id, invite.code)}
                              title={invite.emailSentAt ? "Resend email" : "Send email"}
                              disabled={sendingEmailFor === invite.code}
                            >
                              {sendingEmailFor === invite.code ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyInviteLink(invite.code)}
                            title="Copy invite link"
                          >
                            {copiedCode === invite.code ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Link2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyInviteCode(invite.code)}
                            title="Copy code"
                          >
                            {copiedCode === invite.code ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeInvite(invite._id)}
                            className="text-red-600 hover:text-red-700"
                          >
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
    </div>
  );
}
