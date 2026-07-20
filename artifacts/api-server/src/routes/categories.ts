import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { eq, sql, isNull } from "drizzle-orm";

const router = Router();

type CategoryNode = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: number | null;
  sortOrder: number;
  productCount: number;
  children: CategoryNode[];
};

// GET /categories/tree - nested tree structure
router.get("/categories/tree", async (req, res) => {
  try {
    const allCats = await db
      .select()
      .from(categoriesTable)
      .orderBy(categoriesTable.sortOrder, categoriesTable.name);

    // Count products per category (direct assignments only)
    const counts = await db
      .select({ categoryId: productsTable.categoryId, count: sql<number>`count(*)` })
      .from(productsTable)
      .groupBy(productsTable.categoryId);

    const countMap: Record<number, number> = {};
    for (const c of counts) countMap[c.categoryId] = Number(c.count);

    // Build a map for quick lookup
    const nodeMap = new Map<number, CategoryNode>();
    for (const cat of allCats) {
      nodeMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
        imageUrl: cat.imageUrl ?? null,
        parentId: cat.parentId ?? null,
        sortOrder: cat.sortOrder,
        productCount: countMap[cat.id] || 0,
        children: [],
      });
    }

    // Compute cumulative product counts (parent = sum of all descendants)
    // Do a bottom-up pass: first attach children, then sum up counts
    const roots: CategoryNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.parentId === null) {
        roots.push(node);
      } else {
        const parent = nodeMap.get(node.parentId);
        if (parent) parent.children.push(node);
      }
    }

    // Recursively sum productCounts up the tree
    function sumCounts(node: CategoryNode): number {
      let total = node.productCount;
      for (const child of node.children) total += sumCounts(child);
      node.productCount = total;
      return total;
    }
    for (const root of roots) sumCounts(root);

    res.json(roots);
  } catch (err) {
    req.log.error({ err }, "Error building category tree");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await db
      .select()
      .from(categoriesTable)
      .orderBy(categoriesTable.sortOrder, categoriesTable.name);

    // Count products per category
    const counts = await db
      .select({ categoryId: productsTable.categoryId, count: sql<number>`count(*)` })
      .from(productsTable)
      .groupBy(productsTable.categoryId);

    const countMap: Record<number, number> = {};
    for (const c of counts) countMap[c.categoryId] = Number(c.count);

    res.json(
      categories.map((c) => ({
        ...c,
        productCount: countMap[c.id] || 0,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Error listing categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /categories
router.post("/categories", async (req, res) => {
  try {
    const [category] = await db.insert(categoriesTable).values(req.body).returning();
    res.status(201).json({ ...category, productCount: 0, children: [] });
  } catch (err) {
    req.log.error({ err }, "Error creating category");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
