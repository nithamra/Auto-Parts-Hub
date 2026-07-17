import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable,
  productsTable,
  usersTable,
  categoriesTable,
  brandsTable,
  reviewsTable,
} from "@workspace/db";
import { eq, sql, lte, desc } from "drizzle-orm";

const router = Router();

// GET /admin/stats
router.get("/admin/stats", async (req, res) => {
  try {
    const [orderStats] = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(CAST(total AS NUMERIC)), 0)`,
      totalOrders: sql<number>`COUNT(*)`,
    }).from(ordersTable);

    const [pendingCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(ordersTable).where(eq(ordersTable.status, "pending"));
    const [productCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(productsTable);
    const [customerCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(usersTable);
    const [lowStockCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(productsTable).where(lte(productsTable.stock, 5));

    // This month stats (simplified: last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [monthStats] = await db.select({
      revenueThisMonth: sql<number>`COALESCE(SUM(CAST(total AS NUMERIC)), 0)`,
      ordersThisMonth: sql<number>`COUNT(*)`,
    }).from(ordersTable).where(sql`created_at >= ${thirtyDaysAgo.toISOString()}`);

    res.json({
      totalRevenue: Number(orderStats.totalRevenue || 0),
      totalOrders: Number(orderStats.totalOrders || 0),
      totalProducts: Number(productCount.count || 0),
      totalCustomers: Number(customerCount.count || 0),
      pendingOrders: Number(pendingCount.count || 0),
      lowStockCount: Number(lowStockCount.count || 0),
      revenueThisMonth: Number(monthStats.revenueThisMonth || 0),
      ordersThisMonth: Number(monthStats.ordersThisMonth || 0),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/low-stock
router.get("/admin/low-stock", async (req, res) => {
  try {
    const rows = await db
      .select({
        product: productsTable,
        categoryName: categoriesTable.name,
        brandName: brandsTable.name,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
      .where(lte(productsTable.stock, 5))
      .orderBy(productsTable.stock);

    const reviews = await db.select().from(reviewsTable);
    const reviewMap: Record<number, { count: number; sum: number }> = {};
    for (const rv of reviews) {
      if (!reviewMap[rv.productId]) reviewMap[rv.productId] = { count: 0, sum: 0 };
      reviewMap[rv.productId].count++;
      reviewMap[rv.productId].sum += rv.rating;
    }

    res.json(rows.map((r) => {
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
    }));
  } catch (err) {
    req.log.error({ err }, "Error fetching low stock");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/sales-by-category
router.get("/admin/sales-by-category", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable);
    const categories = await db.select().from(categoriesTable);
    const products = await db.select().from(productsTable);

    // Map productId → categoryId
    const productCatMap: Record<number, number> = {};
    for (const p of products) productCatMap[p.id] = p.categoryId;

    const catMap: Record<number, string> = {};
    for (const c of categories) catMap[c.id] = c.name;

    // Aggregate sales by category
    const salesByCategory: Record<string, { total: number; count: number }> = {};
    for (const order of orders) {
      const items = order.items as any[];
      for (const item of items) {
        const catId = productCatMap[item.productId];
        const catName = catId ? (catMap[catId] || "Other") : "Other";
        if (!salesByCategory[catName]) salesByCategory[catName] = { total: 0, count: 0 };
        salesByCategory[catName].total += item.price * item.quantity;
        salesByCategory[catName].count += 1;
      }
    }

    const totalSales = Object.values(salesByCategory).reduce((s, v) => s + v.total, 0);
    const result = Object.entries(salesByCategory).map(([categoryName, data]) => ({
      categoryName,
      totalSales: Math.round(data.total * 100) / 100,
      orderCount: data.count,
      percentage: totalSales > 0 ? Math.round((data.total / totalSales) * 10000) / 100 : 0,
    })).sort((a, b) => b.totalSales - a.totalSales);

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error fetching sales by category");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/recent-orders
router.get("/admin/recent-orders", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10);
    res.json(orders.map((o) => ({
      ...o,
      subtotal: parseFloat(o.subtotal),
      shipping: parseFloat(o.shipping),
      tax: parseFloat(o.tax),
      total: parseFloat(o.total),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Error fetching recent orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/users
router.get("/admin/users", async (req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json(users.map((u) => {
      const { passwordHash: _, ...rest } = u;
      return { ...rest, createdAt: u.createdAt.toISOString() };
    }));
  } catch (err) {
    req.log.error({ err }, "Error fetching users");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
