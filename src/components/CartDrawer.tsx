'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { X, Trash2, Plus, Minus, ShoppingBag, Truck, Tag, ArrowRight, Sparkles, AlertCircle, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FREE_DELIVERY_THRESHOLD = 700;
const GIFT_THRESHOLD = 2000;

export const CartDrawer = () => {
  const {
    cart,
    isCartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    district,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    setCheckoutOpen
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  if (!isCartOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeThreshold = district?.freeThreshold || FREE_DELIVERY_THRESHOLD;
  const deliveryFee = subtotal >= freeThreshold ? 0 : (district?.deliveryFee || 100);
  const remainingForFree = Math.max(0, freeThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
  const giftUnlocked = subtotal >= GIFT_THRESHOLD;
  const remainingForGift = Math.max(0, GIFT_THRESHOLD - subtotal);

  const discountAmount = appliedPromo ? Math.round((subtotal * appliedPromo.discountPercent) / 100) : 0;
  const totalAmount = subtotal - discountAmount + deliveryFee;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput) return;
    const res = applyPromoCode(promoInput);
    if (!res.success) {
      setPromoError(res.message);
    } else {
      setPromoError('');
      setPromoInput('');
    }
  };

  const handleOpenCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCartOpen(false)}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-50 tracking-tight">Ваша корзина</h2>
                  <p className="text-xs text-slate-400">
                    Район: <span className="text-slate-200 font-semibold">{district?.name || 'Заволжье'}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Прогресс-бар доставки */}
            <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 space-y-2">
              {/* До бесплатной доставки */}
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Truck className="w-4 h-4 text-sky-400" />
                  {remainingForFree === 0 ? 'Доставка бесплатна!' : `До бесплатной доставки:`}
                </span>
                <span className={remainingForFree === 0 ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                  {remainingForFree === 0 ? '✓ Бесплатно' : `Ещё ${remainingForFree} ₽`}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 via-sky-400 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Плата за доставку (если не достигнут порог) */}
              {remainingForFree > 0 && (
                <p className="text-[11px] text-slate-500">
                  Стоимость доставки: <span className="text-red-400 font-bold">{district?.deliveryFee || 100} ₽</span>
                </p>
              )}

              {/* Подарок от 2000 ₽ */}
              <div className={`flex items-center justify-between text-xs font-semibold pt-1 ${giftUnlocked ? 'text-amber-400' : 'text-slate-500'}`}>
                <span className="flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
                  {giftUnlocked ? '🎁 Подарок разблокирован!' : `Подарок от ${GIFT_THRESHOLD} ₽`}
                </span>
                {!giftUnlocked && (
                  <span className="text-slate-500">Ещё {remainingForGift} ₽</span>
                )}
              </div>
            </div>

            {/* Список товаров */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="p-4 bg-slate-800/60 rounded-full text-slate-500 mb-4 border border-slate-700">
                    <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-200">Корзина пуста</h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Выберите аппетитные суши, пиццу или горячие сеты из нашего меню!
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center space-x-3 group hover:border-slate-600 transition">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-950 shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-bold text-slate-100 truncate">{item.title}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-500 hover:text-red-400 p-1 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.variant && (
                        <span className="text-[11px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md font-medium border border-red-500/30">
                          {item.variant}
                        </span>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-extrabold text-slate-100">{item.price * item.quantity} ₽</span>
                        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 p-1 rounded-xl">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-white px-1.5">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Промокод + итог */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-800 bg-slate-900/95 space-y-4">
                {appliedPromo ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs font-bold text-emerald-300">
                          {appliedPromo.code} (-{appliedPromo.discountPercent}%)
                        </span>
                        <p className="text-[10px] text-emerald-400/80">{appliedPromo.description}</p>
                      </div>
                    </div>
                    <button onClick={removePromoCode} className="text-xs text-slate-400 hover:text-red-400 underline">
                      Отмена
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="space-y-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                        placeholder="Промокод (SUSHININ10)"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
                      />
                      <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition">
                        Ввод
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {promoError}
                      </p>
                    )}
                  </form>
                )}

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Сумма заказа:</span>
                    <span className="font-bold">{subtotal} ₽</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Скидка:</span>
                      <span>-{discountAmount} ₽</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Доставка ({district?.name}):</span>
                    <span className={deliveryFee === 0 ? 'text-emerald-400 font-bold' : 'font-bold'}>
                      {deliveryFee === 0 ? 'БЕСПЛАТНО' : `${deliveryFee} ₽`}
                    </span>
                  </div>
                  {giftUnlocked && (
                    <div className="flex justify-between text-amber-400 font-semibold">
                      <span>🎁 Подарок к заказу:</span>
                      <span>Включён</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-3 border-t border-slate-800 text-base font-black text-slate-50">
                    <span>ИТОГО К ОПЛАТЕ:</span>
                    <span className="text-xl text-red-500">{totalAmount} ₽</span>
                  </div>
                </div>

                <button onClick={handleOpenCheckout}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-red-500/25 flex items-center justify-center space-x-2 active:scale-95 transition">
                  <span>Оформить заказ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};