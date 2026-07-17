import { useListOrders } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Package, ChevronRight, AlertCircle, CheckCircle2, Clock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersPage() {
  const { data: orders, isLoading } = useListOrders();

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
      case 'shipped':
        return { icon: Truck, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };
      case 'processing':
        return { icon: Package, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" };
      case 'pending':
        return { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
      case 'cancelled':
        return { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" };
      default:
        return { icon: Package, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider">My Orders</h1>
        <p className="text-muted-foreground mt-2">Track, return, or buy again.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-sm" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border border-dashed border-border rounded-sm">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-2">No Orders Yet</h2>
          <p className="text-muted-foreground mb-6">You haven't placed any orders with us.</p>
          <Link href="/catalog">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={order.id} className="bg-card border border-border rounded-sm overflow-hidden flex flex-col md:flex-row group hover:border-primary/50 transition-colors">
                {/* Order Header / Mobile Info */}
                <div className="p-6 md:w-64 bg-muted/30 border-b md:border-b-0 md:border-r border-border shrink-0">
                  <div className="flex flex-col space-y-4">
                    <div>
                      <p className="text-xs font-display uppercase font-bold text-muted-foreground mb-1">Order Placed</p>
                      <p className="font-medium">{format(new Date(order.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-display uppercase font-bold text-muted-foreground mb-1">Total</p>
                      <p className="font-mono font-bold">${order.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-display uppercase font-bold text-muted-foreground mb-1">Order #</p>
                      <p className="font-mono text-sm">{order.orderNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border ${statusConfig.border} ${statusConfig.bg}`}>
                      <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                      <span className={`text-xs font-display font-bold uppercase tracking-wider ${statusConfig.color}`}>
                        {order.status}
                      </span>
                    </div>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        View Details
                      </Button>
                    </Link>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-2 flex-1">
                    {order.items.slice(0, 4).map((item) => (
                      <div key={item.productId} className="shrink-0 w-20 group-hover:opacity-100 transition-opacity">
                        <div className="w-20 h-20 bg-white border border-border rounded-sm p-1 mb-2">
                          <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{item.name}</p>
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="shrink-0 w-20 h-20 flex flex-col items-center justify-center bg-muted border border-border rounded-sm text-muted-foreground text-xs font-medium">
                        +{order.items.length - 4}
                        <br/>more
                      </div>
                    )}
                  </div>
                  
                  <Link href={`/orders/${order.id}`} className="sm:hidden mt-4 w-full">
                    <Button variant="outline" className="w-full justify-between">
                      View Details <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
