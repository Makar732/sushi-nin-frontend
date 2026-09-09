'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  RefreshCw, Phone, MapPin, Clock, CreditCard,
  Package, XCircle, Loader2, Volume2, VolumeX
} from 'lucide-react';

interface OrderItem {
  title: string;
  variant?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  zone: string;
  deliveryType: string;
  address: string;
  time: string;
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: string;
  comment?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  new: {
    label: '🟡 Новый',
    color: 'border-yellow-500/40 bg-yellow-500/10',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    next: 'cooking',
    nextLabel: '→ Готовится',
  },
  cooking: {
    label: '🟠 Готовится',
    color: 'border-orange-500/40 bg-orange-500/10',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    next: 'delivering',
    nextLabel: '→ В путь',
  },
  delivering: {
    label: '🔵 В пути',
    color: 'border-sky-500/40 bg-sky-500/10',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    next: 'completed',
    nextLabel: '→ Доставлен',
  },
  completed: {
    label: '🟢 Доставлен',
    color: 'border-emerald-500/40 bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    next: null,
    nextLabel: null,
  },
  cancelled: {
    label: '🔴 Отменён',
    color: 'border-red-500/40 bg-red-500/10',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
    next: null,
    nextLabel: null,
  },
};

const STATUS_COLUMNS = ['new', 'cooking', 'delivering', 'completed'];

function OrderCard({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (orderId: string, status: string) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new;

  const handleNext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!config.next) return;
    setIsUpdating(true);
    await onStatusChange(order.orderNumber, config.next);
    setIsUpdating(false);
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Отменить заказ?')) return;
    setIsUpdating(true);
    await onStatusChange(order.orderNumber, 'cancelled');
    setIsUpdating(false);
  };

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`border rounded-2xl p-4 cursor-pointer transition-all duration-200 ${config.color} hover:brightness-110`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-white">#{order.orderNumber}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
              {config.label}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-bold mt-0.5">{order.customerName}</p>
        </div>
        <span className="text-sm font-black text-red-400 shrink-0">{order.totalAmount} ₽</span>
      </div>

      <div className="space-y-1 text-xs text-slate-400 mb-3">
        <div className="flex items-center gap-1.5">
          <Phone className="w-3 h-3 text-sky-400 shrink-0" />
          <a
            href={`tel:${order.customerPhone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sky-400 hover:underline font-bold"
          >
            {order.customerPhone}
          </a>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{order.address}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{order.time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3 h-3 shrink-0" />
          <span>{order.paymentMethod}</span>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Состав:</p>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-slate-300">
                {item.quantity}× {item.title}
                {item.variant ? ` (${item.variant})` : ''}
              </span>
              <span className="text-slate-200 font-bold shrink-0">
                {item.price * item.quantity} ₽
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-700/50 space-y-1 text-xs">
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Скидка:</span>
                <span>-{order.discount} ₽</span>
              </div>
            )}
            <div className="flex justify-between text-slate-300">
              <span>Доставка:</span>
              <span>{order.deliveryFee === 0 ? 'БЕСПЛАТНО' : `${order.deliveryFee} ₽`}</span>
            </div>
            <div className="flex justify-between font-black text-white text-sm">
              <span>Итого:</span>
              <span className="text-red-400">{order.totalAmount} ₽</span>
            </div>
          </div>
          {order.comment && (
            <div className="mt-2 p-2 bg-slate-800/60 rounded-xl text-xs text-slate-300">
              💬 {order.comment}
            </div>
          )}
        </div>
      )}

      {order.status !== 'completed' && order.status !== 'cancelled' && (
        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
          {config.next && (
            <button
              onClick={handleNext}
              disabled={isUpdating}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-slate-200 transition flex items-center justify-center gap-1 disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : config.nextLabel}
            </button>
          )}
          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-bold text-red-400 transition disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCount, setLastCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const audioRef = useRef<AudioContext | null>(null);

  const playAlert = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioRef.current = ctx;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch {}
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.success) {
        const newOrders: Order[] = data.orders;
        const newCount = newOrders.filter((o) => o.status === 'new').length;
        if (soundEnabled && newCount > lastCount && lastCount > 0) {
          playAlert();
        }
        setLastCount(newCount);
        setOrders(newOrders);
        setLastRefresh(new Date());
      }
    } catch {}
    setIsLoading(false);
  }, [lastCount, soundEnabled, playAlert]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      await fetchOrders();
    } catch {}
  };

  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">📦 Заказы</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Обновлено: {lastRefresh.toLocaleTimeString('ru-RU')} · Автообновление каждые 15 сек
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold transition ${
              soundEnabled
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={soundEnabled ? 'Звук включён' : 'Звук выключен'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold text-slate-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUS_COLUMNS.map((status) => {
          const count = orders.filter((o) => o.status === status).length;
          const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          return (
            <div key={status} className={`p-3 rounded-2xl border ${cfg.color} text-center`}>
              <p className="text-2xl font-black text-white">{count}</p>
              <p className="text-xs font-bold text-slate-400">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-[1.5]" />
          <p className="text-slate-400 font-bold">Заказов пока нет</p>
          <p className="text-slate-500 text-xs mt-1">Они появятся здесь автоматически</p>
        </div>
      ) : (
        <>
          {activeOrders.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-wider mb-3">
                Активные заказы ({activeOrders.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          )}

          {completedOrders.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-3">
                Завершённые ({completedOrders.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
                {completedOrders.slice(0, 12).map((order) => (
                  <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}