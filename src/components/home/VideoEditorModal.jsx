import { useState } from 'react';
import { X, Loader2, Video } from 'lucide-react';
import { PublicacionesAPI } from '../../api/publicaciones';
import { useToast } from '../../context/ToastContext';
import { getYouTubeId } from '../../utils/youtube';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

export default function VideoEditorModal({ open, onClose, onSaved }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [urlVideo, setUrlVideo] = useState('');
  const [saving, setSaving] = useState(false);
  const { success, error, warning, info } = useToast();

  useLockBodyScroll(Boolean(open), onClose);

  if (!open) return null;

  const handleClose = () => {
    setTitulo('');
    setDescripcion('');
    setUrlVideo('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !urlVideo.trim()) {
      warning("Campos requeridos", "Debes ingresar el título y la URL del video.");
      return;
    }
    if (!getYouTubeId(urlVideo.trim())) {
      warning("URL inválida", "La URL debe ser un enlace válido de YouTube.");
      return;
    }

    setSaving(true);
    try {
      await PublicacionesAPI.crearVideo({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        urlVideo: urlVideo.trim(),
      });
      success("Video publicado", "El video se agregó exitosamente al inicio.");
      onSaved?.();
      handleClose();
    } catch (err) {
      error("Error al publicar", err.message || 'No se pudo publicar el video.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 bg-black/60 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain" onClick={handleClose}>
      <div
        className="modal-shell__card bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-shell__header flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-brand" /> Publicar video
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
              URL de YouTube *
            </label>
            <input
              type="url"
              required
              value={urlVideo}
              onChange={(e) => setUrlVideo(e.target.value)}
              placeholder="https://youtu.be/..."
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Título *</label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Descripción</label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Publicando…' : 'Publicar video'}
          </button>
        </form>
      </div>
    </div>
  );
}
