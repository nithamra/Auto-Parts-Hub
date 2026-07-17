import { pgTable, serial, text, integer, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";

export type CartItemData = {
  productId: number;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  sku: string;
  stock: number;
};

export const cartsTable = pgTable("carts", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  items: jsonb("items").$type<CartItemData[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const wishlistsTable = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
