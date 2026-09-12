'use client';

import React, { useRef } from 'react';
import { useStore } from '@/store/useStore';
import { CATEGORIES, FILTER_CHIPS } from '@/data/categories';
import { ChevronLeft, ChevronRight, Layers } from 'lucide-react';

export const CategoryNav = () => {
  const { selectedCategory, setSelectedCategory, activeFilter, setActiveFilter } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -250 : 250;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-[105px] sm:top-[73px] z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 py-2 sm:py-3 px-4 shadow-md">
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3">
        {/* Categories Bar */}
        <div className="relative flex items-center">
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-3 z-10 p-1.5 bg-slate-800/90 border border-slate-700 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 shadow-md shrink-0"
            aria-label="Прокрутить влево"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
          </button>

          <div
            ref={scrollRef}
            className="flex items-center space-x-2 overflow-x-auto py-1 w-full"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 border shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/25 scale-105'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Всё меню</span>
            </button>

            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 border shrink-0 ${
                    isActive
                      ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/25 scale-105'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-sm shrink-0">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-3 z-10 p-1.5 bg-slate-800/90 border border-slate-700 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 shadow-md shrink-0"
            aria-label="Прокрутить вправо"
          >
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Filter Chips */}
        <div
          className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
            Фильтры:
          </span>
          {FILTER_CHIPS.map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap border transition duration-200 shrink-0 ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-black shadow-md shadow-sky-500/20'
                    : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};