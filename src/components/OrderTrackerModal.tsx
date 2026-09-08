'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { X, CheckCircle2, ChefHat, Bike, Home, Sparkles, Phone, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function useElapsedTime(createdAt: string | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!createdAt) return;
    const start = new Date(createdAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const OrderTrackerModal = () => {
  const { activeOrder, isOrderTrackerOpen, setOrderTrackerOpen } = useStore();
  const elapsed = useElapsedTime(activeOrder?.createdAt ?? null);

  if (!isOrderTrackerOpen || !activeOrder) return null;

  const steps = [
    { id: 'confirmed', label: 'Заказ принят', desc: 'Передан на кухню «СушиНин»', icon: CheckCircle2 },
    { id: 'cooking', label: 'Готовится', desc: 'Шеф-повар создает ваш шедевр', icon: ChefHat },
    { id: 'delivering', label: 'В пути', desc: 'Курьер мчит к вашему адресу', icon: Bike },
    { id: 'completed', label: 'Доставлен', desc: 'Приятного аппетита!', icon: Home },
  ];

  const currentStepIndex = 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full sm:max-w-lg bg-slate-900 border border-slate-800 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-y-auto max-h-[92vh]"
        >
          {/* Ручка для мобилки */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>

          <div className="p-5 sm:p-8 space-y-5">
            {/* Закрыть */}
            <button
              onClick={() => setOrderTrackerOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Заголовок */}
            <div className="flex items-center space-x-3 pr-8">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  Живой статус заказа
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-50 leading-tight">
                  Заказ #{activeOrder.orderNumber}
                </h3>
              </div>
            </div>

            {/* Таймер */}
            <div className="flex items-center justify-center gap-3 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
              <Timer className="w-5 h-5 text-red-400 animate-pulse shrink-0" />
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-0.5">Прошло с момента заказа</p>
                <span className="text-3xl font-black text-white font-mono tracking-widest">
                  {elapsed}
                </span>
              </div>
            </div>

            {/* Детали заказа */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">Получатель:</span>
                <span className="font-bold text-slate-100 text-right">
                  {activeOrder.customerName} ({activeOrder.phone})
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">Адрес:</span>
                <span className="font-bold text-slate-100 text-right">{activeOrder.address}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 shrink-0">Сумма:</span>
                <span className="font-extrabold text-red-400">{activeOrder.totalAmount} ₽</span>
              </div>
            </div>

            {/* Stepper */}
            <div className="relative pl-5 border-l-2 border-slate-800 space-y-4">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.id} className="relative flex items-start space-x-3">
                    <div
                      className={`absolute -left-[27px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isDone
                          ? 'bg-red-600 border-red-400 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-600'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                    </div>
                    <div>
                      <h4
                        className={`font-bold leading-tight ${
                          isCurrent
                            ? 'text-red-400 text-base font-extrabold'
                            : isDone
                            ? 'text-slate-200 text-sm'
                            : 'text-slate-500 text-sm'
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Телефон */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Возник вопрос?</span>
              <a
                href="tel:+79308184040"
                className="flex items-center gap-1.5 font-bold text-red-400 hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                +7 (930) 818-40-40
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};