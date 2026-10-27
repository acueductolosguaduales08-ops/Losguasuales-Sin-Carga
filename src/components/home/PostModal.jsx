import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useReactions } from '../../hooks/useReactions';
import { useToast } from '../../context/ToastContext';
import { useEtiquetasColor } from '../../hooks/useEtiquetasColor';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import ReactionBar from './ReactionBar';
import ZoomableImage from './ZoomableImage';
import UserAvatar from '../common/UserAvatar';

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function PostModal({ post, onClose }) {
  const [expandedImg, setExpandedImg] = useState(false);
  const { reacciones, misReacciones, toggle } = useReactions(post?.id);
  const { success, error, info } = useToast();
  const { colorDe } = useEtiquetasColor();

  // Evita que el fondo se pueda mover mientras el modal está abierto (y de
  // paso corrige que en algunos móviles el modal apareciera desplazado hacia
  // arriba en vez de centrado en la pantalla).
  useLockBodyScroll(Boolean(post), onClose);

  // Restablece el modo expandido cada vez que se abre otra publicación
  useEffect(() => setExpandedImg(false), [post?.id]);

  if (!post) return null;

  const handleToggle = async (emoji) => {
    const ok = await toggle(emoji);
    if (!ok) error("Error de reacción", "No se pudo registrar tu reacción en la publicación.");
  };

  const renderImagen = (wrapperClass) => (
    <div className={expandedImg ? 'fixed inset-0 z-[100] bg-black' : wrapperClass}>
      <ZoomableImage
        key={post.id}
        src={post.imagenUrl}
        alt={post.titulo}
        expanded={expandedImg}
        onToggleExpand={() => setExpandedImg((v) => !v)}
      />
    </div>
  );

  // Portal a document.body: el modal queda fuera del árbol de ancestros de
  // React en el DOM real, inmune a cualquier transform/filter/animation
  // que un ancestro lógico (secciones del Home, etc.) pudiera tener.
  return createPortal(
    <div
      className="modal-shell fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-8 pt-8 pb-8"
      onClick={onClose}
    >
      <div
        className="modal-shell__card bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl overflow-hidden relative shadow-2xl flex flex-col max-h-[calc(100dvh-4rem)] sm:max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-modal-titulo"
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header fijo con avatar */}
        <div className="shrink-0 flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/10">
          <UserAvatar username={post.autor} rol={post.autorRol} size="w-10 h-10" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-gray-800 dark:text-white">{post.autor}</h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formatFecha(post.fechaCreacion)}</span>
          </div>
          {post.categoria && (
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 capitalize shrink-0">
              {post.categoria}
            </span>
          )}
        </div>

        {/* Body con scroll */}
        <div className="modal-shell__body overflow-y-auto overscroll-contain flex-1 min-h-0">
          {post.imagenUrl &&
            post.posicionImagen === 'ARRIBA' &&
            renderImagen('relative bg-black overflow-hidden h-72 shrink-0')}

          <div className="p-6 sm:p-8">
            <h2 id="post-modal-titulo" className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{post.titulo}</h2>

            {post.imagenUrl &&
              post.posicionImagen === 'MEDIO' &&
              renderImagen('relative bg-black overflow-hidden h-64 rounded-xl mb-4')}

            {/* Contenido HTML enriquecido: tablas, listas, alineaciones, enlaces, etc. */}
            <div
              className="prose-content text-gray-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.contenidoCompleto || post.descripcionCorta || '' }}
            />

            {post.imagenUrl &&
              post.posicionImagen === 'ABAJO' &&
              renderImagen('relative bg-black overflow-hidden h-64 rounded-xl mt-4')}

            {(post.etiquetas || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {post.etiquetas.map((tag) => (
                  <span
                    key={tag}
                    style={{ borderColor: colorDe(tag), color: colorDe(tag) }}
                    className="text-xs bg-transparent border px-2.5 py-1 rounded-full capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <ReactionBar reacciones={reacciones} misReacciones={misReacciones} onToggle={handleToggle} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
