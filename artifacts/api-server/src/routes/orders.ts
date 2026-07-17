import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, cartsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import type { CartItemData } from "@workspace/db";

const router = Router();

function getSessionId(req: any): string {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/session_id=([^;]+)/);
  if (match) return match[1];
  return "unknown";
}

function formatOrder(order: any) {
  return {
    ...order,
    subtotal: parseFloat(order.subtotal),
    shipping: parseFloat(order.shipping),
    tax: parseFloat(order.tax),
    total: parseFloat(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

// GET /orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    res.json(orders.map(formatOrder));
  } catch (err) {
    req.log.error({ err }, "Error listing orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /orders
router.post("/orders", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { customerName, customerEmail, shippingAddress, paymentMethod } = req.body;

    // Get cart
    const cartRows = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId)).limit(1);
    const cartItems = cartRows.length > 0 ? (cartRows[0].items as CartItemData[]) : [];

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    const orderNumber = `AAP-${Date.now().toString().slice(-8).toUpperCase()}`;

    const [order] = await db.insert(ordersTable).values({
      orderNumber,
      customerName,
      customerEmail,
      items: cartItems.map((i) => ({
        productId: i.productId,
        name: i.name,
        imageUrl: i.imageUrl,
        price: i.price,
        quantity: i.quantity,
        sku: i.sku,
      })),
      subtotal: String(Math.round(subtotal * 100) / 100),
      shipping: String(shipping),
      tax: String(tax),
      total: String(total),
      status: "pending",
      shippingAddress,
      paymentMethod,
    }).returning();

    // Clear cart
    if (cartRows.length > 0) {
      await db.update(cartsTable).set({ items: [], updatedAt: new Date() }).where(eq(cartsTable.sessionId, sessionId));
    }

    res.status(201).json(formatOrder(order));
  } catch (err) {
    req.log.error({ err }, "Error creating order");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /orders/:id
router.get("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(formatOrder(order));
  } catch (err) {
    req.log.error({ err }, "Error fetching order");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /orders/:id
router.patch("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const [updated] = await db.update(ordersTable).set({ status, updatedAt: new Date() }).where(eq(ordersTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Order not found" });
    res.json(formatOrder(updated));
  } catch (err) {
    req.log.error({ err }, "Error updating order");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
