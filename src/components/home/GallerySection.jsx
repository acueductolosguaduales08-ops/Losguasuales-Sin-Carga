import { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { HomeAPI } from '../../api/home';
import { PublicacionesAPI, GALLERY_CATEGORY } from '../../api/publicaciones';
import { getTagColor } from '../../utils/tagColors';

// Tamaño fijo para cada imagen en el scroll horizontal
const IMG_W = 160; // px
const IMG_H = 160; // px
const GAP = 12;    // px

export default function GallerySection({ onOpenItem }) {
  const [filtro, setFiltro] = useState('todos');
  const [tagColorMap, setTagColorMap] = useState({});

  useEffect(() => {
    PublicacionesAPI.etiquetas()
      .then((tags) => {
        const map = {};
        (tags || []).forEach((t) => {
          if (t.nombre && t.color) map[t.nombre.toLowerCase()] = t.color;
        });
        setTagColorMap(map);
      })
      .catch(() => {});
  }, []);

  const { data, loading, error } = useFetch(() => HomeAPI.publicacionesPublicas({ page: 0, size: 48 }), []);

  const itemsGaleria = useMemo(() => {
    const content = data?.content || [];
    return content.filter((p) => (p.categoria || '').toLowerCase() === GALLERY_CATEGORY);
  }, [data]);

  const etiquetasDisponibles = useMemo(() => {
    const set = new Set();
    itemsGaleria.forEach((p) => (p.etiquetas || []).forEach((e) => set.add(e)));
    return Array.from(set);
  }, [itemsGaleria]);

  const itemsFiltrados = useMemo(() => {
    if (filtro === 'todos') return itemsGaleria;
    return itemsGaleria.filter((p) => (p.etiquetas || []).some((e) => e.toLowerCase() === filtro.toLowerCase()));
  }, [itemsGaleria, filtro]);

  // Dividir en 2 filas alternando: fila1 = índices pares, fila2 = índices impares
  const fila1 = useMemo(() => itemsFiltrados.filter((_, i) => i % 2 === 0), [itemsFiltrados]);
  const fila2 = useMemo(() => itemsFiltrados.filter((_, i) => i % 2 === 1), [itemsFiltrados]);

  return (
    <section id="galeria" className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="w-5 h-5 text-brand" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Galería</h2>
      </div>

      {etiquetasDisponibles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-1">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              filtro === 'todos'
                ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 shadow-md'
                : 'bg-gray-200 dark:bg-dark-muted text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-dark-muted/80'
            }`}
          >
            Todos
          </button>
          {etiquetasDisponibles.map((tag) => {
            const backendColor = tagColorMap[tag.toLowerCase()];
            const c = backendColor ? hexToTagColor(backendColor) : getTagColor(tag);
            const activo = filtro === tag;
            return (
              <button
                key={tag}
                onClick={() => setFiltro(activo ? 'todos' : tag)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-all duration-300 ${
                  activo
                    ? 'text-white shadow-lg scale-105 backdrop-blur-md border'
                    : 'text-gray-700 dark:text-gray-200 hover:scale-105 border border-transparent'
                }`}
                style={{
                  backgroundColor: activo ? c.glass : undefined,
                  borderColor: activo ? c.glassBorder : undefined,
                  color: activo ? c.text : undefined,
                  boxShadow: activo ? `0 4px 20px ${c.glass}` : undefined,
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="space-y-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
          <div className="flex gap-3" style={{ width: 'max-content' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse shrink-0"
                style={{ width: IMG_W, height: IMG_H }} />
            ))}
          </div>
          <div className="flex gap-3" style={{ width: 'max-content' }}>
            {[5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse shrink-0"
                style={{ width: IMG_W, height: IMG_H }} />
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-gray-400">No se pudo cargar la galería.</p>}

      {!loading && !error && itemsFiltrados.length === 0 && (
        <p className="text-sm text-gray-400 py-6">Aún no hay imágenes publicadas en la galería.</p>
      )}

      {!loading && itemsFiltrados.length > 0 && (
        /* Wrapper con overflow-x-auto: ambas filas se desplazan juntas */
        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
          <div className="flex flex-col gap-3" style={{ width: 'max-content' }}>
            {/* Fila 1 */}
            <div className="flex" style={{ gap: GAP }}>
              {fila1.map((item, index) => (
                <GalleryThumb
                  key={item.id}
                  item={item}
                  onClick={() => onOpenItem(item, itemsFiltrados, index * 2)}
                  width={IMG_W}
                  height={IMG_H}
                  tagColorMap={tagColorMap}
                />
              ))}
            </div>
            {/* Fila 2 (solo si hay elementos) */}
            {fila2.length > 0 && (
              <div className="flex" style={{ gap: GAP }}>
                {fila2.map((item, index) => (
                <GalleryThumb
                  key={item.id}
                  item={item}
                  onClick={() => onOpenItem(item, itemsFiltrados, index * 2 + 1)}
                  width={IMG_W}
                  height={IMG_H}
                  tagColorMap={tagColorMap}
                />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function GalleryThumb({ item, onClick, width, height, tagColorMap = {} }) {
  const [loaded, setLoaded] = useState(false);
  const etiquetas = item.etiquetas || [];
  const primerTag = etiquetas.length > 0 ? etiquetas[0] : null;
  const backendColor = primerTag ? tagColorMap[primerTag.toLowerCase()] : null;
  const tagColor = backendColor ? hexToTagColor(backendColor) : (primerTag ? getTagColor(primerTag) : null);
  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-900 text-left shrink-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{ width, height }}
    >
      <img
        src={item.imagenUrl}
        alt={item.titulo}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 transition-opacity ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
      />
      {/* Etiqueta arriba a la derecha en hover con color de la etiqueta */}
      {primerTag && (
        <span
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 capitalize z-10 border"
          style={{
            backgroundColor: tagColor.glass,
            color: tagColor.text,
            borderColor: tagColor.glassBorder,
          }}
        >
          {primerTag}
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
        <h3 className="font-bold text-xs text-white truncate">{item.titulo}</h3>
      </div>
    </button>
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
    glassBorder: `hsla(${h}, ${s}%, ${l}%, 0.4)`,
  };
}
