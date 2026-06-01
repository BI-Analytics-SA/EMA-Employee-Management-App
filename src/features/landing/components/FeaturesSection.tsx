import {
  Users,
  FileSignature,
  FolderOpen,
  Briefcase,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Employee Management",
    description:
      "Maintain a central employee registry with profiles, ID photos, banking details, and bulk import capabilities.",
  },
  {
    icon: FileSignature,
    title: "Contracts",
    description:
      "Create digital contracts from customisable templates, capture signatures, and generate professional PDFs.",
  },
  {
    icon: FolderOpen,
    title: "Document Management",
    description:
      "Upload, organise, and track employee documents with automatic expiry alerts so nothing slips through the cracks.",
  },
  {
    icon: Briefcase,
    title: "Jobs & Work Orders",
    description:
      "Create and manage job assignments, attach documents, and keep track of work order progress.",
  },
  {
    icon: BarChart3,
    title: "Reporting & Exports",
    description:
      "Build custom reports with a flexible column picker, export to Excel, and configure additional fields for a full workforce data export.",
  },
  {
    icon: ShieldCheck,
    title: "Team & Roles",
    description:
      "Run multi-tenant organisations with invite-based onboarding and Admin, Manager, and User role levels.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Everything You Need to Manage Your Workforce
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground sm:text-lg">
            Pepl brings all your employee management needs into one powerful,
            easy-to-use platform.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border bg-card transition-shadow hover:shadow-card"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent transition-colors group-hover:bg-accent/25">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
