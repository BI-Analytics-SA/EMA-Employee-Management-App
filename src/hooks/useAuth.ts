import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

/**
 * Hook for authentication state and actions
 */
export function useAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  return {
    isAuthenticated,
    isLoading,
    signOut: () => signOut(),
  };
}
