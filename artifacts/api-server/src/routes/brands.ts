import { Router } from "express";
import { db } from "@workspace/db";
import { brandsTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /brands
router.get("/brands", async (req, res) => {
  try {
    const brands = await db.select().from(brandsTable).orderBy(brandsTable.name);

    const counts = await db
      .select({ brandId: productsTable.brandId, count: sql<number>`count(*)` })
      .from(productsTable)
      .groupBy(productsTable.brandId);

    const countMap: Record<number, number> = {};
    for (const c of counts) countMap[c.brandId] = Number(c.count);

    res.json(brands.map((b) => ({ ...b, productCount: countMap[b.id] || 0 })));
  } catch (err) {
    req.log.error({ err }, "Error listing brands");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /brands
router.post("/brands", async (req, res) => {
  try {
    const [brand] = await db.insert(brandsTable).values(req.body).returning();
    res.status(201).json({ ...brand, productCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Error creating brand");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
