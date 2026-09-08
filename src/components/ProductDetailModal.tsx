'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Product } from '@/data/products';
import { X, ShoppingBag, Sparkles, Flame, Check, Plus, Minus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProductDetailModal = () => {
  const { selectedProductForModal, setSelectedProductForModal, addToCart, cart, updateQuantity } = useStore();
  const [selectedVariant, setSelectedVariant] = useState<'34 см' | '40 см'>('34 см');
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  if (!selectedProductForModal) return null;

  const product = selectedProductForModal;
  const isPizza = product.category === 'Пицца';
  const currentPrice = isPizza && selectedVariant === '40 см' ? (product.price40cm || Math.round(product.price * 1.35)) : product.price;

  const variantKey = isPizza ? selectedVariant : undefined;
  const cartItemId = `${product.id}${variantKey ? `-${variantKey}` : ''}`;
  const cartItem = cart.find((i) => i.id === cartItemId);
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addToCart(product, variantKey, currentPrice);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-red-500/10 max-h-[90vh] flex flex-col md:flex-row"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedProductForModal(null)}
            className="absolute top-4 right-4 z-20 p-2 bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-400 rounded-full hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image Column */}
          <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-slate-950 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={product.imageUrl || `/images/${product.image_filename}`}
              alt={product.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // Fallback image if URL fails
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r" />

            {/* Out of stock or tags overlay */}
            {!product.in_stock && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
                <span className="bg-red-600 text-white px-4 py-2 rounded-2xl font-bold text-sm uppercase tracking-wider">
                  Нет в наличии
                </span>
              </div>
            )}

            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
              <span className="bg-slate-900/90 text-slate-200 border border-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-xl backdrop-blur">
                {product.category}
              </span>
              <span className="bg-slate-900/90 text-sky-400 border border-sky-500/30 text-[11px] font-bold px-2.5 py-1 rounded-xl backdrop-blur">
                {product.weight}
              </span>
            </div>
          </div>

          {/* Content Column */}
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1 uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 fill-red-400" /> СушиМин Шедевр
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-100 tracking-tight leading-tight">
                {product.title}
              </h2>

              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                {product.description}
              </p>

              {/* Size Selector for Pizza */}
              {isPizza && (
                <div className="mt-5 p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Выберите размер пиццы:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedVariant('34 см')}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                        selectedVariant === '34 см'
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      34 см ({product.price} ₽)
                    </button>
                    <button
                      onClick={() => setSelectedVariant('40 см')}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                        selectedVariant === '40 см'
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      40 см ({product.price40cm || Math.round(product.price * 1.35)} ₽)
                    </button>
                  </div>
                </div>
              )}

              {/* AI Image Generation Prompt Accordion */}
              <div className="mt-5">
                <button
                  onClick={() => setShowAiPrompt(!showAiPrompt)}
                  className="flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{showAiPrompt ? 'Скрыть AI Art Prompt' : 'Показать AI Art Direction Prompt'}</span>
                </button>

                {showAiPrompt && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-3 bg-slate-950/80 rounded-xl border border-sky-500/20 text-[11px] text-slate-300 font-mono leading-relaxed"
                  >
                    <span className="text-sky-400 font-bold block mb-1">Midjourney / Grok 3 Prompt:</span>
                    {product.ai_image_prompt}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 block">Стоимость:</span>
                <span className="text-2xl font-black text-slate-50">{currentPrice} ₽</span>
              </div>

              {product.in_stock ? (
                currentQuantity > 0 ? (
                  <div className="flex items-center space-x-3 bg-slate-800 border border-slate-700 p-1.5 rounded-2xl">
                    <button
                      onClick={() => updateQuantity(cartItemId, -1)}
                      className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-extrabold text-white text-base px-2">
                      {currentQuantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(cartItemId, 1)}
                      className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-extrabold px-6 py-3 rounded-2xl shadow-lg shadow-red-500/25 active:scale-95 transition"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>В корзину</span>
                  </button>
                )
              ) : (
                <button
                  disabled
                  className="bg-slate-800 text-slate-500 font-bold px-6 py-3 rounded-2xl cursor-not-allowed border border-slate-700"
                >
                  Закончилось
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
