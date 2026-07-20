import { pgTable, serial, text, integer, numeric, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";

export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

export type TransactionItemData = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),

  // PayPal identifiers
  paypalOrderId: text("paypal_order_id").notNull(),
  paypalTransactionId: text("paypal_transaction_id").unique(),

  // Links
  orderId: integer("order_id").references(() => ordersTable.id),
  userId: integer("user_id"),

  // Customer snapshot
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),

  // What was purchased
  items: jsonb("items").$type<TransactionItemData[]>().notNull().default([]),

  // Financials — stored in SAR
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("SAR"),

  // Status
  status: text("status").$type<TransactionStatus>().notNull().default("pending"),

  // Webhook / IPN verification
  webhookVerified: boolean("webhook_verified").notNull().default(false),

  // Raw PayPal payload for auditing
  rawPayload: jsonb("raw_payload"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Transaction = typeof transactionsTable.$inferSelect;
export type InsertTransaction = typeof transactionsTable.$inferInsert;
