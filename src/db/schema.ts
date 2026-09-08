import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const districts = pgTable("districts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  freeThreshold: integer("free_threshold").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  icon: text("icon").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  weight: text("weight").notNull(),
  inStock: boolean("in_stock").notNull().default(true),
  imageFilename: text("image_filename").notNull(),
  aiImagePrompt: text("ai_image_prompt").notNull(),
  imageUrl: text("image_url"),
  tags: jsonb("tags").$type<string[]>().default([]),
  hasVariants: boolean("has_variants").notNull().default(false),
  price40cm: integer("price_40cm"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  zone: text("zone").notNull(),
  deliveryType: text("delivery_type").notNull(), // 'delivery' | 'pickup'
  address: text("address").notNull(),
  time: text("time").notNull(),
  paymentMethod: text("payment_method").notNull(),
  items: jsonb("items").notNull(),
  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  discount: integer("discount").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("new"), // 'new' | 'confirmed' | 'cooking' | 'delivering' | 'completed'
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promotions = pgTable("promotions", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  minAmount: integer("min_amount").notNull().default(0),
  description: text("description").notNull(),
  active: boolean("active").notNull().default(true),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  author: text("author").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  dishName: text("dish_name"),
  createdAt: timestamp("created_at").defaultNow(),
});
