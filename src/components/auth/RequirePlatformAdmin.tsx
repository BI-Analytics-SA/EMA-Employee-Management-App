import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";

type RequirePlatformAdminProps = {
  children: React.ReactNode;
};

export function RequirePlatformAdmin({ children }: RequirePlatformAdminProps) {
  const { isPlatformAdmin, isLoading } = usePlatformAdmin();

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

  if (!isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
