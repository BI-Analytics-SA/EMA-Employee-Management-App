import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const STORAGE_KEY = "ema-active-org";

type OrganizationProfile = {
  _id: Id<"userProfiles">;
  organizationId: Id<"organizations">;
  role: string;
  name: string;
};

type OrganizationEntry = {
  _id: Id<"organizations">;
  name: string;
  slug: string;
};

export type OrganizationWithProfile = {
  profile: OrganizationProfile;
  organization: OrganizationEntry;
};

type OrganizationContextValue = {
  activeOrganizationId: Id<"organizations"> | null;
  setActiveOrganization: (id: Id<"organizations">) => void;
  organizations: OrganizationWithProfile[];
  isLoading: boolean;
  /** True after client has read active org from localStorage; use to avoid acting on pre-hydration null. */
  isHydrated: boolean;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const myOrgs = useQuery(api.userProfiles.queries.getMyOrganizations);
  const [activeId, setActiveId] = useState<Id<"organizations"> | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Read stored active org on client only to avoid SSR/hydration mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setActiveId(stored as Id<"organizations">);
    } catch {
      // ignore
    }
    setIsHydrated(true);
  }, []);

  const organizations = myOrgs ?? [];
  const validIds = useMemo(
    () => new Set(organizations.map((o) => o.organization._id)),
    [organizations]
  );

  // Derive a validated org ID: null while loading, validated once orgs arrive.
  // This prevents stale localStorage values from reaching downstream queries.
  const resolvedActiveId = useMemo(() => {
    if (myOrgs === undefined) return null;
    if (myOrgs.length === 0) return null;
    if (activeId && validIds.has(activeId)) return activeId;
    return myOrgs[0].organization._id;
  }, [myOrgs, activeId, validIds]);

  // Sync internal state and localStorage when the resolved ID diverges
  useEffect(() => {
    if (myOrgs === undefined) return;
    if (resolvedActiveId !== activeId) {
      setActiveId(resolvedActiveId);
    }
    try {
      if (resolvedActiveId) {
        localStorage.setItem(STORAGE_KEY, resolvedActiveId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [myOrgs, resolvedActiveId, activeId]);

  const setActiveOrganization = useCallback((id: Id<"organizations">) => {
    setActiveId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<OrganizationContextValue>(
    () => ({
      activeOrganizationId: resolvedActiveId,
      setActiveOrganization,
      organizations,
      isLoading: myOrgs === undefined,
      isHydrated,
    }),
    [resolvedActiveId, setActiveOrganization, organizations, myOrgs, isHydrated]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error("useOrganizationContext must be used within OrganizationProvider");
  }
  return ctx;
}
