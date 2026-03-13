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

type OrganizationContextValue = {
  activeOrganizationId: Id<"organizations"> | null;
  setActiveOrganization: (id: Id<"organizations">) => void;
  organizations: { profile: { _id: Id<"userProfiles">; organizationId: Id<"organizations">; role: string; name: string }; organization: { _id: Id<"organizations">; name: string; slug: string } }[];
  isLoading: boolean;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const myOrgs = useQuery(api.userProfiles.queries.getMyOrganizations);
  const [activeId, setActiveId] = useState<Id<"organizations"> | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored as Id<"organizations"> | null;
    } catch {
      return null;
    }
  });

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
    if (resolvedActiveId) {
      try {
        localStorage.setItem(STORAGE_KEY, resolvedActiveId);
      } catch {
        // ignore
      }
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
    }),
    [resolvedActiveId, setActiveOrganization, organizations, myOrgs]
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
