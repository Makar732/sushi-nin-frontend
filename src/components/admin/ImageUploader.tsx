'use client';

import React, { useState, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { Upload, Loader2, CheckCircle2, RefreshCw, Trash2, AlertCircle, AlertTriangle, X } from 'lucide-react';

interface ImageUploaderProps {
  value: string | null | undefined;
  productId: string;
  onChange: (url: string | null) => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_ORIGINAL_SIZE_MB = 15;

type UploaderStatus = 'idle' | 'compressing' | 'uploading' | 'error';

interface ToastState {
  type: 'error' | 'success' | 'warning';
  message: string;
}

/**
 * Эвристика детекции известного бага Android-браузеров:
 * OffscreenCanvas + Web Worker кодирование в WebP иногда возвращает
 * полностью (или почти полностью) чёрное изображение, если исходное фото
 * не успело декодироваться в контексте воркера. Функция быстро проверяет
 * усреднённую яркость и разброс пикселей на уменьшенной 16x16 копии —
 * если картинка практически монотонно тёмная, это подозрительный признак
 * брака кодирования, а не реальное содержимое фото.
 */
function isLikelyCorruptedBlackImage(blob: Blob): Promise<boolean> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new window.Image();

    img.onload = () => {
      try {
        const SAMPLE_SIZE = 16;
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(false);
          return;
        }

        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

        let totalBrightness = 0;
        const pixelCount = SAMPLE_SIZE * SAMPLE_SIZE;

        for (let i = 0; i < data.length; i += 4) {
          totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avgBrightness = totalBrightness / pixelCount;

        let maxDeviation = 0;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          maxDeviation = Math.max(maxDeviation, Math.abs(brightness - avgBrightness));
        }

        // Практически нулевая яркость + практически нулевой разброс —
        // явный признак брака кодирования, а не реального тёмного фото
        // (у реальных тёмных фото всегда есть блики/текстура/разброс пикселей)
        const suspicious = avgBrightness < 10 && maxDeviation < 5;
        resolve(suspicious);
      } catch {
        resolve(false);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(false);
    };

    img.src = objectUrl;
  });
}

async function compressToFormat(
  file: File,
  fileType: 'image/webp' | 'image/jpeg'
): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight: 800,
    maxSizeMB: 0.12,
    // Принудительно main-thread кодирование — устраняет известный баг
    // OffscreenCanvas на части Android-браузеров, возвращающий чёрный кадр
    useWebWorker: false,
    fileType,
    initialQuality: 0.82,
  });
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ value, productId, onChange }) => {
  const [status, setStatus] = useState<UploaderStatus>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((type: ToastState['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const processAndUpload = useCallback(
    async (file: File) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        showToast('error', 'Недопустимый формат. Используйте JPEG, PNG или WebP');
        return;
      }

      if (file.size > MAX_ORIGINAL_SIZE_MB * 1024 * 1024) {
        showToast('error', `Файл слишком большой (макс. ${MAX_ORIGINAL_SIZE_MB} МБ)`);
        return;
      }

      setStatus('compressing');

      try {
        // Первая попытка — сжимаем в WebP (лучшее сжатие)
        let finalFile = await compressToFormat(file, 'image/webp');
        let wasFixed = false;

        const isBroken = await isLikelyCorruptedBlackImage(finalFile);

        if (isBroken) {
          console.warn(
            '[ImageUploader] Обнаружен подозрительно чёрный результат WebP-кодирования. ' +
            'Повторное сжатие в JPEG как более совместимый формат...'
          );
          // Вторая попытка — JPEG декодируется/кодируется стабильнее на всех устройствах
          const jpegAttempt = await compressToFormat(file, 'image/jpeg');
          const stillBroken = await isLikelyCorruptedBlackImage(jpegAttempt);

          if (!stillBroken) {
            finalFile = jpegAttempt;
            wasFixed = true;
          } else {
            // Оба варианта подозрительны — либо баг устройства совсем специфичный,
            // либо фото реально очень тёмное. Не блокируем менеджера, но предупреждаем.
            showToast(
              'warning',
              'Фото выглядит очень тёмным. Проверьте превью после загрузки — возможно, стоит выбрать другое фото.'
            );
            finalFile = jpegAttempt;
          }
        }

        setStatus('uploading');

        const formData = new FormData();
        formData.append('file', finalFile, finalFile.name || 'compressed');
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
          showToast(
            'success',
            wasFixed
              ? 'Фото загружено! (автоматически исправлен брак кодирования)'
              : 'Фото успешно загружено!'
          );
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
              : toast.type === 'warning'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
              : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          ) : toast.type === 'warning' ? (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <X className="w-3 h-3 shrink-0" />
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
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
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
              <Loader2 className="w-7 h-7 text-red-400 animate-spin shrink-0" />
              <span className="text-[11px] font-bold text-slate-300 text-center px-2">
                {status === 'compressing' ? 'Оптимизация...' : 'Загрузка...'}
              </span>
            </>
          ) : (
            <>
              <div className="p-2.5 bg-slate-900/80 rounded-xl text-slate-400">
                <Upload className="w-5 h-5 shrink-0" />
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
            <img
              src={value}
              alt="Превью блюда"
              className="w-full h-full object-cover"
            />
            {isBusy && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin shrink-0" />
              </div>
            )}
            {!isBusy && (
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            )}
            {!isBusy && (
              <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-emerald-500/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md backdrop-blur">
                <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> Фото загружено
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
              <RefreshCw className="w-3 h-3 shrink-0" /> Заменить
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold transition disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3 shrink-0" /> Удалить
            </button>
          </div>
        </div>
      )}

      {/* Подсказка для управляющего — отображается всегда под виджетом */}
      <div className="mt-2 max-w-[200px] text-[10px] leading-relaxed text-slate-500 space-y-0.5">
        <p>
          📄 <span className="text-slate-400 font-semibold">Форматы:</span> JPG, PNG, WEBP
        </p>
        <p>
          ⚖️ <span className="text-slate-400 font-semibold">До 15 МБ</span> — сожмём
          автоматически до ~100 КБ
        </p>
        <p>
          📐 <span className="text-slate-400 font-semibold">Квадрат 1:1</span>, от 600×600 px
        </p>
      </div>
    </div>
  );
};