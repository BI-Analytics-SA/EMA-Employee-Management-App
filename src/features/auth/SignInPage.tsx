import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Loader2, AlertCircle } from "lucide-react";

/**
 * Parse Convex Auth errors into user-friendly messages
 */
function getErrorMessage(error: unknown, flow: "signIn" | "signUp"): string {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  // Email/Account not found errors
  if (
    lowerMessage.includes("invalidaccountid") ||
    lowerMessage.includes("invalid account") ||
    lowerMessage.includes("account not found") ||
    lowerMessage.includes("user not found")
  ) {
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

  // Account already exists (during sign up)
  if (
    lowerMessage.includes("already exists") ||
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("account exists")
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
  } else {
    return "Unable to create account. Please try again.";
  }
}

export function SignInPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const navigate = useNavigate();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;

    // Validate password confirmation during sign up
    if (flow === "signUp") {
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please make sure both passwords are the same.");
        return;
      }
    }

    setIsLoading(true);

    try {
      await signIn("password", formData);
      // Navigation will happen automatically via the useEffect above
    } catch (err) {
      setError(getErrorMessage(err, flow));
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {flow === "signIn" ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {flow === "signIn"
              ? "Sign in to your Employee Management account"
              : "Create a new account to get started"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3 text-sm bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

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
              />
            </div>

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

            <input name="flow" type="hidden" value={flow} />
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {flow === "signIn" ? "Sign In" : "Create Account"}
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              {flow === "signIn" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => {
                      setFlow("signUp");
                      setError(null);
                      setConfirmPassword("");
                    }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => {
                      setFlow("signIn");
                      setError(null);
                      setConfirmPassword("");
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
