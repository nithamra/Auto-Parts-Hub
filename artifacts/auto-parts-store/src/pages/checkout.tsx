import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useGetCart, useCreateOrder, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, CreditCard, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone is required"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(5, "ZIP is required"),
  cardNumber: z.string().min(16, "Valid card number required"),
  expDate: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "MM/YY format required"),
  cvv: z.string().min(3, "CVV required"),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const { data: cart, isLoading } = useGetCart({
    query: { queryKey: getGetCartQueryKey() }
  });

  const createOrder = useCreateOrder();

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      cardNumber: "",
      expDate: "",
      cvv: "",
    }
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-24 text-center">Loading checkout...</div>;
  }

  if (!cart || cart.items.length === 0) {
    if (!isSuccess) {
      setLocation("/cart");
      return null;
    }
  }

  const shipping = cart ? (cart.subtotal > 150 ? 0 : 15.99) : 0;
  const tax = cart ? cart.subtotal * 0.08 : 0;
  const total = cart ? cart.subtotal + shipping + tax : 0;

  const onSubmit = (data: CheckoutValues) => {
    // Mock processing delay
    setTimeout(() => {
      createOrder.mutate({
        data: {
          customerName: `${data.firstName} ${data.lastName}`,
          customerEmail: data.email,
          shippingAddress: {
            street: data.street,
            city: data.city,
            state: data.state,
            zip: data.zip
          },
          paymentMethod: `Credit Card ending in ${data.cardNumber.slice(-4)}`
        }
      }, {
        onSuccess: (order) => {
          setIsSuccess(true);
          setOrderId(order.id);
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          window.scrollTo(0, 0);
        },
        onError: () => {
          toast({
            title: "Checkout failed",
            description: "There was an error processing your payment. Please try again.",
          });
        }
      });
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-4xl font-display font-bold uppercase tracking-wider mb-4">Order Confirmed</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Thank you for your business. Your American muscle is about to get an upgrade.
        </p>
        
        <div className="bg-card border border-border rounded-sm p-6 mb-8 text-left">
          <h3 className="font-display font-bold uppercase mb-2">Order Summary</h3>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-mono font-medium">#{orderId?.toString().padStart(6, '0') || '10485'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Status</span>
            <span className="text-emerald-500 font-medium uppercase text-xs tracking-wider">Processing</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="font-mono font-bold">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/orders/${orderId}`}>
            <Button size="lg" className="w-full sm:w-auto">View Order Details</Button>
          </Link>
          <Link href="/catalog">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/cart" className="inline-flex items-center text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
      </Link>
      
      <div className="grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8">
          <h1 className="text-3xl font-display font-bold uppercase tracking-wider mb-8">Checkout</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id="checkout-form">
              {/* Contact Info */}
              <div className="bg-card border border-border p-6 rounded-sm">
                <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-4 border-b pb-2">Contact Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl><Input type="tel" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-card border border-border p-6 rounded-sm">
                <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-4 border-b pb-2">Shipping Address</h2>
                <div className="grid sm:grid-cols-6 gap-4">
                  <FormField control={form.control} name="street" render={({ field }) => (
                    <FormItem className="sm:col-span-6">
                      <FormLabel>Street Address</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>City</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel>State</FormLabel>
                      <FormControl><Input {...field} maxLength={2} placeholder="TX" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="zip" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Payment */}
              <div className="bg-card border border-border p-6 rounded-sm">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-xl font-display font-bold uppercase tracking-wider">Payment Details</h2>
                  <div className="flex gap-2 text-muted-foreground">
                    <CreditCard className="w-6 h-6" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-4 gap-4">
                  <FormField control={form.control} name="cardNumber" render={({ field }) => (
                    <FormItem className="sm:col-span-4">
                      <FormLabel>Card Number</FormLabel>
                      <FormControl><Input placeholder="0000 0000 0000 0000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="expDate" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Exp Date (MM/YY)</FormLabel>
                      <FormControl><Input placeholder="MM/YY" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cvv" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>CVV</FormLabel>
                      <FormControl><Input placeholder="123" maxLength={4} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            </form>
          </Form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-zinc-900 border border-border p-6 rounded-sm sticky top-24 text-zinc-100">
            <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-6 text-white">In Your Cart</h2>
            
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
              {cart?.items.map(item => (
                <div key={item.productId} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 bg-white rounded-sm p-1 shrink-0">
                    <img src={item.imageUrl} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold truncate leading-tight text-white">{item.name}</p>
                    <p className="text-zinc-400">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-mono font-medium shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="bg-zinc-800 my-4" />
            
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Subtotal</span>
                <span className="font-mono">${cart?.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Shipping</span>
                <span className="font-mono">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Tax</span>
                <span className="font-mono">${tax.toFixed(2)}</span>
              </div>
            </div>
            
            <Separator className="bg-zinc-800 my-4" />
            
            <div className="flex justify-between items-end mb-8">
              <span className="font-display font-bold uppercase tracking-wider text-white">Total</span>
              <span className="text-3xl font-mono font-bold text-primary">${total.toFixed(2)}</span>
            </div>
            
            <Button 
              type="submit" 
              form="checkout-form"
              size="lg" 
              className="w-full h-14 text-lg border-2 border-primary"
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? "Processing..." : "Place Order"}
            </Button>
            
            <div className="mt-4 flex items-center justify-center text-xs text-zinc-500 gap-2">
              <ShieldCheck className="w-4 h-4" />
              256-bit secure encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
