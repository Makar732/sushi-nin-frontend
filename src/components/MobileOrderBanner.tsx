'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Timer, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useElapsedTime } from './OrderTrackerModal';

export const MobileOrderBanner = () => {
  const { activeOrder, setOrderTrackerOpen } = useStore();
  const elapsed = useElapsedTime(activeOrder?.createdAt ?? null);

  if (!activeOrder) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="sm:hidden px-3 pt-2 pb-1 z-30"
      >
        <button
          onClick={() => setOrderTrackerOpen(true)}
          className="w-full flex items-center justify-between bg-sky-900/95 border border-sky-500/40 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-xl shadow-sky-900/30 active:scale-95 transition"
        >
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-sky-400 animate-pulse shrink-0" />
            <div className="text-left">
              <p className="text-[10px] text-sky-400 font-bold uppercase tracking-wider leading-none">
                Активный заказ
              </p>
              <p className="text-xs font-black text-white leading-tight">
                #{activeOrder.orderNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sky-300 font-black text-sm">{elapsed}</span>
            <ChevronRight className="w-4 h-4 text-sky-400" />
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};