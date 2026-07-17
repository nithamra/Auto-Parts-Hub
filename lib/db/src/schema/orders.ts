import { pgTable, serial, text, integer, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export type OrderItemData = {
  productId: number;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  sku: string;
};

export type ShippingAddressData = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  userId: integer("user_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  items: jsonb("items").$type<OrderItemData[]>().notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  shipping: numeric("shipping", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").$type<OrderStatus>().default("pending").notNull(),
  shippingAddress: jsonb("shipping_address").$type<ShippingAddressData>().notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
