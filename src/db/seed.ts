import { db } from "./index";
import { districts, categories, products, promotions } from "./schema";
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

    // Seed Promotions
    const defaultPromos = [
      { id: "promo1", code: "SUSHIMIN10", discountPercent: 10, minAmount: 0, description: "Скидка 10% на ваш первый заказ!" },
      { id: "promo2", code: "ROLLFREE", discountPercent: 15, minAmount: 2000, description: "Скидка 15% на заказы от 2000 ₽!" },
      { id: "promo3", code: "PIZZA20", discountPercent: 20, minAmount: 3000, description: "Скидка 20% на заказы от 3000 ₽!" },
    ];

    for (const promo of defaultPromos) {
      await db.insert(promotions).values(promo).onConflictDoNothing();
    }

    console.log("Database successfully seeded with Sushimin menu data!");
    return { success: true };
  } catch (error) {
    console.error("Error seeding database:", error);
    return { success: false, error };
  }
}
