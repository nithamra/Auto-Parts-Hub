import { Router } from "express";
import { db } from "@workspace/db";
import { cartsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { CartItemData } from "@workspace/db";

const router = Router();

function getSessionId(req: any): string {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/session_id=([^;]+)/);
  if (match) return match[1];
  return `anon_${Math.random().toString(36).slice(2)}`;
}

async function getOrCreateCart(sessionId: string) {
  const existing = await db.select().from(cartsTable).where(eq(cartsTable.sessionId, sessionId)).limit(1);
  if (existing.length > 0) return existing[0];
  const [cart] = await db.insert(cartsTable).values({ sessionId, items: [] }).returning();
  return cart;
}

function calcCart(items: CartItemData[]) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, subtotal: Math.round(subtotal * 100) / 100, itemCount };
}

// GET /cart
router.get("/cart", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await getOrCreateCart(sessionId);
    res.json(calcCart(cart.items as CartItemData[]));
  } catch (err) {
    req.log.error({ err }, "Error fetching cart");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /cart/items
router.post("/cart/items", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await getOrCreateCart(sessionId);
    const { productId, quantity } = req.body;

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId)).limit(1);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const items = [...(cart.items as CartItemData[])];
    const existing = items.findIndex((i) => i.productId === productId);
    if (existing >= 0) {
      items[existing].quantity = Math.min(product.stock, items[existing].quantity + quantity);
    } else {
      items.push({
        productId,
        name: product.name,
        imageUrl: product.imageUrl,
        price: parseFloat(product.price),
        quantity: Math.min(product.stock, quantity),
        sku: product.sku,
        stock: product.stock,
      });
    }

    const [updated] = await db.update(cartsTable).set({ items, updatedAt: new Date() }).where(eq(cartsTable.sessionId, sessionId)).returning();
    res.json(calcCart(updated.items as CartItemData[]));
  } catch (err) {
    req.log.error({ err }, "Error adding to cart");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /cart/items/:productId
router.patch("/cart/items/:productId", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await getOrCreateCart(sessionId);
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;

    const items = (cart.items as CartItemData[]).map((i) =>
      i.productId === productId ? { ...i, quantity: Math.max(0, quantity) } : i
    ).filter((i) => i.quantity > 0);

    const [updated] = await db.update(cartsTable).set({ items, updatedAt: new Date() }).where(eq(cartsTable.sessionId, sessionId)).returning();
    res.json(calcCart(updated.items as CartItemData[]));
  } catch (err) {
    req.log.error({ err }, "Error updating cart item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /cart/items/:productId
router.delete("/cart/items/:productId", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const cart = await getOrCreateCart(sessionId);
    const productId = parseInt(req.params.productId);

    const items = (cart.items as CartItemData[]).filter((i) => i.productId !== productId);
    const [updated] = await db.update(cartsTable).set({ items, updatedAt: new Date() }).where(eq(cartsTable.sessionId, sessionId)).returning();
    res.json(calcCart(updated.items as CartItemData[]));
  } catch (err) {
    req.log.error({ err }, "Error removing cart item");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /cart/clear
router.delete("/cart/clear", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    await getOrCreateCart(sessionId);
    const [updated] = await db.update(cartsTable).set({ items: [], updatedAt: new Date() }).where(eq(cartsTable.sessionId, sessionId)).returning();
    res.json(calcCart([]));
  } catch (err) {
    req.log.error({ err }, "Error clearing cart");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
