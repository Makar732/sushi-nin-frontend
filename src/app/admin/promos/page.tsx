'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Gift, Tag, Megaphone, Plus, Edit3, Trash2, Save, X,
  Loader2, CheckCircle2, XCircle, Search, Percent, Coins
} from 'lucide-react';

// ==================== ТИПЫ ====================

interface AdminProductLite {
  id: string;
  title: string;
  category: string;
  price: number;
  imageUrl?: string | null;
  inStock: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minAmount: number;
  usageLimit: number;
  usedCount: number;
  description: string;
  active: boolean;
}

interface BannerItem {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  code: string | null;
  bgGradient: string;
  accentColor: string;
  sortOrder: number;
  active: boolean;
}

const GRADIENT_PRESETS = [
  { label: 'Красный', bg: 'from-red-900/60 via-slate-900 to-slate-900', accent: 'border-red-500/40 text-red-400' },
  { label: 'Голубой', bg: 'from-sky-950/70 via-slate-900 to-slate-900', accent: 'border-sky-500/40 text-sky-400' },
  { label: 'Зелёный', bg: 'from-emerald-950/70 via-slate-900 to-slate-900', accent: 'border-emerald-500/40 text-emerald-400' },
  { label: 'Янтарный', bg: 'from-amber-950/70 via-slate-900 to-slate-900', accent: 'border-amber-500/40 text-amber-400' },
  { label: 'Фиолетовый', bg: 'from-purple-950/70 via-slate-900 to-slate-900', accent: 'border-purple-500/40 text-purple-400' },
];

const EMPTY_PROMO_FORM = {
  code: '',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: '',
  minAmount: '',
  usageLimit: '',
  description: '',
  active: true,
};

const EMPTY_BANNER_FORM = {
  title: '',
  subtitle: '',
  badge: 'АКЦИЯ',
  code: '',
  presetIndex: 0,
  sortOrder: '0',
  active: true,
};

