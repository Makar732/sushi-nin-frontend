'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Sparkles, Gift, Tag, ArrowRight, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';

export const PromoBanner = () => {
  const { applyPromoCode, district } = useStore();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const promos = [
    {
      id: 1,
      title: "Скидка 10% на первый заказ!",
      code: "SUSHIMIN10",
      subtitle: "Вводите промокод при оформлении корзины",
      badge: "ПРОМОКОД",
      bgGradient: "from-red-900/60 via-slate-900 to-slate-900",
      accentColor: "border-red-500/40 text-red-400",
    },
    {
      id: 2,
      title: `Бесплатная доставка по району ${district?.name || 'Заволжье'}`,
      code: `ОТ ${district?.freeThreshold || 700} ₽`,
      subtitle: "Автоматический расчет бесплатной доставки",
      badge: "АКЦИЯ",
      bgGradient: "from-sky-950/70 via-slate-900 to-slate-900",
      accentColor: "border-sky-500/40 text-sky-400",
    },
    {
      id: 3,
      title: "Скидка 15% на заказы от 2000 ₽!",
      code: "ROLLFREE",
      subtitle: "Отличный повод заказать большой сет для всей компании",
      badge: "ВЫГОДА",
      bgGradient: "from-emerald-950/70 via-slate-900 to-slate-900",
      accentColor: "border-emerald-500/40 text-emerald-400",
    },
  ];

  const handleCopyCode = (code: string) => {
    if (code.startsWith("ОТ")) return;
    applyPromoCode(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 mt-4 sm:mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {promos.map((p) => (
          <div
            key={p.id}
            className={`relative overflow-hidden bg-gradient-to-r ${p.bgGradient} border border-slate-800 rounded-2xl p-5 shadow-lg group hover:border-slate-700 transition duration-300`}
          >
            {/* Background glowing circle */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-slate-900/80 ${p.accentColor}`}>
                    {p.badge}
                  </span>
                  <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition" />
                </div>
                <h3 className="text-lg font-black text-slate-100 tracking-tight leading-snug">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{p.subtitle}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => handleCopyCode(p.code)}
                  className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 transition active:scale-95"
                >
                  <Tag className="w-3.5 h-3.5 text-red-400" />
                  <span>{p.code}</span>
                  {copiedCode === p.code && (
                    <span className="text-[10px] text-emerald-400 font-normal">Применён!</span>
                  )}
                </button>

                <span className="text-xs font-semibold text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Применить <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
