import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Menu, Bell, Sun, Moon, LogOut, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";
import { APP_VERSION } from "@/lib/version";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { organization, organizationId, userName } = useCurrentUser();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const documentsEnabled = useModuleEnabled("documents");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Expiring documents count (only query when documents module is enabled)
  const expiringDocs = useQuery(
    api.documents.queries.getExpiringByOrganization,
    documentsEnabled && organizationId ? { organizationId, daysAhead: 30 } : "skip"
  );
  const expiringCount = expiringDocs?.length ?? 0;

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      {/* Hamburger (mobile only) */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Organization name */}
      {organization?.name && (
        <span className="hidden sm:inline text-lg font-semibold text-foreground truncate max-w-[300px]">
          {organization.name}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right-side items */}
      <div className="flex items-center gap-1">
        {/* Expiring documents bell (only when documents module is enabled) */}
        {documentsEnabled && (
          <Link to="/documents/expiring">
            <Button variant="ghost" size="icon" className="relative" title="Expiring documents">
              <Bell className="h-5 w-5" />
              {expiringCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {expiringCount > 99 ? "99+" : expiringCount}
                </span>
              )}
            </Button>
          </Link>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User avatar dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </div>
            <span className="hidden lg:inline text-sm font-medium truncate max-w-[200px]" title={userName}>
              {userName}
            </span>
            <ChevronDown className="hidden lg:inline h-4 w-4 text-muted-foreground" />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border bg-card shadow-dropdown py-1 z-50">
              {/* User info */}
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium truncate">{userName}</p>
                {organization?.name && (
                  <p className="text-xs text-muted-foreground truncate">{organization.name}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1" title="App version">
                  App version {APP_VERSION}
                </p>
              </div>
              {/* Actions */}
              <Link
                to="/settings/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
