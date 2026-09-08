'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { X, CheckCircle2, Clock, ChefHat, Bike, Home, Sparkles, MapPin, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OrderTrackerModal = () => {
  const { activeOrder, isOrderTrackerOpen, setOrderTrackerOpen } = useStore();

  if (!isOrderTrackerOpen || !activeOrder) return null;

  const steps = [
    { id: 'confirmed', label: 'Заказ принят', desc: 'Передан на кухню «СушиМин»', icon: CheckCircle2 },
    { id: 'cooking', label: 'Готовится', desc: 'Шеф-повар создает ваш шедевр', icon: ChefHat },
    { id: 'delivering', label: 'В пути', desc: 'Курьер мчит к вашему адресу', icon: Bike },
    { id: 'completed', label: 'Доставлен', desc: 'Приятного аппетита!', icon: Home },
  ];

  const currentStepIndex = 1; // Simulated stage for demo tracker

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6"
        >
          <button
            onClick={() => setOrderTrackerOpen(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                Живой статус заказа
              </span>
              <h3 className="text-2xl font-black text-slate-50">
                Заказ #{activeOrder.orderNumber}
              </h3>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Получатель:</span>
              <span className="font-bold text-slate-100">{activeOrder.customerName} ({activeOrder.phone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Адрес:</span>
              <span className="font-bold text-slate-100">{activeOrder.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Сумма:</span>
              <span className="font-extrabold text-red-400">{activeOrder.totalAmount} ₽</span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-4 relative pl-4 border-l-2 border-slate-800 my-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isDone = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.id} className="relative flex items-start space-x-4">
                  <div
                    className={`absolute -left-[25px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isDone
                        ? 'bg-red-600 border-red-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-red-400 font-extrabold text-base'
                          : isDone
                          ? 'text-slate-200'
                          : 'text-slate-500'
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

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Возник вопрос по заказу?</span>
            <a
              href="tel:+79308184040"
              className="flex items-center gap-1 font-bold text-red-400 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" /> +7 (930) 818-40-40
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
