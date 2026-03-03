import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
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
import { Loader2, AlertCircle, CheckCircle2, User } from "lucide-react";

export function ProfilePage() {
  const { profile, isLoading: profileLoading } = useCurrentUser();
  const authUser = useQuery(api.users.queries.getCurrentUser);
  const updateProfile = useMutation(api.userProfiles.mutations.updateCurrentProfile);

  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form from profile when loaded
  useEffect(() => {
    if (profile?.name !== undefined) {
      setDisplayName(profile.name);
    }
  }, [profile?.name]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = displayName.trim();
    if (trimmed.length < 1) {
      setError("Display name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({ name: trimmed });
      setSuccess("Profile updated.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading || profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Profile not found. Please complete onboarding.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update how your name appears in the organization
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-3 text-sm bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <span className="text-destructive">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 p-3 text-sm bg-success/10 border border-success/30 rounded-lg text-success">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="e.g., John Smith"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                This is how your name appears to others in the organization
              </p>
            </div>

            {authUser?.email && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={authUser.email}
                  readOnly
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Sign-in email (managed by your account)
                </p>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
