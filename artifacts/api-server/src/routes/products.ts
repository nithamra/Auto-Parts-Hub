import { Router } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  categoriesTable,
  brandsTable,
  reviewsTable,
} from "@workspace/db";
import { eq, and, gte, lte, ilike, sql, desc, asc } from "drizzle-orm";

const router = Router();

// GET /products
router.get("/products", async (req, res) => {
  try {
    const {
      page = "1",
      limit = "12",
      categoryId,
      brandId,
      search,
      minPrice,
      maxPrice,
      inStock,
      sortBy = "newest",
      vehicleMake,
      vehicleModel,
      vehicleYear,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
    const offset = (pageNum - 1) * limitNum;

    const conditions: ReturnType<typeof eq>[] = [];

    const categoryIdNum = categoryId ? parseInt(categoryId) : NaN;
    const brandIdNum = brandId ? parseInt(brandId) : NaN;
    if (!isNaN(categoryIdNum)) conditions.push(eq(productsTable.categoryId, categoryIdNum));
    if (!isNaN(brandIdNum)) conditions.push(eq(productsTable.brandId, brandIdNum));
    if (minPrice && !isNaN(parseFloat(minPrice))) conditions.push(gte(productsTable.price, minPrice));
    if (maxPrice && !isNaN(parseFloat(maxPrice))) conditions.push(lte(productsTable.price, maxPrice));
    if (inStock === "true") conditions.push(gte(productsTable.stock, sql`1`));

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
    let query = conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    // Handle search separately (ilike doesn't return right type for our conditions array)
    let rows;
    if (search) {
      const withSearch = db
        .select({
          product: productsTable,
          categoryName: categoriesTable.name,
          brandName: brandsTable.name,
        })
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .leftJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
        .where(
          conditions.length > 0
            ? and(ilike(productsTable.name, `%${search}%`), ...conditions)
            : ilike(productsTable.name, `%${search}%`)
        );
      rows = await withSearch;
    } else {
      rows = await query;
    }

    // Vehicle compatibility filter (in-memory since it's JSONB)
    if (vehicleMake || vehicleModel || vehicleYear) {
      rows = rows.filter((r) => {
        const compat = r.product.compatibility as string[];
        if (!compat || compat.length === 0) return false;
        const compatStr = compat.join(" ").toLowerCase();
        if (vehicleMake && !compatStr.includes(vehicleMake.toLowerCase())) return false;
        if (vehicleModel && !compatStr.includes(vehicleModel.toLowerCase())) return false;
        if (vehicleYear && !compatStr.includes(vehicleYear)) return false;
        return true;
      });
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
