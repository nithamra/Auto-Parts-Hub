import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/lib/language-context';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

// Layouts
import { MainLayout } from '@/components/layouts/main-layout';
import { AdminLayout } from '@/components/layouts/admin-layout';

// Pages
import HomePage from '@/pages/home';
import CatalogPage from '@/pages/catalog';
import ProductDetailPage from '@/pages/product-detail';
import VehicleFinderPage from '@/pages/vehicle-finder';
import CartPage from '@/pages/cart';
import CheckoutPage from '@/pages/checkout';
import OrdersPage from '@/pages/orders';
import OrderDetailPage from '@/pages/order-detail';
import WishlistPage from '@/pages/wishlist';
import AccountPage from '@/pages/account';

// Admin Pages
import AdminDashboard from '@/pages/admin/dashboard';
import AdminProducts from '@/pages/admin/products';
import AdminOrders from '@/pages/admin/orders';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: 'white', padding: 32, fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ef4444' }}>App Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, opacity: 0.7 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/admin/products">
        <AdminLayout><AdminProducts /></AdminLayout>
      </Route>
      <Route path="/admin/orders">
        <AdminLayout><AdminOrders /></AdminLayout>
      </Route>
      <Route path="/admin">
        <AdminLayout><AdminDashboard /></AdminLayout>
      </Route>

      {/* Storefront routes */}
      <Route path="/catalog">
        <MainLayout><CatalogPage /></MainLayout>
      </Route>
      <Route path="/products/:id">
        <MainLayout><ProductDetailPage /></MainLayout>
      </Route>
      <Route path="/vehicle-finder">
        <MainLayout><VehicleFinderPage /></MainLayout>
      </Route>
      <Route path="/cart">
        <MainLayout><CartPage /></MainLayout>
      </Route>
      <Route path="/checkout">
        <MainLayout><CheckoutPage /></MainLayout>
      </Route>
      <Route path="/orders/:id">
        <MainLayout><OrderDetailPage /></MainLayout>
      </Route>
      <Route path="/orders">
        <MainLayout><OrdersPage /></MainLayout>
      </Route>
      <Route path="/wishlist">
        <MainLayout><WishlistPage /></MainLayout>
      </Route>
      <Route path="/account">
        <MainLayout><AccountPage /></MainLayout>
      </Route>
      <Route path="/">
        <MainLayout><HomePage /></MainLayout>
      </Route>

      {/* 404 */}
      <Route>
        <MainLayout><NotFound /></MainLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="app-theme">
        <LanguageProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <div className="noise-overlay" />
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <Router />
              </WouterRouter>
              <Toaster />
            </ErrorBoundary>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
