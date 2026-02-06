import { NavLink } from "react-router-dom";
import { Users, Home, UserPlus, FileStack, AlertTriangle, Layers, FileText, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function MobileNav() {
  const { isAdmin } = useCurrentUser();

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
    },
    {
      label: "Employees",
      href: "/employees",
      icon: Users,
    },
    {
      label: "Expiring",
      href: "/documents/expiring",
      icon: AlertTriangle,
    },
    // Only show Team/Invites for admins
    ...(isAdmin
      ? [
          {
            label: "Team",
            href: "/settings/team",
            icon: UserPlus,
          },
          {
            label: "Doc Types",
            href: "/settings/document-types",
            icon: FileStack,
          },
          {
            label: "Modules",
            href: "/settings/modules",
            icon: Layers,
          },
          {
            label: "Contract template",
            href: "/settings/contract-template",
            icon: FileText,
          },
          {
            label: "Export config",
            href: "/settings/export-config",
            icon: FileDown,
          },
        ]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
