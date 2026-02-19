import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, AlertCircle, Building2, CheckCircle2, UserPlus } from "lucide-react";

/**
 * Generate a URL-safe slug from text
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type OnboardingMode = "choose" | "create" | "join";

export function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCodeFromUrl = searchParams.get("invite");

  const createOrganization = useMutation(api.organizations.mutations.create);
  const useInvite = useMutation(api.invites.mutations.useInvite);
  const hasCompletedOnboarding = useQuery(api.userProfiles.queries.hasCompletedOnboarding);

  // Determine initial mode based on URL
  const [mode, setMode] = useState<OnboardingMode>(inviteCodeFromUrl ? "join" : "choose");

  // Create org form state
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Join org form state
  const [inviteCode, setInviteCode] = useState(inviteCodeFromUrl || "");
  const [userName, setUserName] = useState("");

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check slug availability
  const isSlugAvailable = useQuery(
    api.organizations.queries.isSlugAvailable,
    slug.length >= 3 ? { slug } : "skip"
  );

  // Check invite validity
  const inviteDetails = useQuery(
    api.invites.queries.getByCode,
    inviteCode.length >= 4 ? { code: inviteCode.toUpperCase() } : "skip"
  );

  // Auto-generate slug from org name (unless manually edited)
  useEffect(() => {
    if (!slugManuallyEdited && orgName) {
      setSlug(generateSlug(orgName));
    }
  }, [orgName, slugManuallyEdited]);

  // Redirect if user already has a profile
  useEffect(() => {
    if (hasCompletedOnboarding === true) {
      navigate("/", { replace: true });
    }
  }, [hasCompletedOnboarding, navigate]);

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(generateSlug(value));
  };

  const handleCreateOrg = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (orgName.trim().length < 2) {
      setError("Organization name must be at least 2 characters.");
      return;
    }

    if (slug.length < 3) {
      setError("Organization URL must be at least 3 characters.");
      return;
    }

    if (isSlugAvailable === false) {
      setError("This organization URL is already taken. Please choose another.");
      return;
    }

    setIsLoading(true);

    try {
      await createOrganization({
        name: orgName.trim(),
        slug: slug,
      });
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create organization. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinOrg = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!inviteCode.trim()) {
      setError("Please enter an invite code.");
      return;
    }

    if (!userName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!inviteDetails) {
      setError("Invalid or expired invite code. Please check and try again.");
      return;
    }

    setIsLoading(true);

    try {
      await useInvite({
        code: inviteCode.toUpperCase(),
        userName: userName.trim(),
      });
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to join organization. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking onboarding status
  if (hasCompletedOnboarding === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Choice screen
  if (mode === "choose") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome!</CardTitle>
            <CardDescription>
              How would you like to get started?
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setMode("create")}
            >
              <Building2 className="h-8 w-8 text-accent" />
              <div className="text-center">
                <div className="font-semibold">Create an Organization</div>
                <div className="text-sm text-muted-foreground">
                  Set up a new organization for your team
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setMode("join")}
            >
              <UserPlus className="h-8 w-8 text-accent" />
              <div className="text-center">
                <div className="font-semibold">Join an Organization</div>
                <div className="text-sm text-muted-foreground">
                  I have an invite code from my organization
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Join organization screen
  if (mode === "join") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <UserPlus className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-2xl">Join Organization</CardTitle>
            <CardDescription>
              Enter your invite code to join an existing organization
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleJoinOrg}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 p-3 text-sm bg-destructive/10 border border-destructive/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-destructive">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="e.g., ABC12345"
                  required
                  disabled={isLoading}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  autoFocus
                  className="uppercase tracking-wider"
                />
                {inviteCode.length >= 4 && (
                  <div className="flex items-center gap-2 text-xs">
                    {inviteDetails === undefined ? (
                      <span className="text-muted-foreground">Checking invite code...</span>
                    ) : inviteDetails ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        <span className="text-success">
                          Valid invite to join <strong>{inviteDetails.organizationName}</strong> as {inviteDetails.role}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-destructive">Invalid or expired invite code</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="userName">Your Name</Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="e.g., John Smith"
                  required
                  disabled={isLoading}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This is how your name will appear to others in the organization
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !inviteDetails}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Join Organization
              </Button>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setMode("choose");
                  setError(null);
                }}
              >
                ← Back to options
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Create organization screen
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Building2 className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl">Create Your Organization</CardTitle>
          <CardDescription>
            Set up your organization to start managing employees
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleCreateOrg}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3 text-sm bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <span className="text-destructive">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                type="text"
                placeholder="e.g., Acme Corporation"
                required
                disabled={isLoading}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                The name of your company or organization
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Organization URL</Label>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-muted-foreground shrink-0">app/</span>
                <Input
                  id="slug"
                  type="text"
                  placeholder="acme-corp"
                  required
                  disabled={isLoading}
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="min-w-0 flex-1"
                />
              </div>
              {slug.length >= 3 && (
                <div className="flex items-center gap-2 text-xs">
                  {isSlugAvailable === undefined ? (
                    <span className="text-muted-foreground">Checking availability...</span>
                  ) : isSlugAvailable ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      <span className="text-success">This URL is available</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-destructive">This URL is already taken</span>
                    </>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                A unique identifier for your organization (lowercase, no spaces)
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isSlugAvailable === false || slug.length < 3}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setMode("choose");
                setError(null);
              }}
            >
              ← Back to options
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
