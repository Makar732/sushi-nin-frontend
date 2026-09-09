'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import { Flame, MapPin, Phone, Clock, ShieldCheck, Heart, Award } from 'lucide-react';

export const Footer = () => {
  const { openDistrictModal, setOrderTrackerOpen, activeOrder } = useStore();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 mt-20 pt-12 pb-24 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-red-600 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-white">
              СУШИ<span className="text-red-500">НИН</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Служба доставки премиальных суши, пиццы, бургеров и блюд европейской кухни в городе Заволжье и окрестностях.
          </p>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400">
            <Award className="w-4 h-4" />
            <span>Только свежие ингредиенты</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider mb-4">
            Зона доставки
          </h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={openDistrictModal} className="hover:text-red-400 transition text-left">📍 Заволжье (бесплатно от 700 ₽)</button></li>
            <li><button onClick={openDistrictModal} className="hover:text-red-400 transition text-left">📍 Финский посёлок (бесплатно от 700 ₽)</button></li>
            <li><button onClick={openDistrictModal} className="hover:text-red-400 transition text-left">📍 10-й посёлок (бесплатно от 700 ₽)</button></li>
            <li><button onClick={openDistrictModal} className="hover:text-red-400 transition text-left">📍 Ясная поляна (бесплатно от 900 ₽)</button></li>
            <li><button onClick={openDistrictModal} className="hover:text-red-400 transition text-left">📍 Шеляухово (бесплатно от 1200 ₽)</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider mb-4">
            Контакты и график
          </h4>
          <div className="space-y-3 text-xs">
            <div className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">Ежедневно</span>
                <span>11:00 — 22:40</span>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Phone className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">Телефон заказа</span>
                <a href="tel:+79308184040" className="text-red-400 hover:underline font-bold text-sm">
                  +7 (930) 818-40-40
                </a>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider mb-4">
            Сервис
          </h4>
          <div className="space-y-2 text-xs">
            {activeOrder && (
              <button
                onClick={() => setOrderTrackerOpen(true)}
                className="w-full text-left p-3 bg-slate-900 border border-slate-800 rounded-xl text-sky-400 font-bold hover:bg-slate-800 transition"
              >
                🚴 Мой активный заказ #{activeOrder.orderNumber}
              </button>
            )}
            <button
              onClick={openDistrictModal}
              className="w-full text-left p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-bold hover:bg-slate-800 transition"
            >
              🗺️ Сменить район доставки
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
  <span>© {new Date().getFullYear()} «СушиНин» (г. Заволжье). Все права защищены.</span>
  <div className="flex items-center gap-4">
    <span className="flex items-center gap-1">
      Сделано с <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> для гурманов Заволжья
    </span>
    <a
      href="/admin"
      className="text-slate-700 hover:text-slate-500 transition"
      title="Панель администратора"
    >
      🔒
    </a>
  </div>
</div>
    </footer>
  );
};