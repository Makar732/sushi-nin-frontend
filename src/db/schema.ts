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
  deliveryType: text("delivery_type").notNull(),
  address: text("address").notNull(),
  time: text("time").notNull(),
  paymentMethod: text("payment_method").notNull(),
  items: jsonb("items").notNull(),
  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  discount: integer("discount").notNull().default(0),
  promoCode: text("promo_code"),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("new"),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promotions = pgTable("promotions", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percent"),
  discountValue: integer("discount_value").notNull(),
  minAmount: integer("min_amount").notNull().default(0),
  usageLimit: integer("usage_limit").notNull().default(0),
  usedCount: integer("used_count").notNull().default(0),
  description: text("description").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const giftSettings = pgTable("gift_settings", {
  id: serial("id").primaryKey(),
  minAmount: integer("min_amount").notNull().default(2000),
  productIds: jsonb("product_ids").$type<string[]>().default([]),
  active: boolean("active").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  badge: text("badge").notNull().default("АКЦИЯ"),
  code: text("code"),
  bgGradient: text("bg_gradient").notNull().default("from-red-900/60 via-slate-900 to-slate-900"),
  accentColor: text("accent_color").notNull().default("border-red-500/40 text-red-400"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Зоны доставки (управляемые из админки, синхронизированы с таблицей districts)
export const deliveryZones = pgTable("delivery_zones", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  freeThreshold: integer("free_threshold").notNull(),
  deliveryFee: integer("delivery_fee").notNull(),
  description: text("description").notNull().default(""),
  active: boolean("active").notNull().default(true),
});

// Режим работы заведения
export const workingHours = pgTable("working_hours", {
  id: serial("id").primaryKey(),
  openTime: text("open_time").notNull().default("11:00"),
  closeTime: text("close_time").notNull().default("22:40"),
  isManualClosed: boolean("is_manual_closed").notNull().default(false),
  manualCloseReason: text("manual_close_reason").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  author: text("author").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  dishName: text("dish_name"),
  createdAt: timestamp("created_at").defaultNow(),
});