export default function AdminPromosPage() {
  const [tab, setTab] = useState<'gifts' | 'promocodes' | 'banners'>('gifts');

  // ==================== ПОДАРКИ ====================
  const [giftMinAmount, setGiftMinAmount] = useState('2000');
  const [giftActive, setGiftActive] = useState(true);
  const [giftProductIds, setGiftProductIds] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<AdminProductLite[]>([]);
  const [giftLoading, setGiftLoading] = useState(true);
  const [giftSaving, setGiftSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const fetchGiftData = useCallback(async () => {
    setGiftLoading(true);
    try {
      const [giftRes, productsRes] = await Promise.all([
        fetch('/api/admin/gifts', { cache: 'no-store' }),
        fetch('/api/admin/products', { cache: 'no-store' }),
      ]);
      const giftData = await giftRes.json();
      const productsData = await productsRes.json();

      if (giftData.success) {
        setGiftMinAmount(String(giftData.settings.minAmount));
        setGiftActive(giftData.settings.active);
        setGiftProductIds(giftData.settings.productIds || []);
      }
      if (productsData.success) {
        setAllProducts(productsData.products);
      }
    } catch {}
    setGiftLoading(false);
  }, []);

  useEffect(() => { fetchGiftData(); }, [fetchGiftData]);

  const toggleGiftProduct = (id: string) => {
    setGiftProductIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const saveGiftSettings = async () => {
    setGiftSaving(true);
    try {
      await fetch('/api/admin/gifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minAmount: Number(giftMinAmount) || 0,
          active: giftActive,
          productIds: giftProductIds,
        }),
      });
    } catch {}
    setGiftSaving(false);
  };

  const filteredProducts = allProducts.filter((p) =>
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ==================== ПРОМОКОДЫ ====================
  const [promocodes, setPromocodes] = useState<PromoCode[]>([]);
  const [promoLoading, setPromoLoading] = useState(true);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [promoForm, setPromoForm] = useState(EMPTY_PROMO_FORM);
  const [promoSaving, setPromoSaving] = useState(false);
  const [togglingPromoId, setTogglingPromoId] = useState<string | null>(null);

  const fetchPromocodes = useCallback(async () => {
    setPromoLoading(true);
    try {
      const res = await fetch('/api/admin/promocodes', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setPromocodes(data.promocodes);
    } catch {}
    setPromoLoading(false);
  }, []);

  useEffect(() => { fetchPromocodes(); }, [fetchPromocodes]);

  const openCreatePromo = () => {
    setEditingPromo(null);
    setPromoForm(EMPTY_PROMO_FORM);
    setIsPromoModalOpen(true);
  };

  const openEditPromo = (promo: PromoCode) => {
    setEditingPromo(promo);
    setPromoForm({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: String(promo.discountValue),
      minAmount: String(promo.minAmount),
      usageLimit: String(promo.usageLimit),
      description: promo.description,
      active: promo.active,
    });
    setIsPromoModalOpen(true);
  };

  const savePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoSaving(true);
    try {
      const payload = {
        code: promoForm.code,
        discountType: promoForm.discountType,
        discountValue: Number(promoForm.discountValue),
        minAmount: promoForm.minAmount ? Number(promoForm.minAmount) : 0,
        usageLimit: promoForm.usageLimit ? Number(promoForm.usageLimit) : 0,
        description: promoForm.description,
        active: promoForm.active,
      };

      if (editingPromo) {
        await fetch('/api/admin/promocodes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingPromo.id, ...payload }),
        });
      } else {
        await fetch('/api/admin/promocodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setIsPromoModalOpen(false);
      await fetchPromocodes();
    } catch {}
    setPromoSaving(false);
  };

  const togglePromoActive = async (promo: PromoCode) => {
    setTogglingPromoId(promo.id);
    setPromocodes((prev) => prev.map((p) => (p.id === promo.id ? { ...p, active: !p.active } : p)));
    try {
      await fetch('/api/admin/promocodes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: promo.id, active: !promo.active }),
      });
    } catch {
      fetchPromocodes();
    }
    setTogglingPromoId(null);
  };

  const deletePromo = async (id: string) => {
    if (!confirm('Удалить промокод?')) return;
    setPromocodes((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/admin/promocodes?id=${id}`, { method: 'DELETE' });
  };

  // ==================== БАННЕРЫ ====================
  const [bannersList, setBannersList] = useState<BannerItem[]>([]);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [bannerForm, setBannerForm] = useState(EMPTY_BANNER_FORM);
  const [bannerSaving, setBannerSaving] = useState(false);

  const fetchBanners = useCallback(async () => {
    setBannerLoading(true);
    try {
      const res = await fetch('/api/admin/banners', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setBannersList(data.banners);
    } catch {}
    setBannerLoading(false);
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const openCreateBanner = () => {
    setEditingBanner(null);
    setBannerForm(EMPTY_BANNER_FORM);
    setIsBannerModalOpen(true);
  };

  const openEditBanner = (banner: BannerItem) => {
    setEditingBanner(banner);
    const presetIndex = GRADIENT_PRESETS.findIndex((g) => g.bg === banner.bgGradient);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle,
      badge: banner.badge,
      code: banner.code || '',
      presetIndex: presetIndex >= 0 ? presetIndex : 0,
      sortOrder: String(banner.sortOrder),
      active: banner.active,
    });
    setIsBannerModalOpen(true);
  };

  const saveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerSaving(true);
    try {
      const preset = GRADIENT_PRESETS[bannerForm.presetIndex];
      const payload = {
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        badge: bannerForm.badge,
        code: bannerForm.code || null,
        bgGradient: preset.bg,
        accentColor: preset.accent,
        sortOrder: Number(bannerForm.sortOrder) || 0,
        active: bannerForm.active,
      };

      if (editingBanner) {
        await fetch('/api/admin/banners', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBanner.id, ...payload }),
        });
      } else {
        await fetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setIsBannerModalOpen(false);
      await fetchBanners();
    } catch {}
    setBannerSaving(false);
  };

  const toggleBannerActive = async (banner: BannerItem) => {
    setBannersList((prev) => prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b)));
    try {
      await fetch('/api/admin/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: banner.id, active: !banner.active }),
      });
    } catch {
      fetchBanners();
    }
  };

  const deleteBanner = async (id: number) => {
    if (!confirm('Удалить баннер?')) return;
    setBannersList((prev) => prev.filter((b) => b.id !== id));
    await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
  };

  // ==================== UI ====================

  const TABS = [
    { id: 'gifts' as const, label: 'Подарки', icon: Gift },
    { id: 'promocodes' as const, label: 'Промокоды', icon: Tag },
    { id: 'banners' as const, label: 'Баннеры', icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">🎁 Маркетинг & Подарки</h1>
        <p className="text-xs text-slate-400 mt-0.5">Подарки за чек, промокоды и рекламные баннеры</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-slate-800 pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                active
                  ? 'bg-red-600/20 border border-red-500/40 text-red-400'
                  : 'bg-slate-800/60 border border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ==================== TAB: ПОДАРКИ ==================== */}
      {tab === 'gifts' && (
        <div className="space-y-5">
          {giftLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-400" />
            </div>
          ) : (
            <>
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white">Конструктор подарка за чек</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Клиент увидит выбор подарков в корзине при достижении суммы
                    </p>
                  </div>
                  <button
                    onClick={() => setGiftActive(!giftActive)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition ${
                      giftActive
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-400 border-slate-600'
                    }`}
                  >
                    {giftActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {giftActive ? 'Акция активна' : 'Акция отключена'}
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Минимальный чек для подарка (₽)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={giftMinAmount}
                    onChange={(e) => setGiftMinAmount(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase text-slate-400">
                      Блюда на выбор ({giftProductIds.length}/4)
                    </label>
                  </div>
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Поиск блюда для подарка..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
                    {filteredProducts.map((p) => {
                      const isSelected = giftProductIds.includes(p.id);
                      const isDisabled = !isSelected && giftProductIds.length >= 4;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => toggleGiftProduct(p.id)}
                          className={`relative flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400/60 text-amber-300'
                              : isDisabled
                              ? 'bg-slate-900/40 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
                              : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <img
                            src={p.imageUrl || 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80'}
                            alt={p.title}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold truncate">{p.title}</p>
                            <p className="text-[10px] text-slate-500">{p.price} ₽</p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400 absolute top-1.5 right-1.5 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/60">
                  <button
                    onClick={saveGiftSettings}
                    disabled={giftSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl text-sm shadow-lg shadow-red-500/25 disabled:opacity-50 transition"
                  >
                    {giftSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Сохранить настройки подарка
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== TAB: ПРОМОКОДЫ ==================== */}
      {tab === 'promocodes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-400">{promocodes.length} промокодов создано</p>
            <button
              onClick={openCreatePromo}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-500/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Новый промокод
            </button>
          </div>

          {promoLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-400" />
            </div>
          ) : promocodes.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="font-bold">Промокодов пока нет</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {promocodes.map((promo) => (
                <div
                  key={promo.id}
                  className={`bg-slate-800/80 border rounded-2xl p-4 flex flex-col gap-3 ${
                    promo.active ? 'border-slate-700/60' : 'border-red-500/30 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                        {promo.discountType === 'percent' ? <Percent className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{promo.code}</p>
                        <p className="text-xs text-emerald-400 font-bold">
                          -{promo.discountValue}{promo.discountType === 'percent' ? '%' : ' ₽'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">{promo.description || 'Без описания'}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>От {promo.minAmount} ₽</span>
                    <span>Исп.: {promo.usedCount}/{promo.usageLimit === 0 ? '∞' : promo.usageLimit}</span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-700/60">
                    <button
                      onClick={() => togglePromoActive(promo)}
                      disabled={togglingPromoId === promo.id}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition ${
                        promo.active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                      }`}
                    >
                      {togglingPromoId === promo.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : promo.active ? (
                        <><CheckCircle2 className="w-3 h-3" /> Активен</>
                      ) : (
                        <><XCircle className="w-3 h-3" /> Отключен</>
                      )}
                    </button>
                    <button
                      onClick={() => openEditPromo(promo)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deletePromo(promo.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: БАННЕРЫ ==================== */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-400">{bannersList.length} баннеров на главной</p>
            <button
              onClick={openCreateBanner}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-500/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Новый баннер
            </button>
          </div>

          {bannerLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-400" />
            </div>
          ) : bannersList.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="font-bold">Баннеров пока нет</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {bannersList.map((banner) => (
                <div
                  key={banner.id}
                  className={`relative overflow-hidden bg-gradient-to-r ${banner.bgGradient} border rounded-2xl p-4 space-y-3 ${
                    banner.active ? 'border-slate-700/60' : 'border-red-500/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-full border bg-slate-900/80 ${banner.accentColor}`}>
                      {banner.badge}
                    </span>
                    {banner.code && (
                      <span className="text-[10px] font-bold text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded-md">
                        {banner.code}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white leading-snug">{banner.title}</h4>
                    {banner.subtitle && <p className="text-[11px] text-slate-400 mt-1">{banner.subtitle}</p>}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-700/40">
                    <button
                      onClick={() => toggleBannerActive(banner)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition ${
                        banner.active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {banner.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {banner.active ? 'Показывается' : 'Скрыт'}
                    </button>
                    <button
                      onClick={() => openEditBanner(banner)}
                      className="p-1.5 bg-slate-700/80 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBanner(banner.id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== МОДАЛКА ПРОМОКОДА ==================== */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-black text-white">
                {editingPromo ? '✏️ Редактировать промокод' : '➕ Новый промокод'}
              </h2>
              <button onClick={() => setIsPromoModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={savePromo} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Код промокода *</label>
                <input
                  type="text"
                  required
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  placeholder="SUSHININ10"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Тип скидки</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPromoForm({ ...promoForm, discountType: 'percent' })}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      promoForm.discountType === 'percent'
                        ? 'bg-red-600/20 border-red-500 text-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" /> Процент
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoForm({ ...promoForm, discountType: 'fixed' })}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                      promoForm.discountType === 'fixed'
                        ? 'bg-red-600/20 border-red-500 text-slate-100'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" /> Фикс. ₽
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Размер скидки {promoForm.discountType === 'percent' ? '(%)' : '(₽)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={promoForm.discountValue}
                    onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Мин. чек (₽)</label>
                  <input
                    type="number"
                    min="0"
                    value={promoForm.minAmount}
                    onChange={(e) => setPromoForm({ ...promoForm, minAmount: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Лимит использований (0 = без лимита)
                </label>
                <input
                  type="number"
                  min="0"
                  value={promoForm.usageLimit}
                  onChange={(e) => setPromoForm({ ...promoForm, usageLimit: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Описание</label>
                <textarea
                  rows={2}
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  placeholder="Скидка 10% на первый заказ"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoForm.active}
                  onChange={(e) => setPromoForm({ ...promoForm, active: e.target.checked })}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-xs font-bold text-slate-300">Промокод активен</span>
              </label>

              <div className="pt-3 border-t border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={promoSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-50 transition"
                >
                  {promoSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Сохранить</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== МОДАЛКА БАННЕРА ==================== */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-black text-white">
                {editingBanner ? '✏️ Редактировать баннер' : '➕ Новый баннер'}
              </h2>
              <button onClick={() => setIsBannerModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveBanner} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Заголовок *</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="Скидка 10% на первый заказ!"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Подзаголовок</label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="Вводите промокод при оформлении корзины"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Бейдж</label>
                  <input
                    type="text"
                    value={bannerForm.badge}
                    onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                    placeholder="АКЦИЯ"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Промокод (опц.)</label>
                  <input
                    type="text"
                    value={bannerForm.code}
                    onChange={(e) => setBannerForm({ ...bannerForm, code: e.target.value.toUpperCase() })}
                    placeholder="SUSHININ10"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Цветовая схема</label>
                <div className="grid grid-cols-5 gap-2">
                  {GRADIENT_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, presetIndex: idx })}
                      className={`h-10 rounded-xl bg-gradient-to-r ${preset.bg} border-2 transition ${
                        bannerForm.presetIndex === idx ? 'border-white' : 'border-slate-700'
                      }`}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">Порядок сортировки</label>
                <input
                  type="number"
                  value={bannerForm.sortOrder}
                  onChange={(e) => setBannerForm({ ...bannerForm, sortOrder: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bannerForm.active}
                  onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                  className="w-4 h-4 accent-red-500"
                />
                <span className="text-xs font-bold text-slate-300">Баннер показывается на сайте</span>
              </label>

              <div className="pt-3 border-t border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={bannerSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-50 transition"
                >
                  {bannerSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Сохранить</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}