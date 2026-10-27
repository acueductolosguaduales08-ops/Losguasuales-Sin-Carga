import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { getYouTubeEmbedUrl } from '../../utils/youtube';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { Z } from '../../utils/zIndex';

export default function VideoPlayerModal({ video, onClose }) {
  useLockBodyScroll(Boolean(video), onClose);

  if (!video) return null;

  const embedUrl = getYouTubeEmbedUrl(video.urlVideo);

  // Portal a document.body: así el modal queda completamente fuera del
  // árbol de ancestros de React en el DOM real, inmune a cualquier
  // `transform`/`filter`/`animation` que un ancestro lógico (por ejemplo
  // una sección con animación de entrada) pudiera tener, presente o
  // futuro.
  return createPortal(
    <div
      className="modal-shell fixed inset-0 bg-black/85 flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain"
      style={{ zIndex: Z.modal }}
      onClick={onClose}
    >
      <div
        className="modal-shell__card w-full max-w-2xl sm:bg-transparent bg-[#0F1012] flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-modal-titulo"
      >
        <div className="modal-shell__header flex justify-between items-center gap-3 p-4 sm:p-0 sm:mb-3">
          <h3 id="video-modal-titulo" className="text-white font-bold truncate">{video.titulo}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-white/80 hover:text-white shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain px-4 sm:px-0 pb-4 sm:pb-0">
          <div className="aspect-video w-full bg-black rounded-xl overflow-hidden">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={video.titulo}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <a
                  href={video.urlVideo}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-light underline text-sm"
                >
                  Abrir video en una nueva pestaña
                </a>
              </div>
            )}
          </div>

          {video.descripcion && <p className="text-sm text-gray-300 mt-3">{video.descripcion}</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}
