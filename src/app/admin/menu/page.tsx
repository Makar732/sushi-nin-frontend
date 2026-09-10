'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CATEGORIES } from '@/data/categories';
import { ImageUploader } from '@/components/admin/ImageUploader';
import {
  Plus, Search, Edit3, Trash2, CheckCircle2,
  XCircle, Loader2, X, Save
} from 'lucide-react';

interface ProductItem {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  price40cm?: number | null;
  weight: string;
  inStock: boolean;
  imageUrl?: string | null;
  tags?: string[];
}

const EMPTY_FORM = {
  title: '',
  category: 'Роллы',
  description: '',
  price: '',
  price40cm: '',
  weight: '300 г',
  imageUrl: '' as string | null,
  tags: [] as string[],
};

const BADGE_OPTIONS = [
  { id: 'hit', label: '💥 Хит' },
  { id: 'spicy', label: '🌶️ Острое' },
  { id: 'baked', label: '🧀 Запечённое' },
  { id: 'nomeat', label: '🥑 Без мяса' },
];

export default function AdminMenuPage() {
  const [productList, setProductList] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [tempNewId, setTempNewId] = useState<string>('');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setProductList(data.products);
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleStock = async (product: ProductItem) => {
    setTogglingId(product.id);
    const newStock = !product.inStock;
    setProductList((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, inStock: newStock } : p))
    );
    try {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, inStock: newStock }),
      });
    } catch {
      fetchProducts();
    }
    setTogglingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить блюдо из меню?')) return;
    setProductList((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
  };

  const openCreate = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    // Генерируем временный ID для именования файлов ещё не созданного блюда
    setTempNewId(`temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    setIsModalOpen(true);
  };

  const openEdit = (product: ProductItem) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      category: product.category,
      description: product.description || '',
      price: String(product.price),
      price40cm: product.price40cm ? String(product.price40cm) : '',
      weight: product.weight || '',
      imageUrl: product.imageUrl || null,
      tags: product.tags || [],
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingProduct) {
        await fetch('/api/admin/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingProduct.id,
            title: formData.title,
            category: formData.category,
            description: formData.description,
            price: Number(formData.price),
            price40cm: formData.price40cm ? Number(formData.price40cm) : null,
            weight: formData.weight,
            tags: formData.tags,
            imageUrl: formData.imageUrl,
          }),
        });
      } else {
        await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            price: Number(formData.price),
            price40cm: formData.price40cm ? Number(formData.price40cm) : null,
          }),
        });
      }
      setIsModalOpen(false);
      await fetchProducts();
    } catch {}
    setIsSaving(false);
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const filteredProducts = productList.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stopListCount = productList.filter((p) => !p.inStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">🍔 Меню & Стоп-лист</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {productList.length} позиций · 
            <span className="text-red-400 font-bold"> {stopListCount} на стопе</span>
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-500/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Добавить блюдо
        </button>
      </div>

      {/* Поиск и фильтр */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск блюда..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-bold focus:outline-none focus:border-red-500"
        >
          <option value="all">Все ({productList.length})</option>
          {CATEGORIES.map((cat) => {
            const count = productList.filter((p) => p.category === cat.name).length;
            return (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* Быстрый стоп-лист */}
      {stopListCount > 0 && (
        <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-2xl">
          <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wider">
            ⛔ На стоп-листе ({stopListCount})
          </p>
          <div className="flex flex-wrap gap-2">
            {productList.filter((p) => !p.inStock).map((p) => (
              <button
                key={p.id}
                onClick={() => toggleStock(p)}
                className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-xl text-xs font-bold text-red-300 hover:bg-red-500/30 transition flex items-center gap-1.5"
              >
                <XCircle className="w-3 h-3" />
                {p.title}
                <span className="text-red-500 font-black ml-1">→ вернуть</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Сетка товаров */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-400" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="font-bold">Блюда не найдены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-slate-800/80 border rounded-2xl overflow-hidden flex flex-col transition-all ${
                product.inStock
                  ? 'border-slate-700/60'
                  : 'border-red-500/40 bg-red-950/20 opacity-75'
              }`}
            >
              {/* Фото */}
              <div className="relative h-32 bg-slate-900">
                <img
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                {!product.inStock && (
                  <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                    <span className="text-red-400 font-black text-xs uppercase tracking-wider border border-red-500/50 px-2 py-1 rounded-lg">
                      ⛔ На стопе
                    </span>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.tags?.includes('hit') && (
                    <span className="text-[9px] font-black bg-red-600/90 text-white px-1.5 py-0.5 rounded-md">💥 ХИТ</span>
                  )}
                  {product.tags?.includes('spicy') && (
                    <span className="text-[9px] font-black bg-amber-600/90 text-white px-1.5 py-0.5 rounded-md">🌶️ ОСТРО</span>
                  )}
                  {product.tags?.includes('baked') && (
                    <span className="text-[9px] font-black bg-orange-600/90 text-white px-1.5 py-0.5 rounded-md">🧀 ЗАПЕЧ.</span>
                  )}
                  {product.tags?.includes('nomeat') && (
                    <span className="text-[9px] font-black bg-emerald-600/90 text-white px-1.5 py-0.5 rounded-md">🥑 БЕЗ МЯСА</span>
                  )}
                </div>
              </div>

              <div className="p-3 flex flex-col flex-1 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{product.category}</span>
                  <h3 className="text-sm font-bold text-white leading-tight">{product.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{product.description}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-base font-black text-white">{product.price} ₽</span>
                  {product.price40cm && (
                    <span className="text-[11px] text-slate-400">40см: {product.price40cm} ₽</span>
                  )}
                  <span className="text-[10px] text-slate-500 ml-auto">{product.weight}</span>
                </div>

                <div className="flex gap-2 mt-auto pt-2 border-t border-slate-700/60">
                  <button
                    onClick={() => toggleStock(product)}
                    disabled={togglingId === product.id}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 transition ${
                      product.inStock
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                    }`}
                  >
                    {togglingId === product.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : product.inStock ? (
                      <><CheckCircle2 className="w-3 h-3" /> В наличии</>
                    ) : (
                      <><XCircle className="w-3 h-3" /> На стопе</>
                    )}
                  </button>

                  <button
                    onClick={() => openEdit(product)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка создания / редактирования */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-black text-white">
                {editingProduct ? '✏️ Редактировать блюдо' : '➕ Новое блюдо'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Название */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Название *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Роллы Филадельфия"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Категория + Вес */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Категория *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Вес *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="280 г / 8 шт"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Цены */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Цена (₽) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="450"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
                {formData.category === 'Пицца' && (
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                      Цена 40 см (₽)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.price40cm}
                      onChange={(e) => setFormData({ ...formData, price40cm: e.target.value })}
                      placeholder="650"
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              {/* Описание */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Описание
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Состав, аллергены..."
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {/* Фото — новый загрузчик вместо текстового поля */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-2">
                  Фотография блюда
                </label>
                <ImageUploader
                  value={formData.imageUrl}
                  productId={editingProduct?.id || tempNewId}
                  onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                />
              </div>

              {/* Бейджи */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-2">
                  Бейджи
                </label>
                <div className="flex gap-2 flex-wrap">
                  {BADGE_OPTIONS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleTag(b.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        formData.tags.includes(b.id)
                          ? 'bg-red-600/30 border-red-500 text-red-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Кнопки */}
              <div className="pt-3 border-t border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-50 transition"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Save className="w-4 h-4" /> Сохранить</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}