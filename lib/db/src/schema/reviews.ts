import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => productsTable.id).notNull(),
  userName: text("user_name").notNull(),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  verified: boolean("verified").default(false).notNull(),
  helpful: integer("helpful").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
