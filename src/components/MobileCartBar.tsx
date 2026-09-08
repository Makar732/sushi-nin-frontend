'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const MobileCartBar = () => {
  const { cart, setCartOpen } = useStore();

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (totalItemsCount === 0) return null;

  return (
    <div className="sm:hidden fixed bottom-4 left-4 right-4 z-40">
      <button
        onClick={() => setCartOpen(true)}
        className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white p-4 rounded-2xl shadow-2xl shadow-red-500/40 border border-red-400/30 flex items-center justify-between active:scale-95 transition-transform"
      >
        <div className="flex items-center space-x-3">
          <div className="relative p-2 bg-white/10 rounded-xl">
            <ShoppingBag className="w-5 h-5 text-white" />
            <span className="absolute -top-2 -right-2 bg-slate-900 text-red-400 text-[10px] font-black w-5 h-5 rounded-full border border-red-500 flex items-center justify-center">
              {totalItemsCount}
            </span>
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-red-100 block">Ваша корзина</span>
            <span className="text-lg font-black">{cartSubtotal} ₽</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 font-black text-xs uppercase tracking-wider bg-white/20 px-3 py-2 rounded-xl">
          <span>Оформить</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
};
