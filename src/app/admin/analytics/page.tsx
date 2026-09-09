'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3, TrendingUp, ShoppingBag, Receipt,
  Loader2, Calendar, Trophy, ArrowUp, ArrowDown, Minus
} from 'lucide-react';

type Period = 'day' | 'week' | 'month';

interface Summary {
  totalRevenue: number;
  totalOrders: number;
  avgCheck: number;
}

interface TopDish {
  title: string;
  count: number;
  revenue: number;
}

interface DailyEntry {
  date: string;
  revenue: number;
  orders: number;
}

interface StatusBreakdown {
  [key: string]: number;
}

interface AnalyticsData {
  summary: Summary;
  topDishes: TopDish[];
  daily: DailyEntry[];
  statusBreakdown: StatusBreakdown;
}

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Новые', color: 'text-sky-400' },
  confirmed: { label: 'Подтверждены', color: 'text-blue-400' },
  cooking: { label: 'Готовятся', color: 'text-amber-400' },
  delivering: { label: 'Доставляются', color: 'text-purple-400' },
  completed: { label: 'Выполнены', color: 'text-emerald-400' },
};

const MEDAL_COLORS = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
const MEDAL_EMOJI = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prevSummary, setPrevSummary] = useState<Summary | null>(null);

  const fetchAnalytics = useCallback(async (p: Period) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setPrevSummary(data?.summary || null);
        setData(json);
      }
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalytics(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const maxRevenue = data?.daily.reduce((m, d) => Math.max(m, d.revenue), 1) || 1;

  const getTrend = (current: number, prev: number | undefined) => {
    if (!prev || prev === 0) return null;
    const diff = ((current - prev) / prev) * 100;
    if (Math.abs(diff) < 1) return null;
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">📊 Аналитика</h1>
          <p className="text-xs text-slate-400 mt-0.5">Статистика заказов и выручки</p>
        </div>

        {/* Переключатель периода */}
        <div className="flex gap-1.5 bg-slate-800/80 border border-slate-700 rounded-2xl p-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                period === p
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-red-400" />
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-slate-400">
          <p className="font-bold">Нет данных</p>
        </div>
      ) : (
        <>
          {/* ==================== КАРТОЧКИ SUMMARY ==================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Выручка */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  {PERIOD_LABELS[period]}
                </span>
              </div>
              <div>
                <p className="text-2xl font-black text-white">
                  {data.summary.totalRevenue.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Общая выручка</p>
              </div>
              {data.summary.totalRevenue > 0 && (
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                  <ArrowUp className="w-3 h-3" />
                  <span>выполненных заказов</span>
                </div>
              )}
            </div>

            {/* Заказы */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  {PERIOD_LABELS[period]}
                </span>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{data.summary.totalOrders}</p>
                <p className="text-xs text-slate-400 mt-0.5">Заказов выполнено</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-sky-400 font-bold">
                <Calendar className="w-3 h-3" />
                <span>за период</span>
              </div>
            </div>

            {/* Средний чек */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  {PERIOD_LABELS[period]}
                </span>
              </div>
              <div>
                <p className="text-2xl font-black text-white">
                  {data.summary.avgCheck.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Средний чек</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                <BarChart3 className="w-3 h-3" />
                <span>на один заказ</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* ==================== ГРАФИК ПО ДНЯМ ==================== */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-black text-white">Выручка по дням</h3>
              </div>

              {data.daily.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <p className="text-sm">Нет данных за период</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.daily.map((entry) => (
                    <div key={entry.date} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold w-12">{entry.date}</span>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-slate-500">{entry.orders} зак.</span>
                          <span className="text-slate-100 font-black w-28 text-right">
                            {entry.revenue.toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-700"
                          style={{ width: `${Math.round((entry.revenue / maxRevenue) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ==================== ТОП-5 БЛЮД ==================== */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">Топ-5 популярных блюд</h3>
              </div>

              {data.topDishes.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <p className="text-sm">Нет данных за период</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.topDishes.map((dish, idx) => {
                    const maxCount = data.topDishes[0].count;
                    const widthPercent = Math.round((dish.count / maxCount) * 100);
                    return (
                      <div key={dish.title} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">{MEDAL_EMOJI[idx]}</span>
                            <span className="text-xs font-bold text-slate-200 truncate">{dish.title}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 text-xs text-right">
                            <span className="text-slate-500">{dish.count} шт.</span>
                            <span className="text-emerald-400 font-black">
                              {dish.revenue.toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              idx === 0
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                                : idx === 1
                                ? 'bg-gradient-to-r from-slate-400 to-slate-300'
                                : 'bg-gradient-to-r from-red-600 to-red-400'
                            }`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ==================== РАЗБИВКА ПО СТАТУСАМ ==================== */}
          {Object.keys(data.statusBreakdown).length > 0 && (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-black text-white">
                  Распределение по статусам
                  <span className="text-slate-500 font-normal ml-2 text-xs">(все заказы за период)</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(data.statusBreakdown).map(([status, count]) => {
                  const info = STATUS_LABELS[status] || { label: status, color: 'text-slate-400' };
                  const total = Object.values(data.statusBreakdown).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status} className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 text-center space-y-1">
                      <p className={`text-2xl font-black ${info.color}`}>{count}</p>
                      <p className="text-[11px] text-slate-400 font-bold">{info.label}</p>
                      <p className="text-[10px] text-slate-600">{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== ПУСТОЕ СОСТОЯНИЕ ==================== */}
          {data.summary.totalOrders === 0 && data.daily.length === 0 && (
            <div className="text-center py-16 bg-slate-800/40 border border-slate-700/40 rounded-2xl">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-bold">Заказов за период не найдено</p>
              <p className="text-xs text-slate-500 mt-1">
                Выберите другой период или дождитесь первых заказов
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}