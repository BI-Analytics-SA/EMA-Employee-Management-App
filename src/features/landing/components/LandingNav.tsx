import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { cn } from "@/lib/utils";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Features", id: "features" },
    { label: "Pricing", id: "pricing" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5"
        >
          <img
            src={logoImg}
            alt="Pepl"
            className="h-9 w-9 shrink-0 rounded-lg object-contain"
          />
          <span
            className={cn(
              "text-xl font-bold transition-colors",
              scrolled ? "text-foreground" : "text-white"
            )}
          >
            Pepl
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className={cn(
                "text-sm font-medium transition-colors hover:text-accent",
                scrolled ? "text-muted-foreground" : "text-white/80 hover:text-white"
              )}
            >
              {link.label}
            </button>
          ))}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                scrolled
                  ? ""
                  : "text-white hover:bg-white/10 hover:text-white"
              )}
            >
              <Link to="/login">Log In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/login?flow=signup">Get Started</Link>
            </Button>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className={cn(
            "md:hidden rounded-lg p-2 transition-colors",
            scrolled
              ? "text-foreground hover:bg-muted"
              : "text-white hover:bg-white/10"
          )}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-b bg-background px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  scrollToSection(link.id);
                  setMobileOpen(false);
                }}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground text-left"
              >
                {link.label}
              </button>
            ))}
            <hr className="border-border" />
            <div className="flex flex-col gap-2">
              <Button variant="ghost" size="sm" asChild className="justify-start">
                <Link to="/login">Log In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/login?flow=signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
