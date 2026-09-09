import { db } from "./index";
import { districts, categories, products, promotions, giftSettings, banners } from "./schema";
import { DISTRICTS } from "../data/districts";
import { CATEGORIES } from "../data/categories";
import { PRODUCTS } from "../data/products";

export async function seedDatabase() {
  try {
    // Seed Districts
    for (const d of DISTRICTS) {
      await db.insert(districts).values({
        id: d.id,
        name: d.name,
        freeThreshold: d.freeThreshold,
        deliveryFee: d.deliveryFee,
      }).onConflictDoNothing();
    }

    // Seed Categories
    for (let i = 0; i < CATEGORIES.length; i++) {
      const c = CATEGORIES[i];
      await db.insert(categories).values({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        sortOrder: i,
      }).onConflictDoNothing();
    }

    // Seed Products
    for (const p of PRODUCTS) {
      await db.insert(products).values({
        id: p.id,
        title: p.title,
        category: p.category,
        description: p.description,
        price: p.price,
        weight: p.weight,
        inStock: p.in_stock,
        imageFilename: p.image_filename,
        aiImagePrompt: p.ai_image_prompt,
        imageUrl: p.imageUrl,
        tags: p.tags,
        hasVariants: p.hasVariants || false,
        price40cm: p.price40cm,
      }).onConflictDoNothing();
    }

    // Seed Promotions (новая схема: discountType + discountValue вместо discountPercent)
    const defaultPromos = [
      {
        id: "promo1",
        code: "SUSHININ10",
        discountType: "percent" as const,
        discountValue: 10,
        minAmount: 0,
        usageLimit: 0,
        usedCount: 0,
        description: "Скидка 10% на ваш первый заказ!",
        active: true,
      },
      {
        id: "promo2",
        code: "ROLLFREE",
        discountType: "percent" as const,
        discountValue: 15,
        minAmount: 2000,
        usageLimit: 0,
        usedCount: 0,
        description: "Скидка 15% на заказы от 2000 ₽!",
        active: true,
      },
      {
        id: "promo3",
        code: "PIZZA20",
        discountType: "percent" as const,
        discountValue: 20,
        minAmount: 3000,
        usageLimit: 0,
        usedCount: 0,
        description: "Скидка 20% на заказы от 3000 ₽!",
        active: true,
      },
    ];

    for (const promo of defaultPromos) {
      await db.insert(promotions).values(promo).onConflictDoNothing();
    }

    // Seed Gift Settings (дефолтные настройки подарка за чек)
    const existingGift = await db.select().from(giftSettings).limit(1);
    if (existingGift.length === 0) {
      await db.insert(giftSettings).values({
        minAmount: 2000,
        productIds: [],
        active: false,
      });
    }

    // Seed Banners (дефолтные баннеры на главной)
    const defaultBanners = [
      {
        title: "Скидка 10% на первый заказ!",
        subtitle: "Вводите промокод при оформлении корзины",
        badge: "ПРОМОКОД",
        code: "SUSHININ10",
        bgGradient: "from-red-900/60 via-slate-900 to-slate-900",
        accentColor: "border-red-500/40 text-red-400",
        sortOrder: 0,
        active: true,
      },
      {
        title: "Скидка 15% на заказы от 2000 ₽!",
        subtitle: "Отличный повод заказать большой сет для всей компании",
        badge: "ВЫГОДА",
        code: "ROLLFREE",
        bgGradient: "from-emerald-950/70 via-slate-900 to-slate-900",
        accentColor: "border-emerald-500/40 text-emerald-400",
        sortOrder: 1,
        active: true,
      },
      {
        title: "Скидка 20% на заказы от 3000 ₽!",
        subtitle: "Введите промокод в корзине и получите максимальную выгоду",
        badge: "АКЦИЯ",
        code: "PIZZA20",
        bgGradient: "from-sky-950/70 via-slate-900 to-slate-900",
        accentColor: "border-sky-500/40 text-sky-400",
        sortOrder: 2,
        active: true,
      },
    ];

    for (const banner of defaultBanners) {
      await db.insert(banners).values(banner).onConflictDoNothing();
    }

    console.log("Database successfully seeded with Sushimin menu data!");
    return { success: true };
  } catch (error) {
    console.error("Error seeding database:", error);
    return { success: false, error };
  }
}