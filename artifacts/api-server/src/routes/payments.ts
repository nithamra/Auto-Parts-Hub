/**
 * PayPal Payments Routes
 *
 * Implements PayPal Orders API v2.
 * IPN / Instant Payment Notification is the legacy term; PayPal now uses Webhooks
 * for server-side event delivery — this file implements the modern equivalent.
 *
 * Endpoints:
 *   POST /payments/paypal/create-order  — create a PayPal order, return approval URL
 *   POST /payments/paypal/capture-order — capture payment after buyer approves
 *   POST /payments/paypal/webhook       — PayPal webhook / IPN listener
 *   GET  /admin/transactions            — admin: list all transactions
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, ordersTable, cartsTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import type { CartItemData } from "@workspace/db";

const router = Router();

// ─── PayPal config ─────────────────────────────────────────────────────────

function paypalBase(): string {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

let _tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) return _tokenCache.token;

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${body}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  _tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return _tokenCache.token;
}

function getSessionId(req: any): string {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/session_id=([^;]+)/);
  return match ? match[1] : "unknown";
}

// ─── POST /payments/paypal/create-order ────────────────────────────────────

router.post("/payments/paypal/create-order", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cartRows = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId)).limit(1);
    const cartItems = cartRows.length > 0 ? (cartRows[0].items as CartItemData[]) : [];

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 500 ? 0 : 35;
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    const token = await getAccessToken();

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `AAP-${Date.now()}`,
          description: `AllAmerican Auto Parts — ${cartItems.length} item(s)`,
          amount: {
            currency_code: "SAR",
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: "SAR", value: subtotal.toFixed(2) },
              shipping: { currency_code: "SAR", value: shipping.toFixed(2) },
              tax_total: { currency_code: "SAR", value: tax.toFixed(2) },
            },
          },
          items: cartItems.map((item) => ({
            name: item.name.slice(0, 127),
            unit_amount: { currency_code: "SAR", value: item.price.toFixed(2) },
            quantity: String(item.quantity),
            sku: item.sku || String(item.productId),
          })),
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            brand_name: "AllAmerican Auto Parts",
            locale: "en-SA",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: `${req.protocol}://${req.get("host")}/checkout?paypal=success`,
            cancel_url: `${req.protocol}://${req.get("host")}/checkout?paypal=cancel`,
          },
        },
      },
    };

    const paypalRes = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `create-${Date.now()}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!paypalRes.ok) {
      const body = await paypalRes.text();
      req.log.error({ status: paypalRes.status, body }, "PayPal create-order failed");
      return res.status(502).json({ error: "Failed to create PayPal order", detail: body });
    }

    const paypalOrder = await paypalRes.json() as any;

    // Record pending transaction
    await db.insert(transactionsTable).values({
      paypalOrderId: paypalOrder.id,
      customerEmail: req.body.customerEmail || null,
      customerName: req.body.customerName || null,
      items: cartItems.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      amount: String(total),
      currency: "SAR",
      status: "pending",
      rawPayload: paypalOrder,
    });

    const approveUrl = paypalOrder.links?.find((l: any) => l.rel === "payer-action")?.href
      || paypalOrder.links?.find((l: any) => l.rel === "approve")?.href;

    res.json({ paypalOrderId: paypalOrder.id, approveUrl, total });
  } catch (err) {
    req.log.error({ err }, "Error creating PayPal order");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /payments/paypal/capture-order ───────────────────────────────────

router.post("/payments/paypal/capture-order", async (req, res) => {
  try {
    const { paypalOrderId, customerName, customerEmail, shippingAddress } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({ error: "paypalOrderId is required" });
    }

    const token = await getAccessToken();

    // Capture the payment
    const captureRes = await fetch(`${paypalBase()}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `capture-${paypalOrderId}`,
      },
      body: JSON.stringify({}),
    });

    if (!captureRes.ok) {
      const body = await captureRes.text();
      req.log.error({ status: captureRes.status, body }, "PayPal capture failed");
      await db.update(transactionsTable)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(transactionsTable.paypalOrderId, paypalOrderId));
      return res.status(502).json({ error: "Payment capture failed", detail: body });
    }

    const captureData = await captureRes.json() as any;
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const paypalTransactionId = capture?.id;
    const capturedAmount = parseFloat(capture?.amount?.value || "0");

    // Find our pending transaction
    const [existingTx] = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.paypalOrderId, paypalOrderId))
      .limit(1);

    // Create store order
    const sessionId = getSessionId(req);
    const cartRows = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId)).limit(1);
    const cartItems = cartRows.length > 0 ? (cartRows[0].items as CartItemData[]) : (existingTx?.items as CartItemData[] || []);

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 500 ? 0 : 35;
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const total = capturedAmount || Math.round((subtotal + shipping + tax) * 100) / 100;
    const orderNumber = `AAP-${Date.now().toString().slice(-8).toUpperCase()}`;

    const [order] = await db.insert(ordersTable).values({
      orderNumber,
      customerName: customerName || existingTx?.customerName || "PayPal Customer",
      customerEmail: customerEmail || existingTx?.customerEmail || "",
      items: cartItems.map((i) => ({
        productId: i.productId,
        name: i.name,
        imageUrl: i.imageUrl || "",
        price: i.price,
        quantity: i.quantity,
        sku: i.sku || String(i.productId),
      })),
      subtotal: String(Math.round(subtotal * 100) / 100),
      shipping: String(shipping),
      tax: String(tax),
      total: String(total),
      status: "processing",
      shippingAddress: shippingAddress || { street: "", city: "", state: "", zip: "" },
      paymentMethod: `PayPal (${paypalTransactionId || paypalOrderId})`,
    }).returning();

    // Update transaction record
    await db.update(transactionsTable)
      .set({
        paypalTransactionId,
        orderId: order.id,
        customerName: customerName || existingTx?.customerName || null,
        customerEmail: customerEmail || existingTx?.customerEmail || null,
        amount: String(total),
        status: "completed",
        rawPayload: captureData,
        updatedAt: new Date(),
      })
      .where(eq(transactionsTable.paypalOrderId, paypalOrderId));

    // Clear cart
    if (cartRows.length > 0) {
      await db.update(cartsTable)
        .set({ items: [], updatedAt: new Date() })
        .where(eq(cartsTable.sessionId, sessionId));
    }

    res.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paypalTransactionId,
      total,
    });
  } catch (err) {
    req.log.error({ err }, "Error capturing PayPal order");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /payments/paypal/webhook (IPN listener) ──────────────────────────

router.post("/payments/paypal/webhook", async (req, res) => {
  try {
    // Acknowledge immediately (PayPal requires fast response)
    res.status(200).send("OK");

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const event = req.body;
    const eventType: string = event?.event_type || "";

    req.log.info({ eventType, resourceId: event?.resource?.id }, "PayPal webhook received");

    // Verify webhook signature if webhook ID is configured
    if (webhookId) {
      try {
        const token = await getAccessToken();
        const verifyRes = await fetch(`${paypalBase()}/v1/notifications/verify-webhook-signature`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auth_algo: req.headers["paypal-auth-algo"],
            cert_url: req.headers["paypal-cert-url"],
            transmission_id: req.headers["paypal-transmission-id"],
            transmission_sig: req.headers["paypal-transmission-sig"],
            transmission_time: req.headers["paypal-transmission-time"],
            webhook_id: webhookId,
            webhook_event: event,
          }),
        });
        const verification = await verifyRes.json() as any;
        if (verification.verification_status !== "SUCCESS") {
          req.log.warn({ verification }, "PayPal webhook signature verification failed");
          return;
        }
      } catch (verifyErr) {
        req.log.error({ verifyErr }, "PayPal webhook verification error");
      }
    }

    // Handle relevant events
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const captureId = event.resource?.id;
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;

      if (orderId) {
        await db.update(transactionsTable)
          .set({
            status: "completed",
            paypalTransactionId: captureId,
            webhookVerified: !!webhookId,
            rawPayload: event,
            updatedAt: new Date(),
          })
          .where(eq(transactionsTable.paypalOrderId, orderId));
      }
    } else if (eventType === "PAYMENT.CAPTURE.REVERSED" || eventType === "PAYMENT.CAPTURE.REFUNDED") {
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
      if (orderId) {
        await db.update(transactionsTable)
          .set({ status: "refunded", updatedAt: new Date() })
          .where(eq(transactionsTable.paypalOrderId, orderId));
      }
    }
  } catch (err) {
    // We already sent 200, just log
    (req as any).log?.error({ err }, "PayPal webhook processing error");
  }
});

// ─── GET /admin/transactions ────────────────────────────────────────────────

router.get("/admin/transactions", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const limit = Math.min(100, parseInt(String(req.query.limit || "50")));
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transactionsTable);

    res.json({
      transactions: rows.map((t) => ({
        ...t,
        amount: parseFloat(String(t.amount)),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      total: Number(count) || rows.length,
      page,
      totalPages: Math.ceil((Number(count) || rows.length) / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching transactions");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
