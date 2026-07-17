import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);

    // Count products per category
    const counts = await db
      .select({ categoryId: productsTable.categoryId, count: sql<number>`count(*)` })
      .from(productsTable)
      .groupBy(productsTable.categoryId);

    const countMap: Record<number, number> = {};
    for (const c of counts) countMap[c.categoryId] = Number(c.count);

    res.json(categories.map((c) => ({ ...c, productCount: countMap[c.id] || 0 })));
  } catch (err) {
    req.log.error({ err }, "Error listing categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /categories
router.post("/categories", async (req, res) => {
  try {
    const [category] = await db.insert(categoriesTable).values(req.body).returning();
    res.status(201).json({ ...category, productCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Error creating category");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
