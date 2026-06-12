import { Image, Link, Upload, X } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { BackgroundSettings } from '../types';

interface BackgroundCustomizerProps {
  settings: BackgroundSettings;
  onUpload: (file: File) => void;
  onUrlChange: (url: string) => void;
  onOverlayChange: (opacity: number) => void;
  onClear: () => void;
}

export function BackgroundCustomizer({
  settings,
  onUpload,
  onUrlChange,
  onOverlayChange,
  onClear,
}: BackgroundCustomizerProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    onUpload(file);
    event.target.value = '';
  };

  return (
    <section className="glass-panel rounded-lg p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <span className="rounded-md bg-gradient-to-br from-blue-100/80 to-pink-100/70 p-2 text-brand">
            <Image size={18} />
          </span>
          背景图片
        </div>

        <label className="ghost-button inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-sm">
          <Upload size={16} />
          上传图片
          <input className="hidden" type="file" accept="image/*" onChange={handleFileChange} />
        </label>

        <div className="glass-control flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2">
          <Link className="shrink-0 text-muted" size={16} />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="或粘贴图片 URL"
            value={settings.source === 'url' ? settings.imageUrl : ''}
            onChange={(event) => onUrlChange(event.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          遮罩
          <input
            className="w-28 accent-brand"
            type="range"
            min="0.15"
            max="0.85"
            step="0.05"
            value={settings.overlayOpacity}
            onChange={(event) => onOverlayChange(Number(event.target.value))}
          />
        </label>

        <button
          className="ghost-button inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!settings.imageUrl}
          onClick={onClear}
          type="button"
        >
          <X size={16} />
          清除
        </button>
      </div>

      {settings.imageUrl ? (
        <p className="mt-2 text-xs text-muted">
          当前背景来源：{settings.source === 'upload' ? '本地上传图片' : '图片链接'}。背景只在当前浏览器会话中生效。
        </p>
      ) : null}
    </section>
  );
}
