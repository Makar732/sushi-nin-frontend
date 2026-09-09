'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Sparkles, Tag, ArrowRight, Loader2 } from 'lucide-react';

interface BannerItem {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  code?: string | null;
  bgGradient: string;
  accentColor: string;
}

export const PromoBanner = () => {
  const { applyPromoCode, cart } = useStore();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/promotions')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.banners)) {
          setBanners(data.banners);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || banners.length === 0) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleApply = async (banner: BannerItem) => {
    if (!banner.code) return;
    setApplyingCode(banner.code);
    const res = await applyPromoCode(banner.code, subtotal);
    setApplyingCode(null);
    if (res.success) {
      setAppliedCode(banner.code);
      setTimeout(() => setAppliedCode(null), 2500);
    } else {
      alert(res.message);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 mt-4 sm:mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {banners.map((p) => (
          <div
            key={p.id}
            className={`relative overflow-hidden bg-gradient-to-r ${p.bgGradient} border border-slate-800 rounded-2xl p-5 shadow-lg group hover:border-slate-700 transition duration-300`}
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-slate-900/80 ${p.accentColor}`}>
                    {p.badge}
                  </span>
                  <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition" />
                </div>
                <h3 className="text-lg font-black text-slate-100 tracking-tight leading-snug">{p.title}</h3>
                {p.subtitle && <p className="text-xs text-slate-400 mt-1">{p.subtitle}</p>}
              </div>
              {p.code && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleApply(p)}
                    disabled={applyingCode === p.code}
                    className="flex items-center space-x-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 transition active:scale-95 disabled:opacity-60"
                  >
                    <Tag className="w-3.5 h-3.5 text-red-400" />
                    <span>{p.code}</span>
                    {applyingCode === p.code && <Loader2 className="w-3 h-3 animate-spin" />}
                    {appliedCode === p.code && (
                      <span className="text-[10px] text-emerald-400 font-normal">Применён!</span>
                    )}
                  </button>
                  <span className="text-xs font-semibold text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Применить <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};