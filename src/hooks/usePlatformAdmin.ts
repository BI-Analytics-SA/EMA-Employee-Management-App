import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function usePlatformAdmin() {
  const isPlatformAdmin = useQuery(api.platform.queries.isCurrentUserPlatformAdmin);

  return {
    isPlatformAdmin: isPlatformAdmin === true,
    isLoading: isPlatformAdmin === undefined,
  };
}
