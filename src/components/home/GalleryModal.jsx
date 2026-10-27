import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useReactions } from '../../hooks/useReactions';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { EmojiBurst } from './ReactionBar';
import ZoomableImage from './ZoomableImage';
import UserAvatar from '../common/UserAvatar';
import { useTheme } from '../../context/ThemeContext';
import { PublicacionesAPI } from '../../api/publicaciones';

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function GalleryModal({ item, items = [], index = 0, onNavigate, onClose }) {
  const [expandedImg, setExpandedImg] = useState(false);
  const [tagColorMap, setTagColorMap] = useState({});
  const { reacciones, misReacciones, toggle } = useReactions(item?.id);
  const { success, error, info } = useToast();
  const { isDark } = useTheme();

  // Evita que el fondo se pueda mover mientras el modal está abierto (y de
  // paso corrige que en algunos móviles el modal apareciera desplazado hacia
  // arriba en vez de centrado en la pantalla).
  useLockBodyScroll(Boolean(item));

  // Fetch etiquetas for backend colors
  useEffect(() => {
    if (!item) return;
    PublicacionesAPI.etiquetas()
      .then((tags) => {
        const map = {};
        (tags || []).forEach((t) => {
          if (t.nombre && t.color) map[t.nombre.toLowerCase()] = t.color;
        });
        setTagColorMap(map);
      })
      .catch(() => {});
  }, [item?.id]);

  // Restablece el modo expandido cada vez que se cambia de imagen
  useEffect(() => setExpandedImg(false), [item?.id]);

  // Navegación con teclado
  useEffect(() => {
    if (!item) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && items.length > 1) goTo(index + 1);
      if (e.key === 'ArrowLeft' && items.length > 1) goTo(index - 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [item, index, items]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;

  const goTo = (newIndex) => {
    if (!items.length) return;
    const safeIndex = (newIndex + items.length) % items.length;
    onNavigate?.(items[safeIndex], safeIndex);
  };

  const handleToggle = async (emoji) => {
    const ok = await toggle(emoji);
    if (!ok) error("Error de reacción", "No se pudo registrar tu reacción en la imagen.");
  };

  // Portal a document.body: el modal queda fuera del árbol de ancestros de
  // React en el DOM real, inmune a cualquier transform/filter/animation
  // que un ancestro lógico (secciones del Home, etc.) pudiera tener.
  return createPortal(
    <div
      className="modal-shell fixed inset-0 bg-black/85 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-6 py-6 sm:py-6 overflow-y-auto overscroll-contain"
      onClick={onClose}
    >
      <div
        className={`modal-shell__card w-full max-w-3xl rounded-2xl overflow-hidden relative shadow-2xl flex flex-col max-h-[calc(100dvh-3rem)] sm:max-h-[92dvh] ${
          isDark ? 'bg-[#171c26]' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-modal-titulo"
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className={`absolute top-3 right-4 z-20 text-2xl leading-none ${
            isDark ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header: autor/fecha/avatar/etiquetas */}
        <div className={`modal-shell__header flex items-center gap-3 px-5 py-3 shrink-0 ${
          isDark ? 'bg-black/20' : 'bg-gray-50 border-b border-gray-100'
        }`}>
          <UserAvatar username={item.autor} rol={item.autorRol} size="w-10 h-10" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {item.autor || 'Acueducto Los Guaduales'}
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatFecha(item.fechaCreacion)}
            </span>
          </div>
          {item.etiquetas?.length > 0 && (
            <div className="flex flex-wrap gap-1 shrink-0">
              {item.etiquetas.map((tag) => {
                const backendHex = tagColorMap[tag.toLowerCase()];
                const c = backendHex ? hexToTagColor(backendHex) : null;
                return (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md border capitalize"
                    style={c ? {
                      backgroundColor: isDark ? c.glassDark : c.glass,
                      color: isDark ? c.textDark : c.text,
                      borderColor: isDark ? c.borderDark : c.glassBorder,
                    } : {
                      backgroundColor: isDark ? 'rgba(100,130,255,0.25)' : 'rgba(100,130,255,0.15)',
                      color: isDark ? '#93b0ff' : '#3b5bdb',
                      borderColor: isDark ? 'rgba(100,130,255,0.3)' : 'rgba(100,130,255,0.3)',
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-shell__body flex-1 flex flex-col overflow-y-auto overscroll-contain min-h-0">
          {/* Imagen con zoom libre (rueda, pellizco, botones) y expandir */}
          <div
            className={
              expandedImg
                ? 'fixed inset-0 z-[100] bg-black'
                : 'relative z-0 bg-black h-72 sm:h-96 overflow-hidden shrink-0'
            }
          >
            <ZoomableImage
              key={item.id}
              src={item.imagenUrl}
              alt={item.titulo}
              expanded={expandedImg}
              onToggleExpand={() => setExpandedImg((v) => !v)}
            />

            {items.length > 1 && (
              <>
                <button
                  onClick={() => goTo(index - 1)}
                  aria-label="Anterior"
                  className="nav-btn absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => goTo(index + 1)}
                  aria-label="Siguiente"
                  className="nav-btn absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Título, descripción y reacciones */}
          <div className="px-5 py-4 shrink-0">
            <h3 id="gallery-modal-titulo" className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {item.titulo}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {item.descripcionCorta}
            </p>

            <ReactionBarThemed reacciones={reacciones} misReacciones={misReacciones} onToggle={handleToggle} isDark={isDark} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const EMOJIS_SUGERIDOS = ['👍', '❤️', '😮', '😂', '😢', '🔥', '🙏', '🚀'];

function ReactionBarThemed({ reacciones, misReacciones, onToggle, isDark }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [animEmoji, setAnimEmoji] = useState(null);
  const [customEmoji, setCustomEmoji] = useState('');
  const [burst, setBurst] = useState(null); // { emoji, anchor: 'chip' | 'add', key }
  const [pickerCoords, setPickerCoords] = useState(null);
  const pickerRef = useRef(null);
  const anchorBtnRef = useRef(null);
  const customInputRef = useRef(null);

  // El picker se monta en un portal (ver más abajo) porque este componente
  // vive dentro de contenedores con `overflow-hidden`/`overflow-y-auto`
  // (la tarjeta del modal y su footer). Si el picker fuera solo `absolute`
  // dentro de ese árbol, cualquier parte que sobresaliera del recuadro
  // visible del modal quedaba recortada, dando la impresión de que el
  // picker "se escondía detrás de la foto". Con el portal se posiciona con
  // coordenadas de viewport (calculadas desde el botón "+") y ya no depende
  // del overflow de sus ancestros.
  const PICKER_WIDTH = 232;
  const actualizarCoords = () => {
    const rect = anchorBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Evita que el picker se salga de la pantalla por la derecha (o por la
    // izquierda) en pantallas angostas: se limita `left` para que el ancho
    // completo del picker siempre quede dentro del viewport, con 8px de
    // margen a cada lado.
    const margen = 8;
    const left = Math.min(Math.max(rect.left, margen), window.innerWidth - PICKER_WIDTH - margen);
    setPickerCoords({ bottom: window.innerHeight - rect.top + 8, left });
  };

  useEffect(() => {
    if (!pickerOpen) return;
    actualizarCoords();
    const handler = (e) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        anchorBtnRef.current &&
        !anchorBtnRef.current.contains(e.target)
      ) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', actualizarCoords);
    window.addEventListener('scroll', actualizarCoords, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('resize', actualizarCoords);
      window.removeEventListener('scroll', actualizarCoords, true);
    };
  }, [pickerOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (pickerOpen) {
      setTimeout(() => customInputRef.current?.focus(), 50);
    }
  }, [pickerOpen]);

  const handleReact = (emoji, anchor = 'add') => {
    const trimmed = emoji.trim();
    if (!trimmed) return;
    const esNueva = !misReacciones.includes(trimmed);
    onToggle(trimmed);
    setAnimEmoji(trimmed);
    setTimeout(() => setAnimEmoji(null), 400);

    if (esNueva) {
      const key = Date.now();
      setBurst({ emoji: trimmed, anchor, key });
      setTimeout(() => {
        setBurst((prev) => (prev && prev.key === key ? null : prev));
      }, 900);
    }

    setPickerOpen(false);
    setCustomEmoji('');
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmoji.trim()) return;
    const primer = [...customEmoji.trim()][0];
    if (primer) handleReact(primer, 'add');
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 mt-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
      {reacciones
        .filter((r) => r.contador > 0)
        .map((r) => {
          const activo = misReacciones.includes(r.emoji);
          return (
            <button
              key={r.emoji}
              type="button"
              onClick={() => handleReact(r.emoji, 'chip')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                activo
                  ? 'bg-blue-500/20 border-brand-light text-white'
                  : isDark
                    ? 'bg-transparent border-white/20 text-gray-200 hover:bg-white/5'
                    : 'bg-transparent border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className={animEmoji === r.emoji ? 'emoji-anim inline-block' : 'inline-block'}>{r.emoji}</span>
              <span>{r.contador}</span>
              {burst?.anchor === 'chip' && burst.emoji === r.emoji && <EmojiBurst emoji={r.emoji} />}
            </button>
          );
        })}

      <div className="relative">
        <button
          ref={anchorBtnRef}
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          aria-label="Agregar reacción"
          className={`relative w-9 h-9 flex items-center justify-center rounded-full border text-lg transition-colors ${
            isDark ? 'border-white/20 text-gray-300 hover:bg-white/10' : 'border-gray-200 text-gray-500 hover:bg-gray-100'
          }`}
        >
          +
          {burst?.anchor === 'add' && <EmojiBurst emoji={burst.emoji} />}
        </button>

        {pickerOpen &&
          pickerCoords &&
          createPortal(
            <div
              ref={pickerRef}
              className={`fixed z-[130] shadow-xl rounded-2xl p-3 border ${
                isDark ? 'bg-[#212936] border-white/10' : 'bg-white border-gray-200'
              }`}
              style={{ width: 232, bottom: pickerCoords.bottom, left: pickerCoords.left }}
            >
              <div className="flex flex-wrap gap-1 mb-3">
                {EMOJIS_SUGERIDOS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReact(emoji)}
                    className={`w-9 h-9 flex items-center justify-center text-lg rounded-lg transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className={`border-t pt-2 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <p className={`text-[10px] mb-1.5 font-medium uppercase tracking-wide ${
                  isDark ? 'text-gray-400' : 'text-gray-400'
                }`}>Emoji personalizado</p>
                <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
                  <input
                    ref={customInputRef}
                    type="text"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    placeholder="Escribe un emoji…"
                    className={`flex-1 px-2.5 py-1.5 text-sm border rounded-lg outline-none focus:border-brand min-w-0 ${
                      isDark ? 'bg-[#171c26] border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                    maxLength={8}
                  />
                  <button
                    type="submit"
                    disabled={!customEmoji.trim()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-40 text-white transition-colors shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}

function hexToHSL(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hexToTagColor(hex) {
  const { h, s, l } = hexToHSL(hex);
  return {
    hsl: `${h} ${s}% ${l}%`,
    bg: `hsl(${h}, ${s}%, ${l}%)`,
    text: `hsl(${h}, ${s}%, 100%)`,
    glass: `hsla(${h}, ${s}%, ${l}%, 0.25)`,
    glassDark: `hsla(${h}, ${s}%, ${l}%, 0.3)`,
    glassBorder: `hsla(${h}, ${s}%, ${l}%, 0.4)`,
    borderDark: `hsla(${h}, ${s}%, ${l}%, 0.35)`,
    textDark: `hsl(${h}, ${s}%, 85%)`,
  };
}
