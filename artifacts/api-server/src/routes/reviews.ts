import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /products/:id/reviews
router.get("/products/:id/reviews", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, productId))
      .orderBy(desc(reviewsTable.createdAt));
    res.json(reviews);
  } catch (err) {
    req.log.error({ err }, "Error listing reviews");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products/:id/reviews
router.post("/products/:id/reviews", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const [review] = await db
      .insert(reviewsTable)
      .values({ ...req.body, productId, verified: false, helpful: 0 })
      .returning();
    res.status(201).json(review);
  } catch (err) {
    req.log.error({ err }, "Error creating review");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
