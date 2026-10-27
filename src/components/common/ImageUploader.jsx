import { useRef, useState, useEffect } from 'react';
import { Upload, Camera, Image as ImageIcon, X, Loader2, AlertCircle } from 'lucide-react';
import supabase from '../../lib/supabase';
import { compressImage, createPreview, getImageDimensions, formatFileSize } from '../../utils/imageCompress';

/**
 * Componente reutilizable para subir imágenes a Supabase Storage.
 * Soporta: selección de archivo, cámara (móvil), pegado de URL externa, compresión automática.
 */
export default function ImageUploader({
  bucket,
  folder = '',
  value = '',
  onChange,
  label = 'Imagen',
  optional = false,
  acceptCamera = true,
  maxWidthOrHeight,
  maxSizeMB,
  required = false,
  disabled = false,
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [previewInfo, setPreviewInfo] = useState(null); // { url, size, dims, isSupabase }
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const isSupabaseUrl = value?.includes('supabase.co/storage');

  // Sync preview when value changes externally
  useEffect(() => {
    if (!value) {
      setPreviewInfo(null);
      setUrlInput('');
      return;
    }
    if (isSupabaseUrl) {
      setPreviewInfo({ url: value, size: null, dims: null, isSupabase: true });
    } else if (value.startsWith('http')) {
      setPreviewInfo({ url: value, size: null, dims: null, isSupabase: false });
      setUrlInput(value);
    }
  }, [value]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes (JPG, PNG, WebP).');
      return;
    }

    const preview = createPreview(file);
    setUploading(true);
    setProgress(0);

    try {
      const dims = await getImageDimensions(file);
      setProgress(10);

      const compressed = await compressImage(file, { maxWidthOrHeight, maxSizeMB });
      setProgress(40);

      const filePath = folder ? `${folder}/${Date.now()}-${compressed.name}` : `${Date.now()}-${compressed.name}`;

      // Usa el token de sesión (staff) para pasar las políticas de Storage.
      // Fallback a anon key si no hay sesión (buckets con insert público, ej. reportes).
      const { data: { session } } = await supabase.auth.getSession();
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const token = session?.access_token || anonKey;
      const uploadUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'image/jpeg',
        },
        body: compressed,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.message || `Error ${uploadRes.status} al subir imagen`);
      }

      setProgress(80);

      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;
      setProgress(100);

      const finalDims = await getImageDimensions(compressed);

      URL.revokeObjectURL(preview);
      setPreviewInfo({ url: publicUrl, size: compressed.size, dims: finalDims, isSupabase: true });
      onChange?.(publicUrl);
    } catch (err) {
      URL.revokeObjectURL(preview);
      setError(err.message || 'Error al subir la imagen.');
      setPreviewInfo(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim() && urlInput.startsWith('http')) {
      setPreviewInfo({ url: urlInput.trim(), size: null, dims: null, isSupabase: false });
      onChange?.(urlInput.trim());
      setShowUrlInput(false);
    }
  };

  const handleRemove = async () => {
    if (isSupabaseUrl && previewInfo?.url) {
      try {
        const url = new URL(previewInfo.url);
        const pathParts = url.pathname.split(`/storage/v1/object/public/${bucket}/`);
        if (pathParts[1]) {
          await supabase.storage.from(bucket).remove([pathParts[1]]);
        }
      } catch {
        // Si falla el borrado, igual quitamos la referencia
      }
    }
    setPreviewInfo(null);
    setUrlInput('');
    onChange?.('');
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
        {label}
        {optional && <span className="font-normal text-gray-400 dark:text-gray-500">(opcional)</span>}
      </label>

      {/* Upload buttons */}
      {!previewInfo && !uploading && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            Seleccionar archivo
          </button>
          {acceptCamera && (
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              Cámara
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-xs text-gray-500 dark:text-gray-400 transition-colors disabled:opacity-50"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            URL
          </button>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {/* URL input */}
      {showUrlInput && !previewInfo && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none text-gray-800 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-3 py-2 bg-brand text-white rounded-xl text-sm font-semibold"
          >
            OK
          </button>
        </div>
      )}

      {/* Uploading progress */}
      {uploading && (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
            Comprimiendo y subiendo...
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">{progress}%</p>
        </div>
      )}

      {/* Preview */}
      {previewInfo && !uploading && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-800">
          <img
            src={previewInfo.url}
            alt="Vista previa"
            className="w-full h-40 object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="Quitar imagen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {(previewInfo.size || previewInfo.dims) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-1.5">
              <p className="text-[11px] text-white/90 flex items-center gap-2">
                {previewInfo.size && <span>{formatFileSize(previewInfo.size)}</span>}
                {previewInfo.dims?.width > 0 && (
                  <span>{previewInfo.dims.width}×{previewInfo.dims.height}</span>
                )}
                <span>{previewInfo.isSupabase ? 'Supabase' : 'URL externa'}</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
