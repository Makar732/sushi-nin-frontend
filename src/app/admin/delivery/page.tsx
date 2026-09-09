'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Truck, Clock, AlertTriangle, Save, Loader2,
  CheckCircle2, XCircle, MapPin, Power, Plus, Trash2, X, Sparkles
} from 'lucide-react';

interface DeliveryZone {
  id: string;
  name: string;
  freeThreshold: number;
  deliveryFee: number;
  description: string;
  active: boolean;
}

interface WorkingHours {
  openTime: string;
  closeTime: string;
  isManualClosed: boolean;
  manualCloseReason: string;
}

const EMPTY_ZONE_FORM = {
  name: '',
  freeThreshold: '700',
  deliveryFee: '150',
  description: '',
};

export default function AdminDeliveryPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    openTime: '11:00',
    closeTime: '22:40',
    isManualClosed: false,
    manualCloseReason: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingZoneId, setSavingZoneId] = useState<string | null>(null);
  const [savingHours, setSavingHours] = useState(false);
  const [togglingZoneId, setTogglingZoneId] = useState<string | null>(null);
  const [deletingZoneId, setDeletingZoneId] = useState<string | null>(null);
  const [savedZoneId, setSavedZoneId] = useState<string | null>(null);
  const [savedHours, setSavedHours] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zoneForm, setZoneForm] = useState(EMPTY_ZONE_FORM);
  const [isCreatingZone, setIsCreatingZone] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/delivery', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setZones(data.zones || []);
        if (data.workingHours) setWorkingHours(data.workingHours);
      }
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/admin/delivery/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setZones(data.zones || []);
      }
    } catch {}
    setIsSeeding(false);
  };

  const updateZoneField = (id: string, field: 'freeThreshold' | 'deliveryFee', value: string) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, [field]: Number(value) } : z))
    );
  };

  const saveZone = async (zone: DeliveryZone) => {
    setSavingZoneId(zone.id);
    try {
      await fetch('/api/admin/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'zone',
          id: zone.id,
          freeThreshold: zone.freeThreshold,
          deliveryFee: zone.deliveryFee,
        }),
      });
      setSavedZoneId(zone.id);
      setTimeout(() => setSavedZoneId(null), 2000);
    } catch {}
    setSavingZoneId(null);
  };

  const toggleZoneActive = async (zone: DeliveryZone) => {
    setTogglingZoneId(zone.id);
    setZones((prev) =>
      prev.map((z) => (z.id === zone.id ? { ...z, active: !z.active } : z))
    );
    try {
      await fetch('/api/admin/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'zone', id: zone.id, active: !zone.active }),
      });
    } catch {
      fetchData();
    }
    setTogglingZoneId(null);
  };

  const deleteZone = async (id: string) => {
    if (!confirm('Удалить зону доставки? Это действие нельзя отменить.')) return;
    setDeletingZoneId(id);
    setZones((prev) => prev.filter((z) => z.id !== id));
    try {
      await fetch(`/api/admin/delivery?id=${id}`, { method: 'DELETE' });
    } catch {
      fetchData();
    }
    setDeletingZoneId(null);
  };

  const openCreateZone = () => {
    setZoneForm(EMPTY_ZONE_FORM);
    setIsZoneModalOpen(true);
  };

  const createZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingZone(true);
    try {
      await fetch('/api/admin/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: zoneForm.name,
          freeThreshold: Number(zoneForm.freeThreshold) || 0,
          deliveryFee: Number(zoneForm.deliveryFee) || 0,
          description: zoneForm.description,
        }),
      });
      setIsZoneModalOpen(false);
      await fetchData();
    } catch {}
    setIsCreatingZone(false);
  };

  const saveWorkingHours = async () => {
    setSavingHours(true);
    try {
      await fetch('/api/admin/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hours',
          openTime: workingHours.openTime,
          closeTime: workingHours.closeTime,
          isManualClosed: workingHours.isManualClosed,
          manualCloseReason: workingHours.manualCloseReason,
        }),
      });
      setSavedHours(true);
      setTimeout(() => setSavedHours(false), 2000);
    } catch {}
    setSavingHours(false);
  };

  const toggleManualClose = async () => {
    const newValue = !workingHours.isManualClosed;
    setWorkingHours((prev) => ({ ...prev, isManualClosed: newValue }));
    try {
      await fetch('/api/admin/delivery', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hours',
          isManualClosed: newValue,
          openTime: workingHours.openTime,
          closeTime: workingHours.closeTime,
          manualCloseReason: workingHours.manualCloseReason,
        }),
      });
    } catch {
      fetchData();
    }
  };

  const getStoreStatus = () => {
    if (workingHours.isManualClosed) return 'closed-manual';
    const now = new Date();
    const moscowOffset = 3 * 60;
    const localOffset = now.getTimezoneOffset();
    const moscowNow = new Date(now.getTime() + (moscowOffset + localOffset) * 60000);
    const [openH, openM] = workingHours.openTime.split(':').map(Number);
    const [closeH, closeM] = workingHours.closeTime.split(':').map(Number);
    const nowMinutes = moscowNow.getHours() * 60 + moscowNow.getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes ? 'open' : 'closed-time';
  };

  const storeStatus = getStoreStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">🚚 Доставка & Режим работы</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Управление зонами доставки и расписанием заведения
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-red-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* ==================== РЕЖИМ РАБОТЫ ==================== */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-400" />
              <h2 className="text-base font-black text-white">Режим работы</h2>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
              storeStatus === 'open'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                storeStatus === 'open' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`} />
              <div>
                <p className={`text-sm font-black ${
                  storeStatus === 'open' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {storeStatus === 'open' && '✅ Заведение открыто — принимаем заказы'}
                  {storeStatus === 'closed-time' && '🕐 Закрыто по расписанию'}
                  {storeStatus === 'closed-manual' && '🔴 Закрыто вручную администратором'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Рабочее время: {workingHours.openTime} — {workingHours.closeTime} (МСК)
                </p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Power className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-sm font-black text-white">Экстренная остановка</p>
                    <p className="text-xs text-slate-400">Немедленно закрыть приём заказов</p>
                  </div>
                </div>
                <button
                  onClick={toggleManualClose}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                    workingHours.isManualClosed ? 'bg-red-600' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                      workingHours.isManualClosed ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {workingHours.isManualClosed && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs font-bold text-red-300">
                    Приём заказов остановлен! Клиенты не могут оформить заказ.
                  </p>
                </div>
              )}

              {workingHours.isManualClosed && (
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Причина закрытия (видна клиентам)
                  </label>
                  <input
                    type="text"
                    value={workingHours.manualCloseReason}
                    onChange={(e) => setWorkingHours((prev) => ({ ...prev, manualCloseReason: e.target.value }))}
                    placeholder="Технический перерыв до 18:00"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-black text-white">Расписание работы (МСК)</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Открытие
                  </label>
                  <input
                    type="time"
                    value={workingHours.openTime}
                    onChange={(e) => setWorkingHours((prev) => ({ ...prev, openTime: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Закрытие
                  </label>
                  <input
                    type="time"
                    value={workingHours.closeTime}
                    onChange={(e) => setWorkingHours((prev) => ({ ...prev, closeTime: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <button
                onClick={saveWorkingHours}
                disabled={savingHours}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl text-sm shadow-lg shadow-red-500/25 disabled:opacity-50 transition active:scale-95"
              >
                {savingHours ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : savedHours ? (
                  <><CheckCircle2 className="w-4 h-4" /> Сохранено!</>
                ) : (
                  <><Save className="w-4 h-4" /> Сохранить расписание</>
                )}
              </button>
            </div>
          </div>

          {/* ==================== ЗОНЫ ДОСТАВКИ ==================== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-400" />
                <h2 className="text-base font-black text-white">Зоны доставки</h2>
              </div>
              {zones.length > 0 && (
                <button
                  onClick={openCreateZone}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-xs shadow-md shadow-red-500/25 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Новая зона
                </button>
              )}
            </div>

            {zones.length === 0 ? (
              <div className="text-center py-14 bg-slate-800/40 border border-slate-700/40 rounded-2xl space-y-4">
                <div>
                  <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-300 font-bold">Зоны доставки не найдены</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Инициализируйте зону по умолчанию (Заволжье) или создайте свою
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={handleSeedDefaults}
                    disabled={isSeeding}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl text-sm shadow-lg shadow-red-500/25 disabled:opacity-50 transition active:scale-95"
                  >
                    {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Создать зону "Заволжье" по умолчанию
                  </button>
                  <button
                    onClick={openCreateZone}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl text-sm transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Создать свою зону
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className={`bg-slate-800/60 border rounded-2xl p-4 space-y-3 transition ${
                      zone.active ? 'border-slate-700/60' : 'border-red-500/30 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate">{zone.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{zone.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleZoneActive(zone)}
                          disabled={togglingZoneId === zone.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition ${
                            zone.active
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                          }`}
                        >
                          {togglingZoneId === zone.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : zone.active ? (
                            <><CheckCircle2 className="w-3 h-3" /> Активна</>
                          ) : (
                            <><XCircle className="w-3 h-3" /> Отключена</>
                          )}
                        </button>
                        <button
                          onClick={() => deleteZone(zone.id)}
                          disabled={deletingZoneId === zone.id}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition disabled:opacity-50"
                        >
                          {deletingZoneId === zone.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                          Стоимость доставки (₽)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={zone.deliveryFee}
                          onChange={(e) => updateZoneField(zone.id, 'deliveryFee', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                          Порог бесплатной (₽)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={zone.freeThreshold}
                          onChange={(e) => updateZoneField(zone.id, 'freeThreshold', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[11px] text-slate-500">
                        Бесплатно от <span className="text-slate-300 font-bold">{zone.freeThreshold} ₽</span>,
                        иначе <span className="text-red-400 font-bold">{zone.deliveryFee} ₽</span>
                      </p>
                      <button
                        onClick={() => saveZone(zone)}
                        disabled={savingZoneId === zone.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-xs shadow-md shadow-red-500/20 disabled:opacity-50 transition active:scale-95"
                      >
                        {savingZoneId === zone.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : savedZoneId === zone.id ? (
                          <><CheckCircle2 className="w-3 h-3" /> Сохранено!</>
                        ) : (
                          <><Save className="w-3 h-3" /> Сохранить</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== МОДАЛКА СОЗДАНИЯ ЗОНЫ ==================== */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <h2 className="text-lg font-black text-white">➕ Новая зона доставки</h2>
              <button onClick={() => setIsZoneModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={createZone} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Название района *
                </label>
                <input
                  type="text"
                  required
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  placeholder="Например: Центр города"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Стоимость доставки (₽) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={zoneForm.deliveryFee}
                    onChange={(e) => setZoneForm({ ...zoneForm, deliveryFee: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Порог бесплатной (₽) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={zoneForm.freeThreshold}
                    onChange={(e) => setZoneForm({ ...zoneForm, freeThreshold: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Описание (опционально)
                </label>
                <input
                  type="text"
                  value={zoneForm.description}
                  onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                  placeholder="Доставка 30-40 мин."
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isCreatingZone}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-50 transition"
                >
                  {isCreatingZone ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Создать</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}