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

  // When orgs load, ensure activeId is valid; otherwise default to first org
  useEffect(() => {
    if (myOrgs === undefined) return;
    if (myOrgs.length === 0) {
      setActiveId(null);
      return;
    }
    const ids = myOrgs.map((o) => o.organization._id);
    if (!activeId || !validIds.has(activeId)) {
      const next = ids[0];
      setActiveId(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
    }
  }, [myOrgs, activeId, validIds]);

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
      activeOrganizationId: activeId,
      setActiveOrganization,
      organizations,
      isLoading: myOrgs === undefined,
    }),
    [activeId, setActiveOrganization, organizations, myOrgs]
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
