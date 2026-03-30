import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Loader2, AlertCircle, UserPlus, CheckCircle2 } from "lucide-react";
import logoImg from "@/assets/logo.png";

type AuthFlow = "signIn" | "signUp" | "forgot" | "resetCode";

/**
 * Parse Convex Auth errors into user-friendly messages
 */
function getErrorMessage(error: unknown, flow: AuthFlow): string {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  // Email/Account not found errors
  if (
    lowerMessage.includes("invalidaccountid") ||
    lowerMessage.includes("invalid account") ||
    lowerMessage.includes("account not found") ||
    lowerMessage.includes("user not found")
  ) {
    if (flow === "forgot") {
      return "No account found with this email address. Please check your email.";
    }
    return "No account found with this email address. Please check your email (email addresses are case sensitive) or sign up for a new account.";
  }

  // Wrong password errors
  if (
    lowerMessage.includes("invalid password") ||
    lowerMessage.includes("incorrect password") ||
    lowerMessage.includes("wrong password") ||
    lowerMessage.includes("invalidcredentials") ||
    lowerMessage.includes("invalid credentials")
  ) {
    return "Incorrect password. Please try again or reset your password.";
  }

  // Invalid/expired reset code
  if (
    flow === "resetCode" &&
    (lowerMessage.includes("invalid") || lowerMessage.includes("expired")) &&
    (lowerMessage.includes("code") || lowerMessage.includes("token"))
  ) {
    return "Invalid or expired code. Please request a new reset code.";
  }

  // Account already exists (during sign up)
  if (
    lowerMessage.includes("already exists") ||
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("account exists") ||
    lowerMessage.includes("email already") ||
    lowerMessage.includes("user already") ||
    lowerMessage.includes("already registered")
  ) {
    return "An account with this email already exists. Please sign in instead.";
  }

  // Password requirements
  if (
    lowerMessage.includes("password") &&
    (lowerMessage.includes("short") ||
      lowerMessage.includes("weak") ||
      lowerMessage.includes("requirements") ||
      lowerMessage.includes("characters"))
  ) {
    return "Password must be at least 8 characters long.";
  }

  // Invalid email format
  if (lowerMessage.includes("invalid email") || lowerMessage.includes("email format")) {
    return "Please enter a valid email address.";
  }

  // Rate limiting
  if (lowerMessage.includes("rate limit") || lowerMessage.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // Generic fallback based on flow
  if (flow === "signIn") {
    return "Unable to sign in. Please check your email and password.";
  } else if (flow === "signUp") {
    return "Unable to create account. Please try again.";
  } else if (flow === "forgot") {
    return "Unable to send reset code. Please try again.";
  } else {
    return "Unable to reset password. Please check the code and try again.";
  }
}

export function SignInPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get redirect URL and extract invite code if present
  const redirectUrl = searchParams.get("redirect");
  const inviteCode = useMemo(() => {
    if (redirectUrl) {
      try {
        const url = new URL(redirectUrl, window.location.origin);
        return url.searchParams.get("invite");
      } catch {
        return null;
      }
    }
    return null;
  }, [redirectUrl]);

  // Query invite details if we have an invite code
  const inviteDetails = useQuery(
    api.invites.queries.getByCode,
    inviteCode ? { code: inviteCode } : "skip"
  );

  // Default to sign-up flow if coming from an invite
  const [flow, setFlow] = useState<AuthFlow>(inviteCode ? "signUp" : "signIn");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  // Email carried from "forgot" step into "resetCode" step
  const [resetEmail, setResetEmail] = useState("");
  // Controlled value for the email input field
  const [emailInput, setEmailInput] = useState(inviteDetails?.email || "");

  // Sync emailInput when returning to "forgot" so the previous address is pre-filled
  useEffect(() => {
    if (flow === "forgot" && resetEmail) {
      setEmailInput(resetEmail);
    }
  }, [flow, resetEmail]);

  // Update flow when invite code is detected
  useEffect(() => {
    if (inviteCode && flow === "signIn") {
      setFlow("signUp");
    }
  }, [inviteCode, flow]);

  // Redirect after authentication
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      // Redirect to original destination or home
      const destination = redirectUrl || "/";
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate, redirectUrl]);

  const switchFlow = (next: AuthFlow) => {
    setFlow(next);
    setError(null);
    setConfirmPassword("");
    setConfirmNewPassword("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    if (flow === "signUp") {
      const password = formData.get("password") as string;
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please make sure both passwords are the same.");
        return;
      }
    }

    if (flow === "resetCode") {
      const newPassword = formData.get("newPassword") as string;
      if (newPassword !== confirmNewPassword) {
        setError("Passwords do not match. Please make sure both passwords are the same.");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (flow === "forgot") {
        const email = formData.get("email") as string;
        await signIn("password", formData);
        setResetEmail(email);
        setFlow("resetCode");
        setError(null);
      } else {
        await signIn("password", formData);
        // For signIn/signUp/resetCode, navigation happens via the useEffect above
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      console.error("[Auth error]", err);
      const friendly = getErrorMessage(err, flow);
      const showDebug = searchParams.get("debug") === "1";
      setError(showDebug ? `${friendly} (Debug: ${rawMessage})` : friendly);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth status
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const cardTitle = {
    signIn: "Welcome Back",
    signUp: "Create Account",
    forgot: "Reset Password",
    resetCode: "Enter Reset Code",
  }[flow];

  const cardDescription = {
    signIn: "Sign in to your Employee Management account",
    signUp: inviteDetails ? "Create an account to join the team" : "Create a new account to get started",
    forgot: "Enter your email address and we'll send you a reset code",
    resetCode: `Check your email for the 8-digit code sent to ${resetEmail}`,
  }[flow];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <img
            src={logoImg}
            alt="Pepl"
            className="mx-auto mb-3 h-12 w-12 shrink-0 rounded-xl object-contain"
          />
          <CardTitle className="text-2xl">{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>

        {/* Invite banner */}
        {inviteDetails && flow === "signUp" && (
          <div className="mx-6 mb-2 p-4 bg-accent/5 border border-accent/20 rounded-lg">
            <div className="flex items-start gap-3">
              <UserPlus className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  You've been invited to join {inviteDetails.organizationName}
                </p>
                <p className="text-muted-foreground mt-1">
                  Create an account to accept your invitation as a{" "}
                  <span className="font-medium">{inviteDetails.role}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3 text-sm bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <span className="text-destructive">{error}</span>
              </div>
            )}

            {/* ── Sign in / Sign up / Forgot: email field ── */}
            {(flow === "signIn" || flow === "signUp" || flow === "forgot") && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  readOnly={!!inviteDetails?.email && flow === "signUp"}
                  className={inviteDetails?.email && flow === "signUp" ? "bg-muted" : ""}
                />
                {inviteDetails?.email && flow === "signUp" && (
                  <p className="text-xs text-muted-foreground">
                    This invite is restricted to this email address
                  </p>
                )}
              </div>
            )}

            {/* ── Sign in / Sign up: password field ── */}
            {(flow === "signIn" || flow === "signUp") && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  autoComplete={flow === "signIn" ? "current-password" : "new-password"}
                  disabled={isLoading}
                  minLength={8}
                />
                {flow === "signUp" && (
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters
                  </p>
                )}
              </div>
            )}

            {/* ── Sign up: confirm password ── */}
            {flow === "signUp" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}

            {/* ── Reset code step ── */}
            {flow === "resetCode" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">Reset Code</Label>
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="12345678"
                    required
                    autoComplete="one-time-code"
                    disabled={isLoading}
                    maxLength={8}
                    className="tracking-widest text-center text-lg font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 8-digit code from the email
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Choose a new password"
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>

                <input name="email" type="hidden" value={resetEmail} />
              </>
            )}

            <input
              name="flow"
              type="hidden"
              value={flow === "resetCode" ? "reset-verification" : flow === "forgot" ? "reset" : flow}
            />
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {flow === "signIn" && "Sign In"}
              {flow === "signUp" && "Create Account"}
              {flow === "forgot" && "Send Reset Code"}
              {flow === "resetCode" && (
                <>
                  {!isLoading && <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Reset Password
                </>
              )}
            </Button>

            {flow === "signIn" && (
              <div className="text-sm text-center text-muted-foreground">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => switchFlow("forgot")}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <div className="text-sm text-center text-muted-foreground">
              {flow === "signIn" && (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => switchFlow("signUp")}
                  >
                    Sign up
                  </button>
                </>
              )}
              {flow === "signUp" && (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => switchFlow("signIn")}
                  >
                    Sign in
                  </button>
                </>
              )}
              {(flow === "forgot" || flow === "resetCode") && (
                <>
                  Remember your password?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => switchFlow("signIn")}
                  >
                    Back to sign in
                  </button>
                </>
              )}
            </div>

            {flow === "resetCode" && (
              <div className="text-sm text-center text-muted-foreground">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline font-medium"
                  onClick={() => switchFlow("forgot")}
                >
                  Resend code
                </button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
