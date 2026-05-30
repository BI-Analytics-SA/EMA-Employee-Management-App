import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import logoImg from "@/assets/logo.png";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function FooterSection() {
  const year = new Date().getFullYear();

  return (
    <>
      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[hsl(220_70%_22%)] py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[hsl(220_70%_28%)] via-[hsl(220_70%_22%)] to-[hsl(220_70%_14%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,hsl(200_80%_55%/0.12),transparent)]" />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to Simplify Employee Management?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-white/70 sm:text-lg">
            Start your 14-day free trial with full access to every feature — no
            credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              asChild
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
            >
              <Link to="/login?flow=signup">
                Start Your Free Trial
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
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <img
                src={logoImg}
                alt="Pepl"
                className="h-8 w-8 shrink-0 rounded-lg object-contain"
              />
              <span className="text-lg font-bold text-foreground">Pepl</span>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <button
                onClick={() => scrollToSection("features")}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </button>
              <Link
                to="/login"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Log In
              </Link>
              <Link
                to="/login?flow=signup"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign Up
              </Link>
            </nav>
          </div>

          <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
            &copy; {year} Pepl. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
