import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/language-context";

export default function NotFound() {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="space-y-6 max-w-md">
        <h1 className="text-8xl font-display font-bold text-primary">404</h1>
        <h2 className="text-2xl font-display font-semibold uppercase tracking-widest text-foreground">
          {t.notFound.title}
        </h2>
        <p className="text-muted-foreground text-lg">
          {t.notFound.desc}
        </p>
        <Link href="/">
          <Button size="lg" className="w-full sm:w-auto mt-4">
            {t.notFound.returnToStore}
          </Button>
        </Link>
      </div>
    </div>
  );
}
