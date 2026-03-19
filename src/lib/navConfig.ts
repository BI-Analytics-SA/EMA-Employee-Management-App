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
  /** If set, this nav item is shown when ANY of these modules is enabled */
  requiredModuleAny?: ("contracts" | "documents" | "exporting" | "jobs")[];
}

export const mainNavItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Employee Report", href: "/reports/employees", icon: BarChart3 },
  { label: "Expiring Items", href: "/expiring-items", icon: AlertTriangle, requiredModuleAny: ["documents", "jobs"] },
  { label: "Jobs", href: "/jobs", icon: Briefcase, requiredModule: "jobs" },
];

export const settingsNavItems: NavItem[] = [
  { label: "Profile", href: "/settings/profile", icon: User },
  { label: "Team", href: "/settings/team", icon: UserPlus },
  { label: "Doc Types", href: "/settings/document-types", icon: FileStack, requiredModule: "documents" },
  { label: "Job Doc Types", href: "/settings/job-document-types", icon: FileStack, requiredModule: "jobs" },
  { label: "Data Management", href: "/settings/data-management", icon: Database },
  { label: "Modules", href: "/settings/modules", icon: Layers },
  { label: "Contract Template", href: "/settings/contract-template", icon: FileText, requiredModule: "contracts" },
  { label: "Export Config", href: "/settings/export-config", icon: FileDown, requiredModule: "exporting" },
];
