import { Navigate, Outlet } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { Loader2 } from "lucide-react";

/**
 * Wrapper component that redirects users without a profile to onboarding
 * Should be used inside ProtectedRoute (after auth is verified)
 */
export function RequireProfile() {
  const hasCompletedOnboarding = useQuery(api.userProfiles.queries.hasCompletedOnboarding);
  const updateCurrentProfile = useMutation(api.userProfiles.mutations.updateCurrentProfile);

  useEffect(() => {
    updateCurrentProfile({});
  }, []);

  // Loading state
  if (hasCompletedOnboarding === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Redirect to onboarding if no profile
  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
