import { UserPlus, Building2, ClipboardList } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "1",
    title: "Sign Up",
    description: "Create your account in seconds — no credit card required.",
  },
  {
    icon: Building2,
    number: "2",
    title: "Set Up Your Organisation",
    description:
      "Add your company details and invite your team members with role-based access.",
  },
  {
    icon: ClipboardList,
    number: "3",
    title: "Manage Your Employees",
    description:
      "Start adding employees, creating contracts, uploading documents, and running reports.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Up and Running in Minutes
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground sm:text-lg">
            Getting started with Pepl is quick and straightforward.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={step.title} className="relative text-center">
              {/* Connector line (hidden on mobile, shown on sm+) */}
              {idx < steps.length - 1 && (
                <div className="pointer-events-none absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-border sm:block" />
              )}

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <step.icon className="h-7 w-7" />
              </div>

              <div className="mt-1 text-xs font-bold text-accent">
                STEP {step.number}
              </div>

              <h3 className="mt-2 text-lg font-semibold text-foreground">
                {step.title}
              </h3>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
