'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Flame, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.message || 'Неверный пароль');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-red-600 to-red-500 rounded-2xl shadow-lg shadow-red-500/30 mb-4">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">
            СУШИ<span className="text-red-500">НИН</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Панель администратора</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-xl">
              <Lock className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-lg font-black text-slate-100">Вход в систему</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Пароль администратора
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль..."
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-xs mt-1.5 font-semibold">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Проверяем...</>
              ) : (
                <><Lock className="w-4 h-4" /> Войти в админку</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          © {new Date().getFullYear()} СушиНин — Только для персонала
        </p>
      </div>
    </div>
  );
}