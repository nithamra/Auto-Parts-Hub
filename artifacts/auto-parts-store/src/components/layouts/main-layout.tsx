import { Link } from "wouter";
import { Wrench, ShoppingCart, User, Search, Menu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useLanguage, useT } from "@/lib/language-context";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: cart } = useGetCart({ query: { queryKey: getGetCartQueryKey() } });
  const { toggleLang } = useLanguage();
  const t = useT();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <Wrench className="h-6 w-6" />
              <span className="font-display font-bold text-xl tracking-wider text-foreground">
                AllAmerican <span className="text-primary">Auto</span>
              </span>
            </Link>
            
            <nav className="hidden md:flex gap-6">
              <Link href="/catalog" className="text-sm font-display tracking-wider uppercase font-medium hover:text-primary transition-colors">{t.nav.catalog}</Link>
              <Link href="/vehicle-finder" className="text-sm font-display tracking-wider uppercase font-medium hover:text-primary transition-colors">{t.nav.vehicleFinder}</Link>
              <Link href="/orders" className="text-sm font-display tracking-wider uppercase font-medium hover:text-primary transition-colors">{t.nav.orders}</Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLang}
              className="hidden md:flex items-center gap-1.5 font-display text-xs tracking-wider uppercase font-bold text-muted-foreground hover:text-primary border border-border/60 hover:border-primary/60 px-3 h-8 rounded-sm"
              aria-label="Switch language"
            >
              <Globe className="h-3.5 w-3.5" />
              {t.nav.switchLang}
            </Button>

            <Link href="/catalog" className="md:hidden">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/account">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cart && cart.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-white">
                    {cart.itemCount}
                  </span>
                )}
              </Button>
            </Link>
            {/* Mobile lang toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLang}
              className="md:hidden text-muted-foreground hover:text-primary"
              aria-label="Switch language"
            >
              <Globe className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2 text-primary">
                <Wrench className="h-6 w-6" />
                <span className="font-display font-bold text-xl tracking-wider text-foreground">
                  AllAmerican <span className="text-primary">Auto</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground">
                {t.footer.tagline}
              </p>
            </div>
            
            <div>
              <h4 className="font-display font-bold uppercase tracking-wider mb-4">{t.footer.shop}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/catalog?brand=ford" className="hover:text-primary">{t.footer.fordParts}</Link></li>
                <li><Link href="/catalog?brand=chevrolet" className="hover:text-primary">{t.footer.chevroletParts}</Link></li>
                <li><Link href="/catalog?brand=gmc" className="hover:text-primary">{t.footer.gmcParts}</Link></li>
                <li><Link href="/catalog?brand=jeep" className="hover:text-primary">{t.footer.jeepParts}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold uppercase tracking-wider mb-4">{t.footer.support}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/vehicle-finder" className="hover:text-primary">{t.footer.vehicleFitment}</Link></li>
                <li><Link href="/orders" className="hover:text-primary">{t.footer.trackOrder}</Link></li>
                <li><Link href="/contact" className="hover:text-primary">{t.footer.returnsWarranty}</Link></li>
                <li><Link href="/contact" className="hover:text-primary">{t.footer.contactUs}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold uppercase tracking-wider mb-4">{t.footer.company}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary">{t.footer.aboutUs}</Link></li>
                <li><Link href="/about" className="hover:text-primary">{t.footer.careers}</Link></li>
                <li><Link href="/admin" className="hover:text-primary">{t.footer.adminLogin}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>{t.footer.copyright(new Date().getFullYear())}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
