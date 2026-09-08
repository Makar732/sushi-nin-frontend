'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { MapPin, Phone, Clock, Search, ShoppingBag, Flame, X, CheckCircle2 } from 'lucide-react';

export const Header = () => {
  const {
    district,
    openDistrictModal,
    cart,
    setCartOpen,
    searchQuery,
    setSearchQuery,
    activeOrder,
    setOrderTrackerOpen
  } = useStore();

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 shadow-xl shadow-slate-950/40">
      <div className="hidden sm:block border-b border-slate-800/50 bg-slate-950/40 py-1.5 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              График работы: <span className="text-slate-200">11:00 - 22:40</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Бесплатная доставка от {district?.freeThreshold || 700} ₽
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {activeOrder && (
              <button
                onClick={() => setOrderTrackerOpen(true)}
                className="flex items-center gap-1.5 text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full hover:bg-sky-500/20 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" />
                Активный заказ #{activeOrder.orderNumber}
              </button>
            )}
            <a
              href="tel:+79308184040"
              className="flex items-center gap-1.5 text-slate-200 hover:text-red-400 transition font-semibold"
            >
              <Phone className="w-3.5 h-3.5 text-red-500" />
              +7 (930) 818-40-40
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center space-x-3 shrink-0">
            <a href="#" className="group flex items-center gap-2">
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-tr from-red-600 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-105 transition-transform duration-300">
                <Flame className="w-6 h-6 text-white fill-white/20 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center">
                  СУШИ<span className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]">НИН</span>
                </span>
                <span className="text-[10px] text-slate-400 -mt-1 font-medium tracking-widest uppercase">
                  г. Заволжье
                </span>
              </div>
            </a>

            <button
              onClick={openDistrictModal}
              className="hidden lg:flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-red-500/50 px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-200 transition shadow-sm group"
            >
              <MapPin className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
              <span>{district?.name || 'Заволжье'}</span>
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-medium">
                от {district?.freeThreshold || 700} ₽
              </span>
            </button>
          </div>

          <div className="flex-1 max-w-md relative hidden md:block">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или ингредиентам..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-800/60 border border-slate-700/60 focus:border-red-500/80 focus:bg-slate-800 text-slate-100 placeholder-slate-400 text-sm rounded-2xl outline-none transition duration-200 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={openDistrictModal}
            className="lg:hidden flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-200"
          >
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span className="max-w-[80px] truncate">{district?.name || 'Заволжье'}</span>
          </button>

          <a
            href="tel:+79308184040"
            className="sm:hidden p-2 bg-slate-800 border border-slate-700 rounded-xl text-red-400 hover:bg-slate-700"
            aria-label="Позвонить в СушиНин"
          >
            <Phone className="w-4 h-4" />
          </a>

          <button
            onClick={() => setCartOpen(true)}
            className="relative hidden sm:flex items-center space-x-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg shadow-red-500/25 transition-all duration-200 active:scale-95 group"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-slate-900 text-red-400 text-[11px] font-extrabold w-5 h-5 rounded-full border border-red-500 flex items-center justify-center">
                  {totalItemsCount}
                </span>
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase font-bold text-red-200 tracking-wider">Корзина</span>
              <span className="text-sm font-extrabold leading-none">{cartSubtotal} ₽</span>
            </div>
          </button>
        </div>

        <div className="mt-3 md:hidden">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск суши, пиццы, салатов..."
              className="w-full pl-9 pr-8 py-2 bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-400 text-xs rounded-xl outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};