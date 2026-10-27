import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SmilePlus, Send } from 'lucide-react';

const EMOJIS_SUGERIDOS = ['👍', '❤️', '😮', '😂', '😢', '🔥', '🙏', '🚀'];

// Partículas del emoji que se usa en la reacción, para el efecto de "explosión" al reaccionar.
export function EmojiBurst({ emoji }) {
  return (
    <span className="emoji-burst" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i}>{emoji}</span>
      ))}
    </span>
  );
}

export default function ReactionBar({ reacciones, misReacciones, onToggle }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [animEmoji, setAnimEmoji] = useState(null);
  const [customEmoji, setCustomEmoji] = useState('');
  // burst: { emoji, anchor: 'chip' | 'add', key } — controla dónde y con qué emoji se muestra la explosión
  const [burst, setBurst] = useState(null);
  const [pickerCoords, setPickerCoords] = useState(null);
  const pickerRef = useRef(null);
  const anchorBtnRef = useRef(null);
  const customInputRef = useRef(null);

  // Igual que en GalleryModal: este componente puede vivir dentro de un
  // contenedor con overflow recortado (PostModal), así que el picker se
  // monta en un portal con coordenadas de viewport en vez de `absolute`
  // relativo a un ancestro que podría recortarlo.
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

  // Al abrir el picker, enfocar el input de emoji personalizado
  useEffect(() => {
    if (pickerOpen) {
      setTimeout(() => customInputRef.current?.focus(), 50);
    }
  }, [pickerOpen]);

  const handleReact = (emoji, anchor = 'add') => {
    const trimmed = emoji.trim();
    if (!trimmed) return;
    const esNueva = !misReacciones.includes(trimmed); // true = el usuario aún no había reaccionado con este emoji
    onToggle(trimmed);
    setAnimEmoji(trimmed);
    setTimeout(() => setAnimEmoji(null), 400);

    // La explosión de emojis solo aparece la primera vez que se agrega una reacción,
    // no cuando se quita ni cuando se repite una que ya estaba activa.
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
    // Tomar solo el primer carácter/emoji del input
    const primer = [...customEmoji.trim()][0];
    if (primer) handleReact(primer, 'add');
  };

  return (
    <div className="reaction-bar flex flex-wrap items-center gap-2 mt-2 pt-3 border-t border-gray-200 dark:border-white/10">
      {reacciones
        .filter((r) => r.contador > 0)
        .map((r) => {
          const activo = misReacciones.includes(r.emoji);
          return (
            <button
              key={r.emoji}
              type="button"
              onClick={() => handleReact(r.emoji, 'chip')}
              className={`reaction-btn relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                activo
                  ? 'bg-blue-500/10 border-brand text-brand-dark dark:text-brand-light'
                  : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
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
          className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <SmilePlus className="w-4 h-4" />
          {burst?.anchor === 'add' && <EmojiBurst emoji={burst.emoji} />}
        </button>

        {pickerOpen &&
          pickerCoords &&
          createPortal(
            <div
              ref={pickerRef}
              className="fixed z-[130] bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-3 border border-gray-100 dark:border-white/10"
              style={{ width: 232, bottom: pickerCoords.bottom, left: pickerCoords.left }}
            >
              {/* Emojis rápidos */}
              <div className="flex flex-wrap gap-1 mb-3">
                {EMOJIS_SUGERIDOS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleReact(emoji)}
                    className="w-9 h-9 flex items-center justify-center text-lg rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Input personalizado */}
              <div className="border-t border-gray-100 dark:border-white/10 pt-2">
                <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Emoji personalizado</p>
                <form onSubmit={handleCustomSubmit} className="flex gap-1.5">
                  <input
                    ref={customInputRef}
                    type="text"
                    value={customEmoji}
                    onChange={(e) => setCustomEmoji(e.target.value)}
                    placeholder="Escribe un emoji…"
                    className="flex-1 px-2.5 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-brand text-gray-800 dark:text-white min-w-0"
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
