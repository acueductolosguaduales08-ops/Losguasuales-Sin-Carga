import { useCallback, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const STEP = 0.6;
const DOUBLE_TAP_MS = 300;

function clamp(value) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

// Visor de imagen con zoom libre (rueda del mouse, pellizco táctil y botones),
// arrastre para desplazarse cuando está ampliada, doble click/doble tap para
// un acercamiento rápido, y un botón de expandir que NO reinicia el zoom
// (el componente no se desmonta al expandir, solo cambia el tamaño de su
// contenedor desde el componente padre).
export default function ZoomableImage({ src, alt, expanded = false, onToggleExpand, imgClassName = '' }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const pointers = useRef(new Map());
  const dragRef = useRef(null);
  const pinchRef = useRef(null);
  const lastTapRef = useRef(0);

  const zoomed = scale > 1.01;

  const resetZoom = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const setClampedScale = useCallback((next) => {
    const s = clamp(next);
    setScale(s);
    if (s <= 1) setPos({ x: 0, y: 0 });
  }, []);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.4 : 0.4;
    setClampedScale(scale + delta);
  };

  const handleDoubleTrigger = () => {
    if (zoomed) resetZoom();
    else setClampedScale(2.2);
  };

  const handlePointerDown = (e) => {
    containerRef.current?.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      pinchRef.current = { dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y), scale };
      dragRef.current = null;
    } else if (pointers.current.size === 1) {
      // Pointer Events no siempre dispara onDoubleClick en táctiles, así que
      // detectamos el doble tap manualmente.
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_MS) {
        handleDoubleTrigger();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }

      if (zoomed) {
        dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ratio = dist / (pinchRef.current.dist || 1);
      setClampedScale(pinchRef.current.scale * ratio);
    } else if (dragRef.current && zoomed) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
    }
  };

  const endPointer = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) dragRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center touch-none select-none"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={endPointer}
      onDoubleClick={handleDoubleTrigger}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`max-w-full max-h-full select-none transition-transform duration-150 ease-out will-change-transform ${
          zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        } ${imgClassName}`}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
      />

      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setClampedScale(scale - STEP);
          }}
          disabled={scale <= MIN_SCALE}
          aria-label="Alejar imagen"
          className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 disabled:opacity-30 text-white flex items-center justify-center transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setClampedScale(scale + STEP);
          }}
          disabled={scale >= MAX_SCALE}
          aria-label="Acercar imagen"
          className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 disabled:opacity-30 text-white flex items-center justify-center transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        {onToggleExpand && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            aria-label={expanded ? 'Salir de pantalla completa' : 'Expandir imagen'}
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
