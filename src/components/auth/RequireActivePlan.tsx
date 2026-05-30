import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanStatus } from "@/hooks/useModuleEnabled";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import logoImg from "@/assets/logo.png";

const SUPPORT_EMAIL = "brandon@bi-analytics.co.za";

type RequireActivePlanProps = {
  children: React.ReactNode;
};

export function RequireActivePlan({ children }: RequireActivePlanProps) {
  const { isLoading, isLocked } = usePlanStatus();
  const { hasNoOrganizations, organizationId } = useCurrentUser();
  const { signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // No active org yet (e.g. add org flow) — don't apply plan lockout
  if (hasNoOrganizations || !organizationId) {
    return <>{children}</>;
  }

  if (isLocked) {
    return (
      <div className="relative min-h-screen bg-[hsl(220_70%_22%)] flex items-center justify-center p-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[hsl(220_70%_28%)] via-[hsl(220_70%_22%)] to-[hsl(220_70%_14%)]" />
        <div className="relative w-full max-w-md text-center">
          <img
            src={logoImg}
            alt="Pepl"
            className="mx-auto mb-6 h-14 w-14 rounded-xl object-contain"
          />
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Your trial has ended
          </h1>
          <p className="mt-4 text-base text-white/70">
            Thank you for trying Pepl. To continue managing your employees,
            please contact us to choose a plan:
          </p>
          <p className="mt-3 text-lg font-medium text-[hsl(200_80%_65%)]">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Pepl%20upgrade`}
              className="underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
          <div className="mt-8">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={() => signOut()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
