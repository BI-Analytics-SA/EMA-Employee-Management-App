import {
  Home,
  Users,
  AlertTriangle,
  UserPlus,
  FileStack,
  Layers,
  FileText,
  FileDown,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If set, this nav item is only shown when the given module is enabled */
  requiredModule?: "contracts" | "medical" | "documents" | "exporting";
}

export const mainNavItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Employee Report", href: "/reports/employees", icon: BarChart3 },
  { label: "Expiring Documents", href: "/documents/expiring", icon: AlertTriangle, requiredModule: "documents" },
];

export const settingsNavItems: NavItem[] = [
  { label: "Team", href: "/settings/team", icon: UserPlus },
  { label: "Doc Types", href: "/settings/document-types", icon: FileStack, requiredModule: "documents" },
  { label: "Modules", href: "/settings/modules", icon: Layers },
  { label: "Contract Template", href: "/settings/contract-template", icon: FileText, requiredModule: "contracts" },
  { label: "Export Config", href: "/settings/export-config", icon: FileDown, requiredModule: "exporting" },
];
