import * as React from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right";
}

export function Sheet({ open, onOpenChange, children, side = "left" }: SheetProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const t = requestAnimationFrame(() => setMounted(true));
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onOpenChange(false);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        cancelAnimationFrame(t);
        window.removeEventListener("keydown", onKeyDown);
      };
    } else {
      document.body.style.overflow = "";
      setMounted(false);
    }
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed top-0 bottom-0 z-50 w-72 max-w-[85vw] bg-background shadow-lg transition-transform duration-200 ease-out",
          side === "left" ? "left-0" : "right-0",
          side === "left" ? (mounted ? "translate-x-0" : "-translate-x-full") : (mounted ? "translate-x-0" : "translate-x-full")
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {children}
      </div>
    </>
  );
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SheetContent({ className, ...props }: SheetContentProps) {
  return (
    <div
      className={cn("flex flex-col gap-1 p-4 pt-6", className)}
      {...props}
    />
  );
}
