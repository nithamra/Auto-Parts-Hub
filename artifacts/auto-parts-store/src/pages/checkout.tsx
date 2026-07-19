import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useGetCart, useCreateOrder, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, CreditCard, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/language-context";
import { formatPrice } from "@/lib/format-price";

const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 35;
const TAX_RATE = 0.15; // Saudi VAT 15%

const checkoutSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone is required"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(4, "ZIP is required"),
  cardNumber: z.string().min(16, "Valid card number required"),
  expDate: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "MM/YY format required"),
  cvv: z.string().min(3, "CVV required"),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const t = useT();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const { data: cart, isLoading } = useGetCart({ query: { queryKey: getGetCartQueryKey() } });
  const createOrder = useCreateOrder();

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", street: "", city: "", state: "", zip: "", cardNumber: "", expDate: "", cvv: "" }
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-24 text-center">{t.checkout.loadingCheckout}</div>;
  }

  if (!cart || cart.items.length === 0) {
    if (!isSuccess) { setLocation("/cart"); return null; }
  }

  const shipping = cart ? (cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST) : 0;
  const tax = cart ? cart.subtotal * TAX_RATE : 0;
  const total = cart ? cart.subtotal + shipping + tax : 0;

  const onSubmit = (data: CheckoutValues) => {
    setTimeout(() => {
      createOrder.mutate({
        data: {
          customerName: `${data.firstName} ${data.lastName}`,
          customerEmail: data.email,
          shippingAddress: { street: data.street, city: data.city, state: data.state, zip: data.zip },
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
          toast({ title: t.checkout.checkoutFailed, description: t.checkout.checkoutFailedDesc });
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
        <h1 className="text-4xl font-display font-bold uppercase tracking-wider mb-4">{t.checkout.orderConfirmedTitle}</h1>
        <p className="text-lg text-muted-foreground mb-8">{t.checkout.orderConfirmedDesc}</p>
        
        <div className="bg-card border border-border rounded-sm p-6 mb-8 text-start">
          <h3 className="font-display font-bold uppercase mb-2">{t.checkout.orderSummary}</h3>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">{t.checkout.orderNumber}</span>
            <span className="font-mono font-medium">#{orderId?.toString().padStart(6, '0') || '10485'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">{t.checkout.status}</span>
            <span className="text-emerald-500 font-medium uppercase text-xs tracking-wider">Processing</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">{t.checkout.totalPaid}</span>
            <span className="font-mono font-bold">{formatPrice(total)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/orders/${orderId}`}>
            <Button size="lg" className="w-full sm:w-auto">{t.checkout.viewOrderDetails}</Button>
          </Link>
          <Link href="/catalog">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">{t.checkout.continueShopping}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t.checkout.backToCart}
      </Link>
      
      <div className="grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8">
          <h1 className="text-3xl font-display font-bold uppercase tracking-wider mb-8">{t.checkout.title}</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" id="checkout-form">
              {/* Contact Info */}
              <div className="bg-card border border-border p-6 rounded-sm">
                <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-4 border-b pb-2">{t.checkout.contactInfo}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.checkout.firstName}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.checkout.lastName}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t.checkout.emailAddress}</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t.checkout.phoneNumber}</FormLabel>
                      <FormControl><Input type="tel" placeholder="+966 5X XXX XXXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-card border border-border p-6 rounded-sm">
                <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-4 border-b pb-2">{t.checkout.shippingAddress}</h2>
                <div className="grid sm:grid-cols-6 gap-4">
                  <FormField control={form.control} name="street" render={({ field }) => (
                    <FormItem className="sm:col-span-6">
                      <FormLabel>{t.checkout.streetAddress}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>{t.checkout.city}</FormLabel>
                      <FormControl><Input placeholder="Riyadh" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel>{t.checkout.state}</FormLabel>
                      <FormControl><Input placeholder="RUH" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="zip" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t.checkout.zipCode}</FormLabel>
                      <FormControl><Input placeholder="11461" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Payment */}
              <div className="bg-card border border-border p-6 rounded-sm">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-xl font-display font-bold uppercase tracking-wider">{t.checkout.paymentDetails}</h2>
                  <CreditCard className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="grid sm:grid-cols-4 gap-4">
                  <FormField control={form.control} name="cardNumber" render={({ field }) => (
                    <FormItem className="sm:col-span-4">
                      <FormLabel>{t.checkout.cardNumber}</FormLabel>
                      <FormControl><Input placeholder="0000 0000 0000 0000" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="expDate" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t.checkout.expDate}</FormLabel>
                      <FormControl><Input placeholder="MM/YY" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cvv" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>{t.checkout.cvv}</FormLabel>
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
            <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-6 text-white">{t.checkout.inYourCart}</h2>
            
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pe-2">
              {cart?.items.map(item => (
                <div key={item.productId} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 bg-white rounded-sm p-1 shrink-0">
                    <img src={item.imageUrl} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold truncate leading-tight text-white">{item.name}</p>
                    <p className="text-zinc-400">{t.checkout.qty} {item.quantity}</p>
                  </div>
                  <div className="font-mono font-medium shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="bg-zinc-800 my-4" />
            
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">{t.checkout.subtotal}</span>
                <span className="font-mono">{formatPrice(cart?.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{t.checkout.shipping}</span>
                <span className="font-mono">{shipping === 0 ? t.checkout.free : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">{t.checkout.tax} (15% VAT)</span>
                <span className="font-mono">{formatPrice(tax)}</span>
              </div>
            </div>
            
            <Separator className="bg-zinc-800 my-4" />
            
            <div className="flex justify-between items-end mb-8">
              <span className="font-display font-bold uppercase tracking-wider text-white">{t.checkout.total}</span>
              <span className="text-3xl font-mono font-bold text-primary">{formatPrice(total)}</span>
            </div>
            
            <Button 
              type="submit" 
              form="checkout-form"
              size="lg" 
              className="w-full h-14 text-lg border-2 border-primary"
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? t.checkout.processing : t.checkout.placeOrder}
            </Button>
            
            <div className="mt-4 flex items-center justify-center text-xs text-zinc-500 gap-2">
              <ShieldCheck className="w-4 h-4" />
              {t.checkout.secureEncryption}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
