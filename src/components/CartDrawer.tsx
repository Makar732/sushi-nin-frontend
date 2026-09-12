'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { FALLBACK_IMAGE } from '@/lib/constants';
import { X, Trash2, Plus, Minus, ShoppingBag, Truck, Tag, ArrowRight, Sparkles, AlertCircle, Gift, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FREE_DELIVERY_THRESHOLD = 700;

interface GiftProduct {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  weight: string;
}

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
    setCheckoutOpen,
    addToCart,
    openDistrictModal,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const [giftMinAmount, setGiftMinAmount] = useState<number>(Infinity);
  const [giftActive, setGiftActive] = useState(false);
  const [giftProducts, setGiftProducts] = useState<GiftProduct[]>([]);

  useEffect(() => {
    if (!isCartOpen) return;
    fetch('/api/promotions')
      .then((res) => res.json())
      .then((data) => {
        if (data?.gift) {
          setGiftMinAmount(data.gift.minAmount ?? Infinity);
          setGiftActive(!!data.gift.active);
          setGiftProducts(data.gift.products || []);
        }
      })
      .catch(() => {});
  }, [isCartOpen]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeThreshold = district?.freeThreshold || FREE_DELIVERY_THRESHOLD;
  const deliveryFee = subtotal >= freeThreshold ? 0 : (district?.deliveryFee || 100);
  const remainingForFree = Math.max(0, freeThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

  const giftUnlocked = giftActive && giftProducts.length > 0 && subtotal >= giftMinAmount;
  const remainingForGift = Math.max(0, giftMinAmount - subtotal);
  const selectedGiftItem = cart.find((item) => item.id.startsWith('gift-'));

  const discountAmount = appliedPromo
    ? appliedPromo.discountType === 'fixed'
      ? Math.min(appliedPromo.discountValue, subtotal)
      : Math.round((subtotal * appliedPromo.discountValue) / 100)
    : 0;
  const totalAmount = subtotal - discountAmount + deliveryFee;

  // Автоматически снимаем подарок, если сумма упала ниже порога
  useEffect(() => {
    if (!giftUnlocked && selectedGiftItem) {
      removeFromCart(selectedGiftItem.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giftUnlocked]);

  if (!isCartOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput) return;
    setIsApplyingPromo(true);
    const res = await applyPromoCode(promoInput, subtotal);
    setIsApplyingPromo(false);
    if (!res.success) {
      setPromoError(res.message);
    } else {
      setPromoError('');
      setPromoInput('');
    }
  };

  const handleSelectGift = (gift: GiftProduct) => {
    if (selectedGiftItem) {
      removeFromCart(selectedGiftItem.id);
    }
    addToCart(
      {
        id: `gift-${gift.id}`,
        title: `🎁 ${gift.title}`,
        category: 'Подарок',
        description: gift.description,
        price: 0,
        weight: gift.weight || '',
        in_stock: true,
        image_filename: '',
        imageUrl: gift.imageUrl || FALLBACK_IMAGE,
        ai_image_prompt: '',
        tags: [],
        hasVariants: false,
        price40cm: undefined,
      },
      undefined,
      0
    );
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

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
                  <ShoppingBag className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-50 tracking-tight">Ваша корзина</h2>
                  {district ? (
                    <p className="text-xs text-slate-400">
                      Район: <span className="text-slate-200 font-semibold">{district.name}</span>
                    </p>
                  ) : (
                    <button
                      onClick={openDistrictModal}
                      className="text-xs text-amber-400 font-semibold underline underline-offset-2"
                    >
                      Выбрать район доставки
                    </button>
                  )}
                </div>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition">
                <X className="w-5 h-5 shrink-0" />
              </button>
            </div>

            {/* Прогресс-бар */}
            <div className="px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                  {remainingForFree === 0 ? 'Доставка бесплатна!' : 'До бесплатной доставки:'}
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
              {remainingForFree > 0 && (
                <p className="text-[11px] text-slate-500">
                  Стоимость доставки: <span className="text-red-400 font-bold">{district?.deliveryFee || 100} ₽</span>
                </p>
              )}

              {giftActive && giftProducts.length > 0 && (
                <>
                  <div className={`flex items-center justify-between text-xs font-semibold pt-1 ${giftUnlocked ? 'text-amber-400' : 'text-slate-500'}`}>
                    <span className="flex items-center gap-1.5">
                      <Gift className="w-4 h-4 shrink-0" />
                      {giftUnlocked ? '🎁 Выберите подарок!' : `Подарок от ${giftMinAmount} ₽`}
                    </span>
                    {!giftUnlocked && <span className="text-slate-500">Ещё {remainingForGift} ₽</span>}
                  </div>

                  <AnimatePresence>
                    {giftUnlocked && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-3 gap-2 pt-1"
                      >
                        {giftProducts.map((gift) => {
                          const isChosen = selectedGiftItem?.id === `gift-${gift.id}`;
                          return (
                            <button
                              key={gift.id}
                              onClick={() => handleSelectGift(gift)}
                              className={`relative flex flex-col items-center p-2 rounded-xl border text-center transition ${
                                isChosen
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-amber-500/50'
                              }`}
                            >
                              {isChosen && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-slate-900 shrink-0" />
                                </span>
                              )}
                              {gift.imageUrl ? (
                                <img
                                  src={gift.imageUrl}
                                  alt={gift.title}
                                  className="w-8 h-8 rounded-lg object-cover mb-1"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                                  }}
                                />
                              ) : (
                                <span className="text-xl mb-1">🎁</span>
                              )}
                              <span className="text-[10px] font-bold leading-tight line-clamp-2">{gift.title}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Список товаров */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="p-4 bg-slate-800/60 rounded-full text-slate-500 mb-4 border border-slate-700">
                    <ShoppingBag className="w-12 h-12 stroke-[1.5] shrink-0" />
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
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover bg-slate-950 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-bold text-slate-100 truncate">{item.title}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-500 hover:text-red-400 p-1 transition shrink-0">
                          <Trash2 className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                      {item.variant && (
                        <span className="text-[11px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md font-medium border border-red-500/30">
                          {item.variant}
                        </span>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-extrabold text-slate-100">
                          {item.price === 0 ? <span className="text-amber-400">БЕСПЛАТНО</span> : `${item.price * item.quantity} ₽`}
                        </span>
                        {item.price > 0 && (
                          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 p-1 rounded-xl">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center">
                              <Minus className="w-3 h-3 shrink-0" />
                            </button>
                            <span className="text-xs font-black text-white px-1.5">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center">
                              <Plus className="w-3 h-3 shrink-0" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Промокод + итог */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900/95 space-y-4 shrink-0">
                {appliedPromo ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-emerald-300">
                          {appliedPromo.code} (-{appliedPromo.discountType === 'percent' ? `${appliedPromo.discountValue}%` : `${appliedPromo.discountValue} ₽`})
                        </span>
                        <p className="text-[10px] text-emerald-400/80">{appliedPromo.description}</p>
                      </div>
                    </div>
                    <button onClick={removePromoCode} className="text-xs text-slate-400 hover:text-red-400 underline">Отмена</button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="space-y-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                        placeholder="Введите промокод"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
                      />
                      <button
                        type="submit"
                        disabled={isApplyingPromo}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isApplyingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : 'Ввод'}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {promoError}
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
                    <span>Доставка{district ? ` (${district.name})` : ''}:</span>
                    <span className={deliveryFee === 0 ? 'text-emerald-400 font-bold' : 'font-bold'}>
                      {deliveryFee === 0 ? 'БЕСПЛАТНО' : `${deliveryFee} ₽`}
                    </span>
                  </div>
                  {selectedGiftItem && (
                    <div className="flex justify-between text-amber-400 font-semibold">
                      <span>🎁 Подарок:</span>
                      <span>0 ₽</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-3 border-t border-slate-800 text-base font-black text-slate-50">
                    <span>ИТОГО К ОПЛАТЕ:</span>
                    <span className="text-xl text-red-500">{totalAmount} ₽</span>
                  </div>
                </div>

                <button
                  onClick={handleOpenCheckout}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-red-500/25 flex items-center justify-center space-x-2 active:scale-95 transition"
                >
                  <span>Оформить заказ</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};