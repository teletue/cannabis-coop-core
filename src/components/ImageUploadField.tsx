'use client';

import { useRef, useState } from 'react';

interface ImageUploadFieldProps {
  value:        string;
  alt:          string;
  onChange:     (url: string) => void;
  onAltChange?: (alt: string) => void;
  label?:       string;
}

const inputCls = 'w-full text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 bg-white text-stone-800';

export default function ImageUploadField({ value, alt, onChange, onAltChange, label = 'Billede' }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt_text', alt);

      const res = await fetch('/api/admin/images', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload fejlede');

      onChange(data.image.public_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload fejlede');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide">{label}</label>

      {value ? (
        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden border border-stone-200 aspect-video bg-stone-50 max-w-md">
            <img src={value} alt={alt || 'Preview'} className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs px-3 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition font-medium disabled:opacity-50"
            >
              {uploading ? 'Uploader…' : 'Erstat billede'}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={uploading}
              className="text-xs px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition font-medium disabled:opacity-50"
            >
              Fjern
            </button>
          </div>
          <input
            type="url"
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`${inputCls} font-mono text-xs`}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full max-w-md border-2 border-dashed border-stone-300 rounded-xl px-6 py-10 text-center hover:border-stone-400 hover:bg-stone-50 transition disabled:opacity-50"
        >
          <span className="block text-sm font-medium text-stone-700">
            {uploading ? 'Uploader…' : 'Upload billede'}
          </span>
          <span className="block text-xs text-stone-400 mt-1">JPG, PNG eller WebP — max 5 MB</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      {onAltChange && (
        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Alt-tekst</label>
          <input
            type="text"
            value={alt}
            onChange={e => onAltChange(e.target.value)}
            placeholder="Beskriv billedet for tilgængelighed og SEO"
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}
