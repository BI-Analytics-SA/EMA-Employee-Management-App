import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  FileSignature,
  FolderOpen,
  Download,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_PRICE = 250;
const MODULE_PRICE = 200;

const modules = [
  {
    id: "contracts",
    label: "Contracts",
    icon: FileSignature,
    description: "Templates, signatures & PDF generation",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FolderOpen,
    description: "Uploads, expiry tracking & alerts",
  },
  {
    id: "exporting",
    label: "Configurable Export",
    icon: Download,
    description: "Custom fields via Export Config & full workforce Excel export",
  },
  {
    id: "jobs",
    label: "Jobs",
    icon: Briefcase,
    description: "Work orders & job document management",
  },
];

const baseFeatures = [
  "Unlimited users — no per-seat charges",
  "Employee profiles & records",
  "ID photo capture",
  "Bulk employee import",
  "Reports & Excel export",
  "Dashboard & analytics",
  "Team management & invites",
  "Role-based access control",
];

export function PricingSection() {
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set());

  const toggleModule = (id: string) => {
    setEnabledModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = BASE_PRICE + enabledModules.size * MODULE_PRICE;

  return (
    <section id="pricing" className="scroll-mt-20 bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground sm:text-lg">
            Start with the essentials and add modules as you grow. Only pay for
            what you need.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Base plan */}
          <Card className="border-2 border-primary/20 bg-card">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  R{BASE_PRICE}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-foreground">
                Base Plan
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Core employee management for your organisation.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                All prices excl. VAT
              </p>

              <ul className="mt-6 space-y-3">
                {baseFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button size="lg" asChild className="mt-8 w-full">
                <Link to="/login?flow=signup">Sign Up Now</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Add-on modules */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-foreground">
              Add-on Modules
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              R{MODULE_PRICE}/month each — toggle the modules you need.
            </p>

            <div className="mt-4 grid gap-3 flex-1">
              {modules.map((mod) => {
                const active = enabledModules.has(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                      active
                        ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                        : "border-border bg-card hover:border-accent/40 hover:bg-accent/5"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <mod.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">
                        {mod.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {mod.description}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                        active
                          ? "border-accent bg-accent text-white"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {active && <Check className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Running total */}
            <div className="mt-6 rounded-xl border bg-muted/50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Your estimated monthly cost
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">
                    R{total}
                  </span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Base plan (R{BASE_PRICE}) + {enabledModules.size} module
                {enabledModules.size !== 1 ? "s" : ""} (R
                {enabledModules.size * MODULE_PRICE}) · Excl. VAT
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
