'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { X, CheckCircle2, ChefHat, Bike, Home, Sparkles, Phone, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function useElapsedTime(createdAt: string | null, stopped: boolean = false) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!createdAt) return;
    const start = new Date(createdAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    if (stopped) return; // Таймер остановлен — не запускаем интервал
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [createdAt, stopped]);

  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const STATUS_MAP: Record<string, number> = {
  new: 0,
  confirmed: 0,
  cooking: 1,
  delivering: 2,
  completed: 3,
};

const STEPS = [
  { id: 'confirmed', label: 'Заказ принят', desc: 'Передан на кухню «СушиНин»', icon: CheckCircle2 },
  { id: 'cooking', label: 'Готовится', desc: 'Шеф-повар создает ваш шедевр', icon: ChefHat },
  { id: 'delivering', label: 'В пути', desc: 'Курьер мчит к вашему адресу', icon: Bike },
  { id: 'completed', label: 'Доставлен', desc: 'Приятного аппетита!', icon: Home },
];

export const OrderTrackerModal = () => {
  const { activeOrder, isOrderTrackerOpen, setOrderTrackerOpen, setActiveOrder } = useStore();
  const [liveStatus, setLiveStatus] = useState<string>(activeOrder?.status || 'confirmed');

  const isCompleted = liveStatus === 'completed';

  // Таймер останавливается когда статус = completed
  const elapsed = useElapsedTime(activeOrder?.createdAt ?? null, isCompleted);

  useEffect(() => {
    if (!activeOrder?.orderNumber) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(
          `/api/order/status?orderNumber=${activeOrder.orderNumber}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (data.success && data.status) {
          setLiveStatus(data.status);
          setActiveOrder({ ...activeOrder, status: data.status });
        }
      } catch {}
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [activeOrder?.orderNumber]);

  if (!isOrderTrackerOpen || !activeOrder) return null;

  const currentStepIndex = STATUS_MAP[liveStatus] ?? 0;

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
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>

          <div className="p-5 sm:p-8 space-y-5">
            <button
              onClick={() => setOrderTrackerOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

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

            {/* Таймер — показываем всегда, но при completed он заморожен */}
            <div className={`flex items-center justify-center gap-3 p-4 border rounded-2xl ${
              isCompleted
                ? 'bg-emerald-950/40 border-emerald-500/30'
                : 'bg-slate-950/80 border-slate-800'
            }`}>
              <Timer className={`w-5 h-5 shrink-0 ${isCompleted ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`} />
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-0.5">
                  {isCompleted ? 'Время доставки составило' : 'Прошло с момента заказа'}
                </p>
                <span className={`text-3xl font-black font-mono tracking-widest ${
                  isCompleted ? 'text-emerald-400' : 'text-white'
                }`}>
                  {elapsed}
                </span>
              </div>
            </div>

            {/* Статус-бейдж */}
            <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-2xl border text-sm font-bold ${
              isCompleted
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
            }`}>
              <span className={`w-2 h-2 rounded-full inline-block ${
                isCompleted ? 'bg-emerald-400' : 'bg-sky-400 animate-pulse'
              }`} />
              {isCompleted ? '✅ Ваш заказ доставлен!' : '🔄 Обновляется каждые 5 сек'}
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
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.id} className="relative flex items-start space-x-3">
                    <div className={`absolute -left-[27px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isDone
                        ? 'bg-red-600 border-red-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-600'
                    } ${isCurrent && !isCompleted ? 'ring-2 ring-red-500/40 ring-offset-1 ring-offset-slate-900' : ''}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div>
                      <h4 className={`font-bold leading-tight transition-all duration-300 ${
                        isCurrent && !isCompleted
                          ? 'text-red-400 text-base font-extrabold'
                          : isDone
                          ? 'text-slate-200 text-sm'
                          : 'text-slate-500 text-sm'
                      }`}>
                        {step.label}
                        {isCurrent && !isCompleted && (
                          <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/30 font-bold animate-pulse">
                            сейчас
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {isCompleted && (
              <button
                onClick={() => setOrderTrackerOpen(false)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-black rounded-2xl text-sm shadow-lg shadow-emerald-500/25 transition active:scale-95"
              >
                🎉 Приятного аппетита!
              </button>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Возник вопрос?</span>
              <a href="tel:+79308184040" className="flex items-center gap-1.5 font-bold text-red-400 hover:underline">
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