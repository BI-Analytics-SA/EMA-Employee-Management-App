import { Menu, LogOut, Users, Home, UserPlus, FileStack, AlertTriangle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Header({ title = "Employee Management", onMenuClick }: HeaderProps) {
  const { signOut } = useAuth();
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const { isAdmin } = useCurrentUser();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Employees", href: "/employees", icon: Users },
    { label: "Expiring", href: "/documents/expiring", icon: AlertTriangle },
    ...(isAdmin
      ? [
          { label: "Team", href: "/settings/team", icon: UserPlus },
          { label: "Doc Types", href: "/settings/document-types", icon: FileStack },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <div className="ml-2 md:ml-0">
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-8">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {currentUser?.email && (
            <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[200px]">
              {currentUser.email}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
