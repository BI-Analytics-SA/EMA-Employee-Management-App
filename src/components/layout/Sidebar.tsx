import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { mainNavItems, settingsNavItems } from "@/lib/navConfig";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";
import { useModuleEnabled } from "@/hooks/useModuleEnabled";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavClick?: () => void;
  /** Hide the collapse toggle (used inside mobile sheet) */
  hideToggle?: boolean;
}

export function Sidebar({ collapsed = false, onToggleCollapse, onNavClick, hideToggle }: SidebarProps) {
  const { isAdmin } = useCurrentUser();
  const contractsEnabled = useModuleEnabled("contracts");
  const medicalEnabled = useModuleEnabled("medical");
  const documentsEnabled = useModuleEnabled("documents");
  const exportingEnabled = useModuleEnabled("exporting");

  const enabledModules: Record<string, boolean> = {
    contracts: contractsEnabled,
    medical: medicalEnabled,
    documents: documentsEnabled,
    exporting: exportingEnabled,
  };

  const filterByModule = (items: typeof mainNavItems) =>
    items.filter((item) => !item.requiredModule || enabledModules[item.requiredModule]);

  const filteredMainNavItems = filterByModule(mainNavItems);
  const filteredSettingsNavItems = filterByModule(settingsNavItems);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo area */}
      <div className={cn(
        "flex h-16 items-center border-b border-white/10",
        collapsed ? "justify-center px-2" : "gap-3 px-3"
      )}>
        {collapsed ? (
          /* When collapsed: show expand button centered */
          !hideToggle && onToggleCollapse ? (
            <button
              onClick={onToggleCollapse}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-white/10 hover:text-white transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          ) : (
            <img src={logoImg} alt="Pepl" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
          )
        ) : (
          /* When expanded: logo + text + collapse button */
          <>
            <img src={logoImg} alt="Pepl" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
            <span className="text-lg font-semibold text-white truncate">Empl Management</span>
            {!hideToggle && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-white/10 hover:text-white transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Menu section */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {!collapsed && (
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
            Menu
          </p>
        )}
        <nav className="flex flex-col gap-1">
          {filteredMainNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              onClick={onNavClick}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-sidebar-accent/15 text-sidebar-accent"
                    : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Settings section (admin only) */}
        {isAdmin && (
          <>
            {!collapsed && (
              <p className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                Settings
              </p>
            )}
            {collapsed && <div className="my-3 mx-2 border-t border-white/10" />}
            <nav className="flex flex-col gap-1">
              {filteredSettingsNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onNavClick}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      isActive
                        ? "bg-sidebar-accent/15 text-sidebar-accent"
                        : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </nav>
          </>
        )}
      </div>

    
    </div>
  );
}
