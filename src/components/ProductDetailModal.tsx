'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useStore } from '@/store/useStore';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { X, ShoppingBag, Sparkles, Flame, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProductDetailModal = () => {
  const { selectedProductForModal, setSelectedProductForModal, addToCart, cart, updateQuantity } = useStore();

  // ⚠️ ВСЕ ХУКИ ДОЛЖНЫ БЫТЬ ВЫЗВАНЫ ДО ЛЮБОГО УСЛОВНОГО RETURN.
  // Это критически важно для React — иначе "Rendered more hooks than during the previous render"
  // и полный краш страницы при открытии модалки.
  const [selectedVariant, setSelectedVariant] = useState<'34 см' | '40 см'>('34 см');
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  const product = selectedProductForModal;

  // Безопасно вычисляем fallback-картинку ДО early return, чтобы порядок хуков был стабилен.
  const safeImageSrc = product
    ? product.imageUrl || (product.image_filename ? `/images/${product.image_filename}` : FALLBACK_IMAGE)
    : FALLBACK_IMAGE;

  const [imgSrc, setImgSrc] = useState<string>(safeImageSrc);

  // Синхронизируем imgSrc при смене товара (т.к. useState берёт значение только при первом монтировании)
  React.useEffect(() => {
    setImgSrc(safeImageSrc);
    setSelectedVariant('34 см');
    setShowAiPrompt(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // Теперь можно безопасно делать ранний return — все хуки уже вызваны выше.
  if (!product) return null;

  // --- Защитные проверки полей товара ---
  const title = product.title?.trim() || 'Без названия';
  const description = product.description?.trim() || 'Описание отсутствует';
  const category = product.category || 'Разное';
  const weight = product.weight || '—';
  const basePrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
  const price40cm = typeof product.price40cm === 'number' && !isNaN(product.price40cm)
    ? product.price40cm
    : Math.round(basePrice * 1.35);
  const tags = Array.isArray(product.tags) ? product.tags : [];
  const isPizza = category === 'Пицца';
  const inStock = product.in_stock !== false; // если undefined — считаем товар доступным

  const currentPrice = isPizza && selectedVariant === '40 см' ? price40cm : basePrice;

  const variantKey = isPizza ? selectedVariant : undefined;
  const cartItemId = `${product.id}${variantKey ? `-${variantKey}` : ''}`;
  const cartItem = (cart || []).find((i) => i.id === cartItemId);
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addToCart(product, variantKey, currentPrice);
  };

  const handleClose = () => setSelectedProductForModal(null);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-red-500/10 max-h-[90vh] flex flex-col md:flex-row"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Закрыть"
            className="absolute top-4 right-4 z-20 p-2 bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-400 rounded-full hover:text-white transition"
          >
            <X className="w-5 h-5 shrink-0" />
          </button>

          {/* Image Column */}
          <div
            onContextMenu={(e) => e.preventDefault()}
            className="gpu-fix no-callout relative w-full md:w-1/2 h-64 md:h-auto bg-slate-950 overflow-hidden shrink-0"
          >
            <Image
              src={imgSrc || FALLBACK_IMAGE}
              alt={title}
              fill
              draggable={false}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="no-callout object-cover object-center"
              onError={() => setImgSrc(FALLBACK_IMAGE)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:bg-gradient-to-r" />

            {!inStock && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-10">
                <span className="bg-red-600 text-white px-4 py-2 rounded-2xl font-bold text-sm uppercase tracking-wider">
                  Нет в наличии
                </span>
              </div>
            )}

            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 z-10">
              <span className="bg-slate-900/90 text-slate-200 border border-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-xl backdrop-blur">
                {category}
              </span>
              <span className="bg-slate-900/90 text-sky-400 border border-sky-500/30 text-[11px] font-bold px-2.5 py-1 rounded-xl backdrop-blur">
                {weight}
              </span>
            </div>
          </div>

          {/* Content Column */}
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-red-400 flex items-center gap-1 uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5 fill-red-400 shrink-0" /> СушиНин Шедевр
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-100 tracking-tight leading-tight">
                {title}
              </h2>

              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                {description}
              </p>

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
                      34 см ({basePrice} ₽)
                    </button>
                    <button
                      onClick={() => setSelectedVariant('40 см')}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                        selectedVariant === '40 см'
                          ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/20'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      40 см ({price40cm} ₽)
                    </button>
                  </div>
                </div>
              )}

              {/* AI Image Generation Prompt Accordion */}
              {product.ai_image_prompt && (
                <div className="mt-5">
                  <button
                    onClick={() => setShowAiPrompt((prev) => !prev)}
                    className="flex items-center space-x-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
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
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 block">Стоимость:</span>
                <span className="text-2xl font-black text-slate-50">{currentPrice} ₽</span>
              </div>

              {inStock ? (
                currentQuantity > 0 ? (
                  <div className="flex items-center space-x-3 bg-slate-800 border border-slate-700 p-1.5 rounded-2xl">
                    <button
                      onClick={() => updateQuantity(cartItemId, -1)}
                      className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition shrink-0"
                    >
                      <Minus className="w-4 h-4 shrink-0" />
                    </button>
                    <span className="font-extrabold text-white text-base px-2">
                      {currentQuantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(cartItemId, 1)}
                      className="w-8 h-8 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition shrink-0"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-extrabold px-6 py-3 rounded-2xl shadow-lg shadow-red-500/25 active:scale-95 transition"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
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