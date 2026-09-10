'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { District } from '@/data/districts';
import { MapPin, Check, Truck, Sparkles, X, AlertTriangle, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type LoadState = 'loading' | 'error' | 'ready';

export const DistrictModal = () => {
  const {
    district,
    setDistrict,
    setDistricts,
    isDistrictModalOpen,
    closeDistrictModal,
  } = useStore();

  const [zones, setZones] = useState<District[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  const fetchZones = useCallback(async () => {
    setLoadState('loading');
    try {
      const res = await fetch('/api/delivery-zones', { cache: 'no-store' });
      const data = await res.json();

      if (!data.success || !Array.isArray(data.zones)) {
        throw new Error(data.error || 'Не удалось получить зоны доставки');
      }

      const fetchedZones: District[] = data.zones;
      setZones(fetchedZones);
      setDistricts(fetchedZones);
      setLoadState('ready');

      const current = useStore.getState().district;

      if (!current) {
        // Зона ещё не выбрана — открываем модалку
        useStore.setState({ isDistrictModalOpen: true });
        return;
      }

      const freshMatch = fetchedZones.find((z) => z.id === current.id);

      if (!freshMatch) {
        // Зона была удалена или деактивирована в админке — просим выбрать заново
        useStore.setState({ district: null, isDistrictModalOpen: true });
      } else if (
        freshMatch.deliveryFee !== current.deliveryFee ||
        freshMatch.freeThreshold !== current.freeThreshold ||
        freshMatch.name !== current.name ||
        freshMatch.description !== current.description
      ) {
        // Админ поменял стоимость/порог/название — подтягиваем актуальные данные молча
        useStore.setState({ district: freshMatch });
      }
    } catch (err) {
      console.error('Ошибка загрузки зон доставки:', err);
      setLoadState('error');
    }
  }, [setDistricts]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  if (!isDistrictModalOpen) return null;

  const handleSelect = (d: District) => {
    setDistrict(d);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden border bg-slate-900 border-slate-800 rounded-3xl shadow-2xl shadow-red-500/10"
        >
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-500/20 via-sky-500/5 to-transparent pointer-events-none" />

          {district && (
            <button
              onClick={closeDistrictModal}
              className="absolute top-4 right-4 z-10 p-2 text-slate-400 rounded-full hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="relative p-6 sm:p-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 shadow-md shadow-red-500/20">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Заволжье и окрестности
                </span>
                <h2 className="text-2xl font-black text-slate-50 tracking-tight">
                  Выберите район доставки
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-6">
              Мы рассчитаем сумму минимального заказа и порог бесплатной доставки для вашего населенного пункта.
            </p>

            {/* ===== СОСТОЯНИЕ: ЗАГРУЗКА (Skeleton) ===== */}
            {loadState === 'loading' && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-full p-4 rounded-2xl border border-slate-700/50 bg-slate-800/40 animate-pulse"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-700/60 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-slate-700/60 rounded-md" />
                        <div className="h-3 w-48 bg-slate-700/40 rounded-md" />
                        <div className="h-3 w-40 bg-slate-700/40 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== СОСТОЯНИЕ: ОШИБКА ===== */}
            {loadState === 'error' && (
              <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/10 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                <p className="text-sm font-bold text-red-300">
                  Не удалось загрузить список районов доставки
                </p>
                <p className="text-xs text-slate-400">
                  Проверьте интернет-соединение и попробуйте снова
                </p>
                <button
                  onClick={fetchZones}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-red-300 font-bold text-xs transition"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Повторить попытку
                </button>
              </div>
            )}

            {/* ===== СОСТОЯНИЕ: НЕТ АКТИВНЫХ ЗОН ===== */}
            {loadState === 'ready' && zones.length === 0 && (
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-center">
                <p className="text-sm font-bold text-amber-300">
                  Сейчас нет доступных зон доставки
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Попробуйте зайти позже или свяжитесь с рестораном
                </p>
              </div>
            )}

            {/* ===== СОСТОЯНИЕ: СПИСОК ЗОН ===== */}
            {loadState === 'ready' && zones.length > 0 && (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {zones.map((d) => {
                  const isSelected = district?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleSelect(d)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                        isSelected
                          ? 'bg-slate-800/90 border-red-500/80 shadow-lg shadow-red-500/15'
                          : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`mt-1 p-2 rounded-xl border ${
                            isSelected
                              ? 'bg-red-500 text-white border-red-400'
                              : 'bg-slate-700/50 text-slate-400 border-slate-600 group-hover:text-slate-200'
                          }`}
                        >
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-base">
                              {d.name}
                            </span>
                            {isSelected && (
                              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-medium">
                                Выбран
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{d.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              Бесплатно от {d.freeThreshold} ₽
                            </span>
                            <span className="text-slate-400">
                              Доставка {d.deliveryFee} ₽
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                          isSelected
                            ? 'bg-red-500 border-red-400 text-white scale-110'
                            : 'border-slate-600 text-transparent group-hover:border-slate-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Принимаем заказы 11:00 - 22:40
              </span>
              {district && (
                <button
                  onClick={closeDistrictModal}
                  className="text-slate-300 font-medium hover:text-white underline underline-offset-2"
                >
                  Продолжить
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};