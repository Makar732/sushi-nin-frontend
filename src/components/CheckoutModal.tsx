'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import confetti from 'canvas-confetti';
import { X, Truck, Store, CreditCard, Banknote, Smartphone, CheckCircle2, Loader2, Sparkles, Users, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const checkoutSchema = z.object({
  name: z.string().min(2, 'Укажите ваше имя'),
  phone: z.string().min(18, 'Введите корректный номер телефона'),
  deliveryType: z.enum(['delivery', 'pickup']),
  street: z.string().optional(),
  house: z.string().optional(),
  flat: z.string().optional(),
  comment: z.string().optional(),
  paymentMethod: z.enum(['Картой курьеру', 'Наличные', 'СБП онлайн']),
  timeType: z.enum(['now', 'specific']),
  specificTime: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const d = digits.startsWith('7') ? digits.slice(1) : digits.startsWith('8') ? digits.slice(1) : digits;
  let result = '+7';
  if (d.length > 0) result += ' (' + d.slice(0, 3);
  if (d.length >= 3) result += ') ' + d.slice(3, 6);
  if (d.length >= 6) result += '-' + d.slice(6, 8);
  if (d.length >= 8) result += '-' + d.slice(8, 10);
  return result;
}

export const CheckoutModal = () => {
  const {
    cart,
    isCheckoutOpen,
    setCheckoutOpen,
    district,
    appliedPromo,
    clearCart,
    setActiveOrder,
    setOrderTrackerOpen
  } = useStore();

  const [isLoading, setIsLoading] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  const [storeStatus, setStoreStatus] = useState<{
    isOpen: boolean;
    openTime: string;
    closeTime: string;
    isManualClosed: boolean;
    manualCloseReason: string;
  } | null>(null);

  // Проверяем статус заведения при открытии модалки
  useEffect(() => {
    if (!isCheckoutOpen) return;
    fetch('/api/store-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStoreStatus(data);
      })
      .catch(() => {});
  }, [isCheckoutOpen]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeThreshold = district?.freeThreshold || 700;
  const discountAmount = appliedPromo
    ? appliedPromo.discountType === 'fixed'
      ? Math.min(appliedPromo.discountValue, subtotal)
      : Math.round((subtotal * appliedPromo.discountValue) / 100)
    : 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      phone: '',
      deliveryType: 'delivery',
      paymentMethod: 'Картой курьеру',
      timeType: 'now',
      street: '',
      house: '',
      flat: '',
      comment: '',
    },
  });

  const deliveryType = watch('deliveryType');
  const timeType = watch('timeType');
  const phoneValue = watch('phone');

  const deliveryFee = deliveryType === 'pickup' ? 0 : (subtotal >= freeThreshold ? 0 : (district?.deliveryFee || 100));
  const finalTotal = subtotal - discountAmount + deliveryFee;

  if (!isCheckoutOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('phone', formatPhone(e.target.value), { shouldValidate: true });
  };

  const handlePhoneFocus = () => {
    if (!phoneValue) setValue('phone', '+7 (');
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^[a-zA-Zа-яА-Я]$/.test(e.key)) e.preventDefault();
  };

  const isClosed = storeStatus && !storeStatus.isOpen;

  const onSubmit = async (data: CheckoutFormData) => {
    if (isClosed) return;
    setIsLoading(true);

    const generatedOrderId = `SN-${Math.floor(100000 + Math.random() * 900000)}`;
    const fullAddress =
      data.deliveryType === 'pickup'
        ? 'Самовывоз из ресторана (г. Заволжье)'
        : `ул. ${data.street || '-'}, д. ${data.house || '-'}${data.flat ? `, кв./офис ${data.flat}` : ''}`;

    const formattedTime =
      data.timeType === 'now'
        ? 'Ближайшее (30-45 мин)'
        : `К определенному времени: ${data.specificTime || 'не указано'}`;

    const payload = {
      orderId: generatedOrderId,
      customer: { name: data.name, phone: data.phone, comment: data.comment },
      items: cart,
      totalAmount: subtotal,
      deliveryFee,
      discount: discountAmount,
      promoCode: appliedPromo?.code || null,
      zone: district?.name || 'Заволжье',
      paymentMethod: data.paymentMethod,
      deliveryType: data.deliveryType,
      address: fullAddress,
      time: formattedTime,
    };

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch {}
        setOrderSuccessId(generatedOrderId);
        setActiveOrder({
          orderNumber: generatedOrderId,
          customerName: data.name,
          phone: data.phone,
          zone: district?.name,
          totalAmount: finalTotal,
          address: fullAddress,
          time: formattedTime,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        });
        clearCart();
      } else {
        alert('Ошибка при отправке заказа: ' + json.error);
      }
    } catch (err: any) {
      alert('Сетевая ошибка при оформлении: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = () => {
    setOrderSuccessId(null);
    setCheckoutOpen(false);
    setOrderTrackerOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-50 tracking-tight">Оформление заказа</h2>
                <p className="text-xs text-slate-400">«СушиНин» — Доставка еды в Заволжье</p>
              </div>
            </div>
            <button onClick={() => setCheckoutOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Баннер закрытия заведения */}
          {isClosed && (
            <div className="px-5 pt-4 shrink-0">
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-black text-red-300">
                    {storeStatus?.isManualClosed
                      ? '🔴 Заведение временно не принимает заказы'
                      : `🕐 Мы работаем с ${storeStatus?.openTime} до ${storeStatus?.closeTime} (МСК)`}
                  </p>
                  {storeStatus?.isManualClosed && storeStatus.manualCloseReason && (
                    <p className="text-xs text-red-400/80 mt-1">{storeStatus.manualCloseReason}</p>
                  )}
                  {!storeStatus?.isManualClosed && (
                    <p className="text-xs text-slate-400 mt-1">
                      Сейчас не рабочее время. Оформление заказов недоступно.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success Screen */}
          {orderSuccessId ? (
            <div className="p-8 sm:p-12 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Заказ успешно принят!
                </span>
                <h3 className="text-3xl font-black text-white mt-3">Заказ #{orderSuccessId}</h3>
                <p className="text-sm text-slate-300 max-w-md mx-auto mt-2">
                  Мы уже передали ваш заказ на кухню! Менеджер свяжется с вами при необходимости.
                </p>
              </div>
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 max-w-sm mx-auto text-xs text-slate-300 space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Район:</span>
                  <span className="font-bold text-slate-100">{district?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Сумма к оплате:</span>
                  <span className="font-bold text-red-400 text-sm">{finalTotal} ₽</span>
                </div>
              </div>
              <button onClick={handleDone} className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-red-500 text-white font-extrabold rounded-2xl shadow-lg shadow-red-500/25 hover:from-red-500 hover:to-red-600 transition">
                Отслеживать статус заказа
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto custom-scrollbar p-5 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Способ получения */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                      1. Способ получения
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setValue('deliveryType', 'delivery')}
                        className={`p-3.5 rounded-2xl border flex items-center space-x-3 transition ${deliveryType === 'delivery' ? 'bg-red-600/20 border-red-500 text-slate-100' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                        <Truck className={deliveryType === 'delivery' ? 'text-red-400' : ''} />
                        <div className="text-left">
                          <span className="font-extrabold text-sm block">Доставка</span>
                          <span className="text-[11px] text-slate-400">{district?.name}</span>
                        </div>
                      </button>
                      <button type="button" onClick={() => setValue('deliveryType', 'pickup')}
                        className={`p-3.5 rounded-2xl border flex items-center space-x-3 transition ${deliveryType === 'pickup' ? 'bg-red-600/20 border-red-500 text-slate-100' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                        <Store className={deliveryType === 'pickup' ? 'text-red-400' : ''} />
                        <div className="text-left">
                          <span className="font-extrabold text-sm block">Самовывоз</span>
                          <span className="text-[11px] text-slate-400">Скидка и бесплатно</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Контактные данные */}
                  <div className="space-y-4">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                      2. Ваши контактные данные
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input {...register('name')} placeholder="Имя *"
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500" />
                        {errors.name && <span className="text-[11px] text-red-400 mt-1 block">{errors.name.message}</span>}
                      </div>
                      <div>
                        <input
                          {...register('phone')}
                          value={phoneValue}
                          onChange={handlePhoneChange}
                          onFocus={handlePhoneFocus}
                          onKeyDown={handlePhoneKeyDown}
                          placeholder="+7 (___) ___-__-__"
                          inputMode="tel"
                          maxLength={18}
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
                        />
                        {errors.phone && <span className="text-[11px] text-red-400 mt-1 block">{errors.phone.message}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Адрес */}
                  {deliveryType === 'delivery' && (
                    <div className="space-y-3">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                        3. Адрес доставки ({district?.name})
                      </label>
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-8">
                          <input {...register('street')} placeholder="Улица *"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500" />
                        </div>
                        <div className="col-span-4">
                          <input {...register('house')} placeholder="Дом *"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500" />
                        </div>
                      </div>
                      <input {...register('flat')} placeholder="Квартира / подъезд / этаж (опционально)"
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500" />
                    </div>
                  )}

                  {/* Время */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                      4. Время доставки
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <button type="button" onClick={() => setValue('timeType', 'now')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${timeType === 'now' ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-slate-800/60 border-slate-700 text-slate-400'}`}>
                        ⚡ Ближайшее (30-45 мин)
                      </button>
                      <button type="button" onClick={() => setValue('timeType', 'specific')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition ${timeType === 'specific' ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-slate-800/60 border-slate-700 text-slate-400'}`}>
                        ⏰ К определенному времени
                      </button>
                    </div>
                    {timeType === 'specific' && (
                      <input {...register('specificTime')} placeholder="Например: к 19:30"
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400" />
                    )}
                  </div>

                  {/* Оплата */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                      5. Способ оплаты
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'Картой курьеру', icon: CreditCard },
                        { id: 'Наличные', icon: Banknote },
                        { id: 'СБП онлайн', icon: Smartphone },
                      ].map((method) => {
                        const Icon = method.icon;
                        const isSelected = watch('paymentMethod') === method.id;
                        return (
                          <button key={method.id} type="button" onClick={() => setValue('paymentMethod', method.id as any)}
                            className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${isSelected ? 'bg-red-600/20 border-red-500 text-slate-100 font-bold' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                            <Icon className="w-4 h-4 text-red-400" />
                            <span className="text-xs">{method.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Сарафанная скидка */}
                  <div>
                    <a href="https://t.me/sushi_nin_promo_bot" target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-500/60 rounded-2xl text-sky-300 font-bold text-sm transition">
                      <Users className="w-4 h-4" />
                      Получить сарафанную скидку
                    </a>
                    <p className="text-[11px] text-slate-500 text-center mt-1.5">
                      Поделитесь с другом → получите скидку через @sushi_nin_promo_bot
                    </p>
                  </div>

                  {/* Комментарий */}
                  <div>
                    <textarea {...register('comment')} placeholder="Комментарий к заказу (приборы, аллергии, соусы...)" rows={2}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500" />
                  </div>
                </div>

                {/* Right Column: Summary */}
                <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-red-400" /> Состав заказа ({cart.length})
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 truncate pr-2">
                            <span className="font-extrabold text-red-400">{item.quantity}×</span>
                            <span className="text-slate-200 truncate">{item.title}</span>
                            {item.variant && <span className="text-[10px] text-slate-400">({item.variant})</span>}
                          </div>
                          <span className="font-bold text-slate-100 shrink-0">{item.price * item.quantity} ₽</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Подытог:</span>
                        <span className="font-bold">{subtotal} ₽</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-400 font-semibold">
                          <span>Скидка по промокоду:</span>
                          <span>-{discountAmount} ₽</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Доставка ({district?.name}):</span>
                        <span className={deliveryFee === 0 ? 'text-emerald-400 font-bold' : 'font-bold'}>
                          {deliveryFee === 0 ? 'БЕСПЛАТНО' : `${deliveryFee} ₽`}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline text-slate-50">
                        <span className="font-extrabold text-sm">ИТОГО К ОПЛАТЕ:</span>
                        <span className="text-2xl font-black text-red-500">{finalTotal} ₽</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !!isClosed}
                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-red-500/25 flex items-center justify-center space-x-2 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>Отправляем заказ...</span></>
                    ) : isClosed ? (
                      <><AlertTriangle className="w-5 h-5" /><span>Заведение закрыто</span></>
                    ) : (
                      <span>Подтвердить и оплатить ({finalTotal} ₽)</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};