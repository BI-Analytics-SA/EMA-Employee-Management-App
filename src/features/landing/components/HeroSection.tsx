import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[hsl(220_70%_22%)] pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-36">
      {/* Decorative gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[hsl(220_70%_28%)] via-[hsl(220_70%_22%)] to-[hsl(220_70%_14%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(200_80%_55%/0.15),transparent)]" />

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(200 80% 55%) 1px, transparent 1px), linear-gradient(to right, hsl(200 80% 55%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
          Employee Management{" "}
          <span className="text-[hsl(200_80%_65%)]">Made Simple</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base text-white/70 sm:mt-6 sm:text-lg lg:text-xl">
          Streamline your workforce management with a modern platform for
          employee records, contracts, documents, and more — all in one place.
        </p>

        {/* Unlimited users badge */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[hsl(200_80%_55%/0.3)] bg-[hsl(200_80%_55%/0.1)] px-4 py-2 sm:mt-8">
          <Users className="h-4 w-4 text-[hsl(200_80%_65%)]" />
          <span className="text-sm font-medium text-[hsl(200_80%_65%)]">
            Unlimited Users — No per-seat charges, ever
          </span>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
          <Button
            size="lg"
            asChild
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
          >
            <Link to="/login?flow=signup">
              Get Started
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 hover:text-white sm:w-auto"
          >
            <Link to="/login">Log In</Link>
          </Button>
        </div>

        <p className="mt-4 text-sm text-white/50">
          Start managing your team today.
        </p>
      </div>
    </section>
  );
}
