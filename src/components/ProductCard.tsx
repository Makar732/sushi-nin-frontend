'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/data/products';
import { useStore } from '@/store/useStore';
import { Plus, Minus, ShoppingBag } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const { addToCart, cart, updateQuantity, setSelectedProductForModal } = useStore();
  const [selectedVariant, setSelectedVariant] = useState<'34 см' | '40 см'>('34 см');
  const [imgSrc, setImgSrc] = useState(product.imageUrl || `/images/${product.image_filename}` || FALLBACK_IMAGE);

  const isPizza = product.category === 'Пицца';
  const currentPrice = isPizza && selectedVariant === '40 см'
    ? (product.price40cm || Math.round(product.price * 1.35))
    : product.price;

  const variantKey = isPizza ? selectedVariant : undefined;
  const cartItemId = `${product.id}${variantKey ? `-${variantKey}` : ''}`;
  const cartItem = cart.find((i) => i.id === cartItemId);
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, variantKey, currentPrice);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(cartItemId, -1);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(cartItemId, 1);
  };

  return (
    <div
      onClick={() => setSelectedProductForModal(product)}
      className="group relative flex flex-col justify-between bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 hover:border-red-500/40 rounded-2xl p-2 sm:p-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-red-500/10 cursor-pointer overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/15 transition-all duration-500" />

      <div>
        {/* Image */}
        <div className="gpu-fix relative w-full h-28 sm:h-44 md:h-48 rounded-xl overflow-hidden bg-slate-900 mb-2 sm:mb-3">
          <Image
            src={imgSrc}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />

          {!product.in_stock && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-10">
              <span className="bg-red-950/90 text-red-400 border border-red-500/50 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase">
                Нет в наличии
              </span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
            {product.tags?.includes('hit') && (
              <span className="bg-red-600/90 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md border border-red-400/50 backdrop-blur">
                💥 ХИТ
              </span>
            )}
            {product.tags?.includes('spicy') && (
              <span className="bg-amber-600/90 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md border border-amber-400/50 backdrop-blur">
                🌶️ ОСТРОЕ
              </span>
            )}
            {product.tags?.includes('baked') && (
              <span className="bg-orange-600/90 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md border border-orange-400/50 backdrop-blur">
                🧀 ЗАПЕЧ.
              </span>
            )}
            {product.tags?.includes('nomeat') && (
              <span className="bg-emerald-600/90 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md border border-emerald-400/50 backdrop-blur">
                🥑 БЕЗ МЯСА
              </span>
            )}
          </div>

          {/* Weight */}
          <span className="absolute bottom-1.5 right-1.5 bg-slate-900/90 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-700 backdrop-blur z-10">
            {product.weight}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-xs sm:text-base font-bold text-slate-100 group-hover:text-red-400 transition-colors line-clamp-2 leading-tight">
            {product.title}
          </h3>
          <p className="hidden sm:block text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pizza Size Selector */}
        {isPizza && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-2 p-0.5 sm:p-1 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center text-xs"
          >
            <button
              onClick={() => setSelectedVariant('34 см')}
              className={`flex-1 py-1 text-[10px] sm:text-[11px] font-extrabold rounded-lg transition ${
                selectedVariant === '34 см' ? 'bg-red-600 text-white' : 'text-slate-400'
              }`}
            >
              34 см
            </button>
            <button
              onClick={() => setSelectedVariant('40 см')}
              className={`flex-1 py-1 text-[10px] sm:text-[11px] font-extrabold rounded-lg transition ${
                selectedVariant === '40 см' ? 'bg-red-600 text-white' : 'text-slate-400'
              }`}
            >
              40 см
            </button>
          </div>
        )}
      </div>

      {/* Footer: Price + Cart */}
      <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-700/50 flex items-center justify-between gap-1">
        <div>
          <span className="text-[10px] text-slate-400 block leading-none">Цена</span>
          <span className="text-sm sm:text-xl font-black text-slate-50">{currentPrice} ₽</span>
        </div>

        {product.in_stock ? (
          currentQuantity > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1 bg-slate-900 border border-slate-700 p-0.5 sm:p-1 rounded-xl"
            >
              <button
                onClick={handleDecrease}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition active:scale-90 shrink-0"
              >
                <Minus className="w-3 h-3 shrink-0" />
              </button>
              <span className="font-extrabold text-white text-xs px-1">
                {currentQuantity}
              </span>
              <button
                onClick={handleIncrease}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition active:scale-90 shrink-0"
              >
                <Plus className="w-3 h-3 shrink-0" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-[10px] sm:text-xs px-2 sm:px-3.5 py-2 sm:py-2.5 rounded-xl shadow-md shadow-red-500/20 active:scale-95 transition shrink-0"
            >
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">В корзину</span>
            </button>
          )
        ) : (
          <span className="text-[10px] text-slate-500 font-semibold">Недоступно</span>
        )}
      </div>
    </div>
  );
};