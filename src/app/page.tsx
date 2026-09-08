import React from 'react';
import { Header } from '@/components/Header';
import { PromoBanner } from '@/components/PromoBanner';
import { CategoryNav } from '@/components/CategoryNav';
import { ProductGrid } from '@/components/ProductGrid';
import { DistrictModal } from '@/components/DistrictModal';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { OrderTrackerModal } from '@/components/OrderTrackerModal';
import { MobileCartBar } from '@/components/MobileCartBar';
import { MobileOrderBanner } from '@/components/MobileOrderBanner';
import { Footer } from '@/components/Footer';
import { PRODUCTS } from '@/data/products';
import { db } from '@/db';
import { products } from '@/db/schema';
import { seedDatabase } from '@/db/seed';

export const revalidate = 0;

async function getProducts() {
  try {
    let dbProducts: any[] = [];
    try {
      dbProducts = await db.select().from(products);
      if (dbProducts.length === 0) {
        await seedDatabase();
        dbProducts = await db.select().from(products);
      }
    } catch (e) {
      console.warn("DB select failed, falling back to static menu JSON:", e);
    }

    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        description: p.description,
        price: p.price,
        weight: p.weight,
        in_stock: p.inStock,
        image_filename: p.imageFilename,
        ai_image_prompt: p.aiImagePrompt,
        imageUrl: p.imageUrl,
        tags: (p.tags as string[]) || [],
        hasVariants: p.hasVariants,
        price40cm: p.price40cm,
      }));
    }
  } catch (err) {
    console.error("Failed to load products from DB:", err);
  }

  return PRODUCTS;
}

export default async function HomePage() {
  const initialProducts = await getProducts();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-red-500 selection:text-white font-sans antialiased">
      {/* Sticky Header */}
      <Header />

      {/* Мобильная плашка активного заказа (под шапкой) */}
      <MobileOrderBanner />

      {/* Hero / Promotional Banners */}
      <PromoBanner />

      {/* Sticky Category Tabs & Filter Chips */}
      <CategoryNav />

      {/* Main Menu Grid */}
      <main className="pb-12">
        <ProductGrid initialProducts={initialProducts} />
      </main>

      {/* Modals & Slide-over Drawers */}
      <DistrictModal />
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderTrackerModal />

      {/* Mobile Floating Cart Widget */}
      <MobileCartBar />

      {/* Footer */}
      <Footer />
    </div>
  );
}