import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/lib/language-context";
import { formatPrice } from "@/lib/format-price";

const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_COST = 35;
const TAX_RATE = 0.15; // Saudi VAT 15%

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "sb";

const contactSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName:  z.string().min(2, "Last name is required"),
  email:     z.string().email("Valid email is required"),
  phone:     z.string().min(10, "Valid phone is required"),
  street:    z.string().min(5, "Street address is required"),
  city:      z.string().min(2, "City is required"),
  state:     z.string().min(2, "State / Region is required"),
  zip:       z.string().min(4, "ZIP / Postal code is required"),
});

type ContactValues = z.infer<typeof contactSchema>;

export default function CheckoutPage() {
  const t = useT();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ orderId: number; orderNumber: string; total: number } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [formReady, setFormReady] = useState(false);

  const { data: cart, isLoading } = useGetCart({ query: { queryKey: getGetCartQueryKey() } });

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "", phone: "",
      street: "", city: "", state: "", zip: "",
    },
  });

  useEffect(() => {
    if (!isLoading && (!cart || cart.items.length === 0) && !isSuccess) {
      setLocation("/cart");
    }
  }, [isLoading, cart, isSuccess]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-24 text-center">{t.checkout.loadingCheckout}</div>;
  }

  if (!isSuccess && (!cart || cart.items.length === 0)) {
    return null;
  }

  const shipping = cart ? (cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST) : 0;
  const tax      = cart ? Math.round(cart.subtotal * TAX_RATE * 100) / 100 : 0;
  const total    = cart ? Math.round((cart.subtotal + shipping + tax) * 100) / 100 : 0;

  // Validate the form before allowing PayPal to proceed
  const validateForm = async (): Promise<ContactValues | null> => {
    const valid = await form.trigger();
    if (!valid) return null;
    return form.getValues();
  };

  // Called when PayPal button is clicked — creates the PayPal order on our server
  const createPayPalOrder = async (): Promise<string> => {
    const values = await validateForm();
    if (!values) throw new Error("Please fill in all required fields above before paying.");

    const res = await fetch(`${BASE_URL}/api/payments/paypal/create-order`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: `${values.firstName} ${values.lastName}`,
        customerEmail: values.email,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to initiate PayPal payment");
    }

    const data = await res.json();
    return data.paypalOrderId;
  };

  // Called after buyer approves payment in PayPal popup
  const onPayPalApprove = async (data: { orderID: string }) => {
    setIsCapturing(true);
    try {
      const values = form.getValues();
      const res = await fetch(`${BASE_URL}/api/payments/paypal/capture-order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paypalOrderId: data.orderID,
          customerName:  `${values.firstName} ${values.lastName}`,
          customerEmail: values.email,
          shippingAddress: {
            street: values.street,
            city:   values.city,
            state:  values.state,
            zip:    values.zip,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Payment capture failed");
      }

      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      setSuccessData({ orderId: result.orderId, orderNumber: result.orderNumber, total: result.total });
      setIsSuccess(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      toast({ title: t.checkout.checkoutFailed, description: err?.message || t.checkout.checkoutFailedDesc });
    } finally {
      setIsCapturing(false);
    }
  };

  const onPayPalError = (err: any) => {
    console.error("PayPal error:", err);
    toast({ title: t.checkout.checkoutFailed, description: "PayPal encountered an error. Please try again." });
  };

  // ── Success Screen ──────────────────────────────────────────────────────────

  if (isSuccess && successData) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-2xl text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-4xl font-display font-bold uppercase tracking-wider mb-4">
          {t.checkout.orderConfirmedTitle}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">{t.checkout.orderConfirmedDesc}</p>

        <div className="bg-card border border-border rounded-sm p-6 mb-8 text-start">
          <h3 className="font-display font-bold uppercase mb-4">{t.checkout.orderSummary}</h3>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">{t.checkout.orderNumber}</span>
            <span className="font-mono font-medium">{successData.orderNumber}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">{t.checkout.status}</span>
            <span className="text-emerald-500 font-medium uppercase text-xs tracking-wider">Processing</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">{t.checkout.totalPaid}</span>
            <span className="font-mono font-bold">{formatPrice(successData.total)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/orders/${successData.orderId}`}>
            <Button size="lg" className="w-full sm:w-auto">{t.checkout.viewOrderDetails}</Button>
          </Link>
          <Link href="/catalog">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">{t.checkout.continueShopping}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Checkout Form ───────────────────────────────────────────────────────────

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: "SAR",
        intent: "capture",
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.checkout.backToCart}
        </Link>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* ── Left: Form ─────────────────────────────────────── */}
          <div className="lg:col-span-8">
            <h1 className="text-3xl font-display font-bold uppercase tracking-wider mb-8">
              {t.checkout.title}
            </h1>

            <Form {...form}>
              <form className="space-y-8">
                {/* Contact Info */}
                <div className="bg-card border border-border p-6 rounded-sm">
                  <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-4 border-b pb-2">
                    {t.checkout.contactInfo}
                  </h2>
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
                  <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-4 border-b pb-2">
                    {t.checkout.shippingAddress}
                  </h2>
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

                {/* PayPal Payment */}
                <div className="bg-card border border-border p-6 rounded-sm">
                  <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-2 border-b pb-2">
                    {t.checkout.paymentDetails}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Fill in your contact and shipping info above, then click the PayPal button to complete your purchase securely.
                  </p>

                  {isCapturing ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">{t.checkout.processing}</p>
                    </div>
                  ) : (
                    <div className="max-w-sm mx-auto">
                      <PayPalButtons
                        style={{
                          layout: "vertical",
                          color: "gold",
                          shape: "rect",
                          label: "pay",
                          height: 48,
                        }}
                        createOrder={createPayPalOrder}
                        onApprove={onPayPalApprove}
                        onError={onPayPalError}
                        onCancel={() =>
                          toast({ title: "Payment cancelled", description: "Your PayPal payment was cancelled." })
                        }
                      />
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </div>

          {/* ── Right: Order Summary ────────────────────────────── */}
          <div className="lg:col-span-4">
            <div className="bg-zinc-900 border border-border p-6 rounded-sm sticky top-24 text-zinc-100">
              <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-6 text-white">
                {t.checkout.inYourCart}
              </h2>

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

              <div className="flex justify-between items-end mb-4">
                <span className="font-display font-bold uppercase tracking-wider text-white">{t.checkout.total}</span>
                <span className="text-3xl font-mono font-bold text-primary">{formatPrice(total)}</span>
              </div>

              <div className="flex items-center justify-center text-xs text-zinc-500 gap-2 mt-4">
                <ShieldCheck className="w-4 h-4" />
                {t.checkout.secureEncryption} · Powered by PayPal
              </div>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
