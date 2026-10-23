import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type NotFoundPageProps = {
  homeTo?: string;
  homeLabel?: string;
};

export function NotFoundPage({ homeTo = "/", homeLabel = "Back to Home" }: NotFoundPageProps) {
  return (
    <div className="p-4 md:p-6">
      <section className="space-y-4 rounded-lg border bg-card p-6 text-card-foreground">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you are looking for may have moved or no longer exists.
        </p>
        <Button asChild className="w-full sm:w-auto">
          <Link to={homeTo}>{homeLabel}</Link>
        </Button>
      </section>
    </div>
  );
}
