'use client';

import React, { useState } from 'react';
import { Product } from '@/data/products';
import { useStore } from '@/store/useStore';
import { Plus, Minus, Flame, ShoppingBag, Info, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cart, updateQuantity, setSelectedProductForModal } = useStore();
  const [selectedVariant, setSelectedVariant] = useState<'34 см' | '40 см'>('34 см');

  const isPizza = product.category === 'Пицца';
  const currentPrice = isPizza && selectedVariant === '40 см' ? (product.price40cm || Math.round(product.price * 1.35)) : product.price;

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
      className="group relative flex flex-col justify-between bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 hover:border-red-500/40 rounded-2xl p-4 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-red-500/10 cursor-pointer overflow-hidden"
    >
      {/* Visual background ambient glow */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/15 transition-all duration-500" />

      <div>
        {/* Top Image Container */}
        <div className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden bg-slate-900 mb-3 flex items-center justify-center">
          <img
            src={product.imageUrl || `/images/${product.image_filename}`}
            alt={product.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80';
            }}
          />

          {/* Out of Stock Overlay */}
          {!product.in_stock && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
              <span className="bg-red-950/90 text-red-400 border border-red-500/50 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                Нет в наличии
              </span>
            </div>
          )}

          {/* Badges / Tags */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
            {product.tags?.includes('hit') && (
              <span className="bg-red-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-red-400/50 backdrop-blur shadow-md flex items-center gap-1">
                💥 ХИТ
              </span>
            )}
            {product.tags?.includes('spicy') && (
              <span className="bg-amber-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-400/50 backdrop-blur shadow-md flex items-center gap-1">
                🌶️ ОСТРОЕ
              </span>
            )}
            {product.tags?.includes('baked') && (
              <span className="bg-orange-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-orange-400/50 backdrop-blur shadow-md flex items-center gap-1">
                🧀 ЗАПЕЧЁННОЕ
              </span>
            )}
            {product.tags?.includes('nomeat') && (
              <span className="bg-emerald-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-emerald-400/50 backdrop-blur shadow-md flex items-center gap-1">
                🥑 БЕЗ МЯСА
              </span>
            )}
          </div>

          {/* Weight Badge */}
          <span className="absolute bottom-2.5 right-2.5 bg-slate-900/90 text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-700 backdrop-blur">
            {product.weight}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-100 group-hover:text-red-400 transition-colors line-clamp-1">
            {product.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed h-8">
            {product.description}
          </p>
        </div>

        {/* Pizza Size Selector */}
        {isPizza && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3 p-1 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs"
          >
            <button
              onClick={() => setSelectedVariant('34 см')}
              className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg transition ${
                selectedVariant === '34 см'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              34 см
            </button>
            <button
              onClick={() => setSelectedVariant('40 см')}
              className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg transition ${
                selectedVariant === '40 см'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              40 см
            </button>
          </div>
        )}
      </div>

      {/* Footer Price & Add To Cart Button */}
      <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2">
        <div>
          <span className="text-xs text-slate-400 block leading-none">Цена</span>
          <span className="text-xl font-black text-slate-50">{currentPrice} ₽</span>
        </div>

        {product.in_stock ? (
          currentQuantity > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 p-1 rounded-xl"
            >
              <button
                onClick={handleDecrease}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition active:scale-90"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-extrabold text-white text-sm px-2">
                {currentQuantity}
              </span>
              <button
                onClick={handleIncrease}
                className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition active:scale-90"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-red-500/20 active:scale-95 transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>В корзину</span>
            </button>
          )
        ) : (
          <span className="text-xs text-slate-500 font-semibold px-2 py-1">Недоступно</span>
        )}
      </div>
    </div>
  );
};
