import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotFoundPage } from "./NotFoundPage";

export function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-6">
      <section className="mx-auto max-w-xl space-y-4 rounded-lg border bg-card p-6 text-card-foreground">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          We couldn’t load this page. Please try again or return to Home.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/">Back to Home</Link>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
        {import.meta.env.DEV && (
          <details className="text-sm">
            <summary className="cursor-pointer">Error details</summary>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-3">
              {error instanceof Error ? error.stack ?? error.message : String(error)}
            </pre>
          </details>
        )}
      </section>
    </div>
  );
}
