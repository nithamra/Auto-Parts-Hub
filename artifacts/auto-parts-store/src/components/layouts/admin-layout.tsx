import { Link, useLocation } from "wouter";
import { ShieldAlert, LayoutDashboard, Package, ShoppingCart, Users, LogOut, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  ];

  const activeLabel = navItems.find(i => i.href === location)?.label
    || (location.startsWith("/admin/") ? "Admin" : "Admin");

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border/40 bg-card flex-shrink-0">
        <div className="p-4 border-b border-border/40 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-6 w-6" />
            <span className="font-display font-bold text-xl tracking-wider">
              ADMIN <span className="text-foreground">PANEL</span>
            </span>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Store
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border/40 bg-card flex items-center justify-between px-6">
          <h1 className="font-display font-bold text-xl tracking-wider">{activeLabel}</h1>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
