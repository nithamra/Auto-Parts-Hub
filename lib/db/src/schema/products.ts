import { pgTable, serial, text, integer, numeric, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";
import { brandsTable } from "./brands";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url").notNull(),
  images: jsonb("images").$type<string[]>().default([]).notNull(),
  categoryId: integer("category_id").references(() => categoriesTable.id).notNull(),
  brandId: integer("brand_id").references(() => brandsTable.id).notNull(),
  stock: integer("stock").default(0).notNull(),
  compatibility: jsonb("compatibility").$type<string[]>().default([]).notNull(),
  specs: jsonb("specs").$type<Record<string, string>>().default({}).notNull(),
  warranty: text("warranty"),
  manufacturer: text("manufacturer"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
