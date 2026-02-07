import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, Users, AlertTriangle, UserPlus, FileStack, Layers, FileText, FileDown } from "lucide-react";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

export function AppShell() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { isAdmin } = useCurrentUser();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Employees", href: "/employees", icon: Users },
    { label: "Expiring", href: "/documents/expiring", icon: AlertTriangle },
    ...(isAdmin
      ? [
          { label: "Team", href: "/settings/team", icon: UserPlus },
          { label: "Doc Types", href: "/settings/document-types", icon: FileStack },
          { label: "Modules", href: "/settings/modules", icon: Layers },
          { label: "Contract template", href: "/settings/contract-template", icon: FileText },
          { label: "Export config", href: "/settings/export-config", icon: FileDown },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSheetOpen(true)} />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/"}
                onClick={() => setSheetOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      <MobileNav />
    </div>
  );
}
