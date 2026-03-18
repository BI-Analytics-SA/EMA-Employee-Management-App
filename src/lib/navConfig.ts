import {
  Home,
  Users,
  AlertTriangle,
  UserPlus,
  User,
  FileStack,
  Layers,
  Database,
  FileText,
  FileDown,
  BarChart3,
  Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If set, this nav item is only shown when the given module is enabled */
  requiredModule?: "contracts" | "documents" | "exporting" | "jobs";
}

export const mainNavItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Employee Report", href: "/reports/employees", icon: BarChart3 },
  { label: "Expiring Documents", href: "/documents/expiring", icon: AlertTriangle, requiredModule: "documents" },
  { label: "Jobs", href: "/jobs", icon: Briefcase, requiredModule: "jobs" },
];

export const settingsNavItems: NavItem[] = [
  { label: "Profile", href: "/settings/profile", icon: User },
  { label: "Team", href: "/settings/team", icon: UserPlus },
  { label: "Doc Types", href: "/settings/document-types", icon: FileStack, requiredModule: "documents" },
  { label: "Data Management", href: "/settings/data-management", icon: Database },
  { label: "Modules", href: "/settings/modules", icon: Layers },
  { label: "Contract Template", href: "/settings/contract-template", icon: FileText, requiredModule: "contracts" },
  { label: "Export Config", href: "/settings/export-config", icon: FileDown, requiredModule: "exporting" },
];
