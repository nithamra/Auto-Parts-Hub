import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Package, Truck, Clock, CheckCircle2, AlertCircle, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetailPage() {
  const [match, params] = useRoute("/orders/:id");
  const orderId = match && params.id ? parseInt(params.id, 10) : null;

  const { data: order, isLoading } = useGetOrder(orderId!, {
    query: { queryKey: getGetOrderQueryKey(orderId!), enabled: !!orderId }
  });

  const getStatusUI = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return { icon: CheckCircle2, text: "Delivered", color: "text-emerald-500", desc: "Your package has been delivered." };
      case 'shipped':
        return { icon: Truck, text: "Shipped", color: "text-blue-500", desc: "Your package is on the way." };
      case 'processing':
        return { icon: Package, text: "Processing", color: "text-primary", desc: "We're picking and packing your order." };
      case 'pending':
        return { icon: Clock, text: "Pending", color: "text-amber-500", desc: "Awaiting payment confirmation." };
      case 'cancelled':
        return { icon: AlertCircle, text: "Cancelled", color: "text-destructive", desc: "This order was cancelled." };
      default:
        return { icon: Package, text: status, color: "text-muted-foreground", desc: "Status unknown." };
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-40 w-full rounded-sm" />
            <Skeleton className="h-64 w-full rounded-sm" />
          </div>
          <Skeleton className="h-96 w-full rounded-sm" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
        <Link href="/orders"><Button>Back to Orders</Button></Link>
      </div>
    );
  }

  const statusUI = getStatusUI(order.status);
  const StatusIcon = statusUI.icon;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/orders" className="inline-flex items-center text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-wider flex items-center gap-3">
            Order <span className="font-mono text-2xl text-muted-foreground">#{order.orderNumber}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}</p>
        </div>
        <Button variant="outline" className="shrink-0"><Receipt className="w-4 h-4 mr-2"/> Invoice</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Status Tracker */}
          <div className="bg-card border border-border p-6 rounded-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-full bg-background border border-border ${statusUI.color}`}>
                <StatusIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold uppercase tracking-wider">{statusUI.text}</h2>
                <p className="text-muted-foreground text-sm">{statusUI.desc}</p>
              </div>
            </div>
            
            {/* Visual Progress Bar - Mock */}
            <div className="mt-8 relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all" 
                style={{ 
                  width: order.status === 'delivered' ? '100%' : 
                         order.status === 'shipped' ? '66%' : 
                         order.status === 'processing' ? '33%' : '0%' 
                }} 
              />
              <div className="relative z-10 flex justify-between">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full border-4 border-background ${order.status !== 'pending' && order.status !== 'cancelled' ? 'bg-primary' : 'bg-muted'}`} />
                  <span className="text-[10px] uppercase font-bold mt-2 text-muted-foreground">Confirmed</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full border-4 border-background ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'bg-primary' : 'bg-muted'}`} />
                  <span className="text-[10px] uppercase font-bold mt-2 text-muted-foreground">Processing</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full border-4 border-background ${['shipped', 'delivered'].includes(order.status) ? 'bg-primary' : 'bg-muted'}`} />
                  <span className="text-[10px] uppercase font-bold mt-2 text-muted-foreground">Shipped</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full border-4 border-background ${order.status === 'delivered' ? 'bg-primary' : 'bg-muted'}`} />
                  <span className="text-[10px] uppercase font-bold mt-2 text-muted-foreground">Delivered</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-card border border-border rounded-sm overflow-hidden">
            <div className="bg-muted/50 p-4 border-b border-border">
              <h3 className="font-display font-bold uppercase tracking-wider">Items Ordered</h3>
            </div>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={item.productId} className="p-4 flex gap-4">
                  <Link href={`/products/${item.productId}`} className="shrink-0">
                    <div className="w-16 h-16 bg-white border border-border rounded-sm p-1">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <Link href={`/products/${item.productId}`} className="font-medium hover:text-primary transition-colors truncate">
                      {item.name}
                    </Link>
                    <p className="text-sm font-mono text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right flex flex-col justify-center">
                    <p className="font-mono font-medium">${item.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-sm">
            <h3 className="font-display font-bold uppercase tracking-wider mb-4 border-b border-border pb-2">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-mono">${order.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono">${order.tax.toFixed(2)}</span>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="font-mono text-primary">${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-sm">
            <h3 className="font-display font-bold uppercase tracking-wider mb-4 border-b border-border pb-2">Shipping Details</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-muted-foreground">{order.shippingAddress.street}</p>
              <p className="text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
            </div>
          </div>
          
          <div className="bg-card border border-border p-6 rounded-sm">
            <h3 className="font-display font-bold uppercase tracking-wider mb-4 border-b border-border pb-2">Payment Info</h3>
            <div className="text-sm">
              <p className="text-muted-foreground">Method: <span className="font-medium text-foreground">{order.paymentMethod}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
