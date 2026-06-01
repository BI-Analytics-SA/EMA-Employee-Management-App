import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";
import { ArrowLeft, LogOut } from "lucide-react";

export function PlatformShell() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logoImg}
              alt="Pepl"
              className="h-8 w-8 shrink-0 rounded-lg object-contain"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                Platform administration
              </p>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Organisation & billing management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to app
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="hidden sm:inline-flex"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
