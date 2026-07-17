import { Router } from "express";
import { db } from "@workspace/db";
import { wishlistsTable, productsTable, categoriesTable, brandsTable, reviewsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

function getSessionId(req: any): string {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/session_id=([^;]+)/);
  if (match) return match[1];
  return `anon_${req.ip || "unknown"}`;
}

async function getWishlistProducts(sessionId: string) {
  const wishItems = await db.select().from(wishlistsTable).where(eq(wishlistsTable.sessionId, sessionId));
  if (wishItems.length === 0) return [];

  const productIds = wishItems.map((w) => w.productId);
  const rows = await db
    .select({
      product: productsTable,
      categoryName: categoriesTable.name,
      brandName: brandsTable.name,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id));

  const reviews = await db.select().from(reviewsTable);
  const reviewMap: Record<number, { count: number; sum: number }> = {};
  for (const rv of reviews) {
    if (!reviewMap[rv.productId]) reviewMap[rv.productId] = { count: 0, sum: 0 };
    reviewMap[rv.productId].count++;
    reviewMap[rv.productId].sum += rv.rating;
  }

  return rows
    .filter((r) => productIds.includes(r.product.id))
    .map((r) => {
      const stats = reviewMap[r.product.id] || { count: 0, sum: 0 };
      return {
        ...r.product,
        price: parseFloat(r.product.price),
        compareAtPrice: r.product.compareAtPrice ? parseFloat(r.product.compareAtPrice) : null,
        categoryName: r.categoryName || "",
        brandName: r.brandName || "",
        rating: stats.count > 0 ? Math.round((stats.sum / stats.count) * 10) / 10 : 0,
        reviewCount: stats.count,
      };
    });
}

// GET /wishlist
router.get("/wishlist", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const products = await getWishlistProducts(sessionId);
    res.json(products);
  } catch (err) {
    req.log.error({ err }, "Error fetching wishlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /wishlist/:productId
router.post("/wishlist/:productId", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const productId = parseInt(req.params.productId);
    const exists = await db.select().from(wishlistsTable).where(and(eq(wishlistsTable.sessionId, sessionId), eq(wishlistsTable.productId, productId))).limit(1);
    if (exists.length === 0) {
      await db.insert(wishlistsTable).values({ sessionId, productId });
    }
    res.json(await getWishlistProducts(sessionId));
  } catch (err) {
    req.log.error({ err }, "Error adding to wishlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /wishlist/:productId
router.delete("/wishlist/:productId", async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const productId = parseInt(req.params.productId);
    await db.delete(wishlistsTable).where(and(eq(wishlistsTable.sessionId, sessionId), eq(wishlistsTable.productId, productId)));
    res.json(await getWishlistProducts(sessionId));
  } catch (err) {
    req.log.error({ err }, "Error removing from wishlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
