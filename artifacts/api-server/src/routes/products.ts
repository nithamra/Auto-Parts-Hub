import { Router } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  categoriesTable,
  brandsTable,
  reviewsTable,
} from "@workspace/db";
import { eq, and, gte, lte, ilike, sql, desc, asc, inArray } from "drizzle-orm";

const router = Router();

// Helper: given a category slug, return an array of all descendant category IDs (inclusive)
async function getCategoryIdsBySlugs(slugOrId: string): Promise<number[]> {
  // Try to find the category by slug
  const root = await db
    .select({ id: categoriesTable.id })
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, slugOrId))
    .limit(1);

  if (root.length === 0) return [];

  // Use recursive CTE to get all descendant IDs
  const result = await db.execute(sql`
    WITH RECURSIVE cat_tree AS (
      SELECT id FROM categories WHERE id = ${root[0].id}
      UNION ALL
      SELECT c.id FROM categories c
      INNER JOIN cat_tree ct ON c.parent_id = ct.id
    )
    SELECT id FROM cat_tree
  `);

  return (result.rows as { id: number }[]).map((r) => r.id);
}

// GET /products
router.get("/products", async (req, res) => {
  try {
    const {
      page = "1",
      limit = "12",
      categoryId,
      categorySlug,
      brandId,
      search,
      minPrice,
      maxPrice,
      inStock,
      sortBy = "newest",
      vehicleMake,
      vehicleModel,
      vehicleYear,
      engine,
      isOem,
      hasWarranty,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
    const offset = (pageNum - 1) * limitNum;

    const conditions: ReturnType<typeof eq>[] = [];

    // Category filtering: categorySlug takes priority, then categoryId
    if (categorySlug) {
      const catIds = await getCategoryIdsBySlugs(categorySlug);
      if (catIds.length > 0) {
        conditions.push(inArray(productsTable.categoryId, catIds) as ReturnType<typeof eq>);
      }
    } else {
      const categoryIdNum = categoryId ? parseInt(categoryId) : NaN;
      if (!isNaN(categoryIdNum)) conditions.push(eq(productsTable.categoryId, categoryIdNum));
    }

    const brandIdNum = brandId ? parseInt(brandId) : NaN;
    if (!isNaN(brandIdNum)) conditions.push(eq(productsTable.brandId, brandIdNum));
    if (minPrice && !isNaN(parseFloat(minPrice))) conditions.push(gte(productsTable.price, minPrice));
    if (maxPrice && !isNaN(parseFloat(maxPrice))) conditions.push(lte(productsTable.price, maxPrice));
    if (inStock === "true") conditions.push(gte(productsTable.stock, sql`1`));
    if (isOem === "true") conditions.push(eq(productsTable.isOem, true));
    if (isOem === "false") conditions.push(eq(productsTable.isOem, false));

    // Build base query with joins
    const baseQuery = db
      .select({
        product: productsTable,
        categoryName: categoriesTable.name,
        brandName: brandsTable.name,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id));

    // Apply WHERE conditions
    let rows;
    const hasSearch = !!search;
    const searchCondition = hasSearch ? ilike(productsTable.name, `%${search}%`) : null;

    if (hasSearch && searchCondition) {
      rows = await db
        .select({
          product: productsTable,
          categoryName: categoriesTable.name,
          brandName: brandsTable.name,
        })
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
        .where(conditions.length > 0 ? and(searchCondition, ...conditions) : searchCondition);
    } else if (conditions.length > 0) {
      rows = await baseQuery.where(and(...conditions));
    } else {
      rows = await baseQuery;
    }

    // In-memory filters (JSONB fields)
    if (vehicleMake || vehicleModel || vehicleYear || engine) {
      rows = rows.filter((r) => {
        const compat = r.product.compatibility as string[];
        if (!compat || compat.length === 0) return false;
        const compatStr = compat.join(" ").toLowerCase();
        if (vehicleMake && !compatStr.includes(vehicleMake.toLowerCase())) return false;
        if (vehicleModel && !compatStr.includes(vehicleModel.toLowerCase())) return false;
        if (vehicleYear && !compatStr.includes(vehicleYear)) return false;
        if (engine && !compatStr.includes(engine.toLowerCase())) return false;
        return true;
      });
    }

    // Warranty filter (in-memory)
    if (hasWarranty === "true") {
      rows = rows.filter((r) => !!r.product.warranty && r.product.warranty.trim() !== "");
    }

    const total = rows.length;

    // Sort
    if (sortBy === "price_asc") {
      rows.sort((a, b) => parseFloat(a.product.price) - parseFloat(b.product.price));
    } else if (sortBy === "price_desc") {
      rows.sort((a, b) => parseFloat(b.product.price) - parseFloat(a.product.price));
    } else if (sortBy === "name") {
      rows.sort((a, b) => a.product.name.localeCompare(b.product.name));
    } else {
      rows.sort((a, b) => new Date(b.product.createdAt).getTime() - new Date(a.product.createdAt).getTime());
    }

    // Get review stats for all products
    const allReviews = await db.select().from(reviewsTable);
    const reviewMap: Record<number, { count: number; sum: number }> = {};
    for (const rev of allReviews) {
      if (!reviewMap[rev.productId]) reviewMap[rev.productId] = { count: 0, sum: 0 };
      reviewMap[rev.productId].count++;
      reviewMap[rev.productId].sum += rev.rating;
    }

    const paginated = rows.slice(offset, offset + limitNum).map((r) => {
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

    res.json({
      products: paginated,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    req.log.error({ err }, "Error listing products");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /products/featured
router.get("/products/featured", async (req, res) => {
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
      .where(eq(productsTable.isFeatured, true))
      .limit(8);

    const allReviews = await db.select().from(reviewsTable);
    const reviewMap: Record<number, { count: number; sum: number }> = {};
    for (const rev of allReviews) {
      if (!reviewMap[rev.productId]) reviewMap[rev.productId] = { count: 0, sum: 0 };
      reviewMap[rev.productId].count++;
      reviewMap[rev.productId].sum += rev.rating;
    }

    const products = rows.map((r) => {
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

    res.json(products);
  } catch (err) {
    req.log.error({ err }, "Error fetching featured products");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /products/:id
router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const rows = await db
      .select({
        product: productsTable,
        categoryName: categoriesTable.name,
        brandName: brandsTable.name,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
      .where(eq(productsTable.id, id))
      .limit(1);

    if (rows.length === 0) return res.status(404).json({ error: "Product not found" });

    const r = rows[0];
    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.productId, id)).orderBy(desc(reviewsTable.createdAt));

    const ratingCount = reviews.length;
    const ratingSum = reviews.reduce((s, rv) => s + rv.rating, 0);

    res.json({
      ...r.product,
      price: parseFloat(r.product.price),
      compareAtPrice: r.product.compareAtPrice ? parseFloat(r.product.compareAtPrice) : null,
      categoryName: r.categoryName || "",
      brandName: r.brandName || "",
      rating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0,
      reviewCount: ratingCount,
      reviews: reviews.map((rv) => ({ ...rv })),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching product");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products
router.post("/products", async (req, res) => {
  try {
    const [product] = await db.insert(productsTable).values({
      ...req.body,
      price: String(req.body.price),
      compareAtPrice: req.body.compareAtPrice ? String(req.body.compareAtPrice) : null,
    }).returning();
    res.status(201).json({ ...product, price: parseFloat(product.price) });
  } catch (err) {
    req.log.error({ err }, "Error creating product");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /products/:id
router.patch("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = { ...req.body };
    if (updates.price) updates.price = String(updates.price);
    if (updates.compareAtPrice) updates.compareAtPrice = String(updates.compareAtPrice);

    const [updated] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json({ ...updated, price: parseFloat(updated.price) });
  } catch (err) {
    req.log.error({ err }, "Error updating product");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /products/:id
router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting product");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
