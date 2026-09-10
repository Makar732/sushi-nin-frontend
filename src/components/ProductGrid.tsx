'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Product } from '@/data/products';
import { CATEGORIES } from '@/data/categories';
import { ProductCard } from './ProductCard';
import { SearchX } from 'lucide-react';

interface ProductGridProps {
  initialProducts: Product[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ initialProducts }) => {
  const { searchQuery, selectedCategory, activeFilter } = useStore();

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesCat = product.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }
      if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
      if (activeFilter === 'hit' && !product.tags?.includes('hit')) return false;
      if (activeFilter === 'spicy' && !product.tags?.includes('spicy')) return false;
      if (activeFilter === 'baked' && !product.tags?.includes('baked')) return false;
      if (activeFilter === 'nomeat' && !product.tags?.includes('nomeat')) return false;
      return true;
    });
  }, [initialProducts, searchQuery, selectedCategory, activeFilter]);

  const categorizedGroups = useMemo(() => {
    if (selectedCategory !== 'all') {
      return [{ categoryName: selectedCategory, items: filteredProducts }];
    }
    const groups: { categoryName: string; icon: string; items: Product[] }[] = [];
    CATEGORIES.forEach((cat) => {
      const items = filteredProducts.filter((p) => p.category === cat.name);
      if (items.length > 0) {
        groups.push({ categoryName: cat.name, icon: cat.icon, items });
      }
    });
    return groups;
  }, [filteredProducts, selectedCategory]);

  if (filteredProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 bg-slate-800/80 border border-slate-700 rounded-3xl text-slate-400 mb-4">
          <SearchX className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h3 className="text-xl font-bold text-slate-200">Блюда не найдены</h3>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Попробуйте изменить поисковый запрос или сбросить активные фильтры.
        </p>
      </div>
    );
  }

  // Сквозной счётчик по всем группам — приоритет (eager loading) получают
  // только первые 4 карточки на всей странице (обычно видны на первом экране)
  let globalIndex = 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-10 sm:space-y-12">
      {categorizedGroups.map((group) => {
        const catInfo = CATEGORIES.find((c) => c.name === group.categoryName);
        return (
          <section key={group.categoryName} id={`category-${group.categoryName}`} className="scroll-mt-36">
            <div className="flex items-center justify-between mb-4 sm:mb-6 pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <span className="text-xl sm:text-2xl">{catInfo?.icon || '🍣'}</span>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-50 tracking-tight">
                    {group.categoryName}
                  </h2>
                  {catInfo?.description && (
                    <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{catInfo.description}</p>
                  )}
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                {group.items.length} поз.
              </span>
            </div>

            {/* GRID: 2 колонки на мобилке, 3 на md, 4 на xl */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
              {group.items.map((product) => {
                const isPriority = globalIndex < 4;
                globalIndex += 1;
                return (
                  <ProductCard key={product.id} product={product} priority={isPriority} />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};