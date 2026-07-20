import { Link, useLocation } from "wouter";
import { ShieldAlert, LayoutDashboard, Package, ShoppingCart, LogOut, ArrowLeft, CreditCard, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT, useLanguage } from "@/lib/language-context";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const t = useT();
  const { toggleLang } = useLanguage();

  const navItems = [
    { href: "/admin",              label: t.admin.nav.dashboard,    icon: LayoutDashboard },
    { href: "/admin/products",     label: t.admin.nav.products,     icon: Package },
    { href: "/admin/orders",       label: t.admin.nav.orders,       icon: ShoppingCart },
    { href: "/admin/transactions", label: t.admin.nav.transactions, icon: CreditCard },
  ];

  const activeLabel = navItems.find(i => i.href === location)?.label ?? t.admin.title;

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className="w-full md:w-64 border-e border-border/40 bg-card flex-shrink-0">
        <div className="p-4 border-b border-border/40 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-6 w-6" />
            <span className="font-display font-bold text-xl tracking-wider">
              {t.admin.title} <span className="text-foreground">{t.admin.panel}</span>
            </span>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t.admin.nav.backToStore}
            </Button>
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 font-display tracking-wider",
                    isActive && "bg-secondary/20 text-secondary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border/40 bg-card flex items-center justify-between px-6">
          <h1 className="font-display font-bold text-xl tracking-wider">{activeLabel}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground font-display tracking-wider"
              onClick={toggleLang}
            >
              <Globe className="h-4 w-4" />
              {t.admin.nav.switchLang}
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
              {t.admin.nav.signOut}
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
