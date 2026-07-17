import { useGetCart, useUpdateCartItem, useRemoveCartItem, getGetCartQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const queryClient = useQueryClient();
  const { data: cart, isLoading } = useGetCart({
    query: { queryKey: getGetCartQueryKey() }
  });
  
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    updateItem.mutate({
      productId,
      data: { quantity }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
    });
  };

  const handleRemove = (productId: number) => {
    removeItem.mutate({ productId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider mb-8">Shopping Cart</h1>
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-6 pb-6 border-b">
                <Skeleton className="w-24 h-24 rounded-sm shrink-0" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>
            ))}
          </div>
          <div>
            <Skeleton className="h-[300px] w-full rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <div className="bg-muted w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-display font-bold uppercase tracking-wider mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven't added any parts to your cart yet. Time to get wrenching!</p>
        <Link href="/catalog">
          <Button size="lg" className="w-full">
            Return to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const shipping = cart.subtotal > 150 ? 0 : 15.99;
  const tax = cart.subtotal * 0.08; // 8% mock tax
  const total = cart.subtotal + shipping + tax;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-bold uppercase tracking-wider mb-8">Shopping Cart</h1>
      
      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Cart Items */}
        <div className="lg:col-span-8">
          <div className="bg-card border border-border rounded-sm shadow-sm overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b border-border text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>
            
            <ul className="divide-y divide-border">
              <AnimatePresence>
                {cart.items.map((item) => (
                  <motion.li 
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 sm:p-6"
                  >
                    <div className="grid sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-6 flex gap-4">
                        <Link href={`/products/${item.productId}`} className="shrink-0">
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted border border-border/50 rounded-sm overflow-hidden p-2">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                            />
                          </div>
                        </Link>
                        <div className="flex flex-col justify-center">
                          <Link href={`/products/${item.productId}`} className="font-display font-bold text-lg hover:text-primary transition-colors leading-tight mb-1">
                            {item.name}
                          </Link>
                          <p className="text-sm font-mono text-muted-foreground mb-2">SKU: {item.sku}</p>
                          <p className="font-mono font-bold text-primary sm:hidden">${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="sm:col-span-3 flex items-center justify-between sm:justify-center mt-4 sm:mt-0">
                        <span className="text-sm font-display text-muted-foreground uppercase sm:hidden">Qty:</span>
                        <div className="flex items-center border border-input rounded-sm bg-background">
                          <button 
                            className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updateItem.isPending}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-mono text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button 
                            className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock || updateItem.isPending}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="hidden sm:block sm:col-span-2 text-right font-mono font-bold text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      
                      <div className="sm:col-span-1 text-right mt-4 sm:mt-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2"
                          onClick={() => handleRemove(item.productId)}
                          disabled={removeItem.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Remove item</span>
                        </Button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-card border border-border p-6 rounded-sm shadow-sm sticky top-24">
            <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({cart.itemCount} items)</span>
                <span className="font-mono font-medium">${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Shipping</span>
                <span className="font-mono font-medium">
                  {shipping === 0 ? <span className="text-emerald-500">Free</span> : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Tax</span>
                <span className="font-mono font-medium">${tax.toFixed(2)}</span>
              </div>
            </div>
            
            <Separator className="mb-4" />
            
            <div className="flex justify-between items-end mb-8">
              <span className="font-display font-bold uppercase tracking-wider">Total</span>
              <span className="text-3xl font-mono font-bold text-primary">${total.toFixed(2)}</span>
            </div>
            
            <Link href="/checkout">
              <Button size="lg" className="w-full h-14 text-lg border-2 border-primary group">
                Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
              Secure checkout. 30-day return policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
