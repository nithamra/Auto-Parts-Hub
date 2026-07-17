import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="space-y-6 max-w-md">
        <h1 className="text-8xl font-display font-bold text-primary">404</h1>
        <h2 className="text-2xl font-display font-semibold uppercase tracking-widest text-foreground">
          Part Not Found
        </h2>
        <p className="text-muted-foreground text-lg">
          We couldn't find what you're looking for. It might have been discontinued or the URL is incorrect.
        </p>
        <Link href="/">
          <Button size="lg" className="w-full sm:w-auto mt-4">
            Return to Store
          </Button>
        </Link>
      </div>
    </div>
  );
}
