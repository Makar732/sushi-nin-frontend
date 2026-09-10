'use client';

import React, { useState, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { Upload, Loader2, CheckCircle2, RefreshCw, Trash2, AlertCircle, ImageIcon, X } from 'lucide-react';

interface ImageUploaderProps {
  value: string | null | undefined;
  productId: string; // временный ID для новых блюд или реальный ID для существующих
  onChange: (url: string | null) => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_ORIGINAL_SIZE_MB = 15;

type UploaderStatus = 'idle' | 'compressing' | 'uploading' | 'error';

interface ToastState {
  type: 'error' | 'success';
  message: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, productId, onChange }) => {
  const [status, setStatus] = useState<UploaderStatus>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const processAndUpload = useCallback(
    async (file: File) => {
      // Валидация MIME-типа
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        showToast('error', 'Недопустимый формат. Используйте JPEG, PNG или WebP');
        return;
      }

      // Валидация исходного размера
      if (file.size > MAX_ORIGINAL_SIZE_MB * 1024 * 1024) {
        showToast('error', `Файл слишком большой (макс. ${MAX_ORIGINAL_SIZE_MB} МБ)`);
        return;
      }

      setStatus('compressing');

      try {
        // Сжатие + конвертация в WebP прямо в браузере
        const compressedFile = await imageCompression(file, {
          maxWidthOrHeight: 800,
          maxSizeMB: 0.12,
          useWebWorker: true,
          fileType: 'image/webp',
          initialQuality: 0.82,
        });

        setStatus('uploading');

        const formData = new FormData();
        formData.append('file', compressedFile, 'compressed.webp');
        formData.append('productId', productId);
        if (value) formData.append('oldImageUrl', value);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (data.success) {
          onChange(data.url);
          setStatus('idle');
          showToast('success', 'Фото успешно загружено!');
        } else {
          setStatus('error');
          showToast('error', data.error || 'Ошибка загрузки фото');
        }
      } catch (err) {
        console.error('Image processing error:', err);
        setStatus('error');
        showToast('error', 'Не удалось обработать изображение');
      }
    },
    [productId, value, onChange, showToast]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAndUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processAndUpload(file);
  };

  const handleDelete = async () => {
    if (!value) return;
    if (!confirm('Удалить фотографию блюда?')) return;

    setStatus('uploading');
    try {
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: value }),
      });
      onChange(null);
      showToast('success', 'Фото удалено');
    } catch {
      showToast('error', 'Не удалось удалить фото');
    }
    setStatus('idle');
  };

  const isBusy = status === 'compressing' || status === 'uploading';

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div
          className={`absolute -top-2 left-0 right-0 -translate-y-full z-20 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shadow-lg animate-in fade-in slide-in-from-bottom-1 ${
            toast.type === 'error'
              ? 'bg-red-500/20 border border-red-500/40 text-red-300'
              : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!value ? (
        // ==================== СОСТОЯНИЕ: ПУСТО ====================
        <div
          onClick={() => !isBusy && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`aspect-square w-full max-w-[200px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition ${
            isBusy
              ? 'border-slate-700 bg-slate-800/40 cursor-wait'
              : isDragging
              ? 'border-red-500 bg-red-500/10'
              : 'border-slate-700 bg-slate-800/60 hover:border-red-500/50 hover:bg-slate-800'
          }`}
        >
          {isBusy ? (
            <>
              <Loader2 className="w-7 h-7 text-red-400 animate-spin" />
              <span className="text-[11px] font-bold text-slate-300 text-center px-2">
                {status === 'compressing' ? 'Оптимизация...' : 'Загрузка...'}
              </span>
            </>
          ) : (
            <>
              <div className="p-2.5 bg-slate-900/80 rounded-xl text-slate-400">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-300 text-center px-3">
                📁 Загрузить фотографию
              </span>
              <span className="text-[10px] text-slate-500">или перетащите файл</span>
            </>
          )}
        </div>
      ) : (
        // ==================== СОСТОЯНИЕ: ЗАГРУЖЕНО ====================
        <div className="w-full max-w-[200px] space-y-2">
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-700 bg-slate-900">
            <img src={value} alt="Превью блюда" className="w-full h-full object-cover" />
            {isBusy && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            {!isBusy && (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            )}
            {!isBusy && (
              <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-emerald-500/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md backdrop-blur">
                <CheckCircle2 className="w-2.5 h-2.5" /> Фото загружено
              </span>
            )}
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" /> Заменить
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold transition disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  );
};