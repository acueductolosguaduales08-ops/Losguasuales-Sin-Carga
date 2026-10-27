import { useEffect, useRef, useState, useCallback } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { X, Loader2, Tag, FolderOpen, Plus, Sparkles, Eye, Code2, Trash2 } from 'lucide-react';
import { PublicacionesAPI, GALLERY_CATEGORY } from '../../api/publicaciones';
import { useToast } from '../../context/ToastContext';
import RichTextToolbar from './RichTextToolbar';
import ImageUploader from '../common/ImageUploader';

const DEFAULT_TAG_COLOR = '#2563EB';

export default function PostEditorModal({ open, initialPost, onClose, onSaved }) {
  useLockBodyScroll(Boolean(open), onClose);

  const isEditing = !!initialPost;
  const textareaRef = useRef(null);
  const { success, error, warning } = useToast();

  const [esGaleria, setEsGaleria] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcionCorta, setDescripcionCorta] = useState('');
  const [contenidoCompleto, setContenidoCompleto] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [posicionImagen, setPosicionImagen] = useState('ARRIBA');
  const [categoriaId, setCategoriaId] = useState('');
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState([]);
  const [destacada, setDestacada] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [galeriaCategoriaId, setGaleriaCategoriaId] = useState(null);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');
  const [nuevaEtiquetaColor, setNuevaEtiquetaColor] = useState(DEFAULT_TAG_COLOR);
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [showNuevaEtiqueta, setShowNuevaEtiqueta] = useState(false);
  const [etiquetaBorrando, setEtiquetaBorrando] = useState(null);
  const [confirmBorrarEtiqueta, setConfirmBorrarEtiqueta] = useState(null);
  const longPressTimer = useRef(null);

  const [saving, setSaving] = useState(false);
  const [publishNow, setPublishNow] = useState(true);

  useEffect(() => {
    if (!open) return;
    Promise.all([PublicacionesAPI.categorias(), PublicacionesAPI.etiquetas()])
      .then(([cats, tags]) => {
        const categoriasNormales = (cats || []).filter((c) => (c.nombre || '').toLowerCase() !== GALLERY_CATEGORY);
        const categoriaGaleria = (cats || []).find((c) => (c.nombre || '').toLowerCase() === GALLERY_CATEGORY);
        setCategorias(categoriasNormales);
        setGaleriaCategoriaId(categoriaGaleria?.id ?? null);
        setEtiquetas(tags || []);
      })
        .catch(() => error('Error al cargar', 'No se pudieron cargar las categorías y etiquetas.'));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    if (initialPost) {
      const galeria = (initialPost.categoria || '').toLowerCase() === GALLERY_CATEGORY;
      setTitulo(initialPost.titulo || '');
      setDescripcionCorta(initialPost.descripcionCorta || '');
      setContenidoCompleto(initialPost.contenidoCompleto || '');
      setImagenUrl(initialPost.imagenUrl || '');
      setPosicionImagen(initialPost.posicionImagen || 'ARRIBA');
      setDestacada(!!initialPost.destacada);
      setEsGaleria(galeria);
      setEtiquetasSeleccionadas(initialPost.etiquetasIds || []);
      setPublishNow(initialPost.estado === 'PUBLICADA');
    } else {
      setTitulo('');
      setDescripcionCorta('');
      setContenidoCompleto('');
      setImagenUrl('');
      setPosicionImagen('ARRIBA');
      setCategoriaId('');
      setEtiquetasSeleccionadas([]);
      setDestacada(false);
      setEsGaleria(false);
      setPublishNow(true);
    }
    setVistaPrevia(false);
    setShowNuevaCategoria(false);
    setShowNuevaEtiqueta(false);
    setSaving(false);
  }, [open, initialPost]);

  // Long-press para borrar etiqueta
  const onTagPointerDown = useCallback((tag) => {
    longPressTimer.current = setTimeout(() => {
      setConfirmBorrarEtiqueta(tag);
      longPressTimer.current = null;
    }, 600);
  }, []);

  const onTagPointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  if (!open) return null;

  const toggleEtiqueta = (id) => {
    setEtiquetasSeleccionadas((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  };

  const crearCategoriaRapida = async () => {
    if (!nuevaCategoria.trim()) return;
    try {
      const cat = await PublicacionesAPI.crearCategoria(nuevaCategoria.trim());
      setCategorias((prev) => [...prev, cat]);
      setCategoriaId(cat.id);
      setNuevaCategoria('');
      setShowNuevaCategoria(false);
      success('Categoría creada', 'La categoría se agregó exitosamente.');
    } catch {
      error('Error al crear', 'No se pudo crear la categoría intenta de nuevo.');
    }
  };

  const crearEtiquetaRapida = async () => {
    if (!nuevaEtiqueta.trim()) return;
    try {
      const tag = await PublicacionesAPI.crearEtiqueta(nuevaEtiqueta.trim(), nuevaEtiquetaColor);
      setEtiquetas((prev) => [...prev, tag]);
      setEtiquetasSeleccionadas((prev) => [...prev, tag.id]);
      setNuevaEtiqueta('');
      setNuevaEtiquetaColor(DEFAULT_TAG_COLOR);
      setShowNuevaEtiqueta(false);
      success('Etiqueta creada', 'La etiqueta se agregó exitosamente.');
    } catch {
      error('Error al crear', 'No se pudo crear la etiqueta intenta de nuevo.');
    }
  };

  const handleEliminarEtiqueta = async () => {
    const tag = confirmBorrarEtiqueta;
    if (!tag) return;
    setEtiquetaBorrando(tag.id);
    try {
      await PublicacionesAPI.eliminarEtiqueta(tag.id);
      setEtiquetas((prev) => prev.filter((t) => t.id !== tag.id));
      setEtiquetasSeleccionadas((prev) => prev.filter((id) => id !== tag.id));
      success('Etiqueta eliminada', `La etiqueta "${tag.nombre}" fue eliminada.`);
    } catch {
      error('Error al eliminar', 'No se pudo eliminar la etiqueta intenta de nuevo.');
    } finally {
      setEtiquetaBorrando(null);
      setConfirmBorrarEtiqueta(null);
    }
  };

  // Busca la categoría "gallery" existente, o la crea si aún no existe en el backend.
  const obtenerIdCategoriaGaleria = async () => {
    if (galeriaCategoriaId) return galeriaCategoriaId;
    const creada = await PublicacionesAPI.crearCategoria(GALLERY_CATEGORY);
    setGaleriaCategoriaId(creada.id);
    return creada.id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !imagenUrl.trim()) {
      warning('Campos obligatorios', 'El título y la imagen son requeridos para continuar.');
      return;
    }

    setSaving(true);
    try {
      let payload;

      if (esGaleria) {
        const catId = await obtenerIdCategoriaGaleria();
        // La galería solo necesita título, descripción corta, imagen y etiqueta;
        // el resto de campos van con un valor por defecto ya que la API los exige.
        payload = {
          titulo: titulo.trim(),
          descripcionCorta: descripcionCorta.trim(),
          contenidoCompleto: descripcionCorta.trim(),
          imagenUrl: imagenUrl.trim(),
          posicionImagen: 'ARRIBA',
          categoriaId: catId,
          etiquetasIds: etiquetasSeleccionadas,
          destacada,
        };
      } else {
        payload = {
          titulo: titulo.trim(),
          descripcionCorta: descripcionCorta.trim(),
          contenidoCompleto,
          imagenUrl: imagenUrl.trim(),
          posicionImagen,
          categoriaId: categoriaId || undefined,
          etiquetasIds: etiquetasSeleccionadas,
          destacada,
        };
      }

      const resultado = isEditing
        ? await PublicacionesAPI.editar(initialPost.id, payload)
        : await PublicacionesAPI.crear(payload);

      const yaPublicada = resultado.estado === 'PUBLICADA';
      if (publishNow && !yaPublicada) await PublicacionesAPI.publicar(resultado.id);
      if (!publishNow && yaPublicada) await PublicacionesAPI.ocultar(resultado.id);

      success(esGaleria ? 'Imagen guardada' : 'Publicación guardada', esGaleria ? 'La imagen se agregó a la galería.' : 'La publicación se guardó correctamente.');
      onSaved?.();
      onClose();
    } catch (err) {
      error('Error al guardar', err.message || 'No se pudo guardar la publicación.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 bg-black/60 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain" onClick={onClose}>
      <div
        className="modal-shell__card bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-shell__header flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {isEditing ? 'Editar publicación' : 'Nueva publicación'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-shell__body p-6 space-y-5 overflow-y-auto flex-1">
          {/* Toggle Es galería */}
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand shrink-0" />
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-white">Publicar en la galería</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Solo se mostrará imagen, título, descripción y reacciones.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEsGaleria((v) => !v)}
              disabled={isEditing}
              className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors shrink-0 disabled:opacity-50 ${
                esGaleria ? 'bg-brand justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'
              }`}
            >
              <span className="w-5 h-5 bg-white rounded-full shadow" />
            </button>
          </div>

          {/* Imagen + vista previa */}
          <ImageUploader
            bucket="publicaciones"
            folder="posts"
            value={imagenUrl}
            onChange={setImagenUrl}
            label="Imagen *"
            required
          />
          {!esGaleria && (
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                Posición de la imagen
              </label>
              <select
                value={posicionImagen}
                onChange={(e) => setPosicionImagen(e.target.value)}
                className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none text-gray-800 dark:text-white"
              >
                <option value="ARRIBA">Imagen arriba</option>
                <option value="MEDIO">Imagen en medio</option>
                <option value="ABAJO">Imagen abajo</option>
              </select>
            </div>
          )}

          {/* Título */}
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

          {/* Descripción corta */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
              Descripción corta
            </label>
            <textarea
              rows={esGaleria ? 3 : 2}
              value={descripcionCorta}
              onChange={(e) => setDescripcionCorta(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white resize-none"
            />
          </div>

          {/* Contenido completo — solo si NO es galería */}
          {!esGaleria && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">
                  Contenido completo
                </label>
                <button
                  type="button"
                  onClick={() => setVistaPrevia((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark"
                >
                  {vistaPrevia ? <Code2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {vistaPrevia ? 'Ver HTML' : 'Vista previa'}
                </button>
              </div>

              {vistaPrevia ? (
                <div className="w-full min-h-[180px] px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl">
                  <div
                    className="prose-content text-sm text-gray-800 dark:text-gray-100"
                    dangerouslySetInnerHTML={{ __html: contenidoCompleto || '<p class="text-gray-400">Sin contenido aún…</p>' }}
                  />
                </div>
              ) : (
                <div className="w-full">
                  <RichTextToolbar textareaRef={textareaRef} onChange={setContenidoCompleto} />
                  <textarea
                    ref={textareaRef}
                    rows={7}
                    value={contenidoCompleto}
                    onChange={(e) => setContenidoCompleto(e.target.value)}
                    placeholder="Puedes usar HTML simple: negritas, títulos, listas, tablas, enlaces…"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-b-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white font-mono resize-y min-h-[140px]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Categoría — solo si NO es galería */}
          {!esGaleria && (
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                <FolderOpen className="w-3.5 h-3.5" /> Categoría
              </label>
              <div className="flex gap-2">
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none text-gray-800 dark:text-white"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNuevaCategoria((v) => !v)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {showNuevaCategoria && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    placeholder="Nombre de la nueva categoría"
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none text-gray-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={crearCategoriaRapida}
                    className="px-3 py-2 bg-brand text-white rounded-xl text-sm font-semibold"
                  >
                    Crear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Etiquetas — siempre visibles (la galería solo necesita una etiqueta simple) */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Etiqueta{!esGaleria && 's'}
              <span className="font-normal text-gray-400 ml-1">(mantén pulsado para borrar)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {etiquetas.map((tag) => {
                const seleccionada = etiquetasSeleccionadas.includes(tag.id);
                const color = tag.color || DEFAULT_TAG_COLOR;
                const borrando = etiquetaBorrando === tag.id;
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => {
                      if (esGaleria) {
                        setEtiquetasSeleccionadas(seleccionada ? [] : [tag.id]);
                      } else {
                        toggleEtiqueta(tag.id);
                      }
                    }}
                    onPointerDown={() => onTagPointerDown(tag)}
                    onPointerUp={onTagPointerUp}
                    onPointerLeave={onTagPointerUp}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setConfirmBorrarEtiqueta(tag);
                    }}
                    disabled={borrando}
                    style={
                      seleccionada
                        ? { backgroundColor: color, borderColor: color }
                        : { borderColor: color, color }
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${
                      seleccionada ? 'text-white' : 'bg-transparent'
                    } ${borrando ? 'opacity-50 scale-95' : ''}`}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                      style={{ backgroundColor: seleccionada ? '#fff' : color }}
                    />
                    {tag.nombre}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowNuevaEtiqueta((v) => !v)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {showNuevaEtiqueta && (
              <div className="flex gap-2 mt-2 items-center">
                <input
                  type="color"
                  value={nuevaEtiquetaColor}
                  onChange={(e) => setNuevaEtiquetaColor(e.target.value)}
                  title="Color de la etiqueta"
                  className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent cursor-pointer shrink-0 p-0.5"
                />
                <input
                  type="text"
                  value={nuevaEtiqueta}
                  onChange={(e) => setNuevaEtiqueta(e.target.value)}
                  placeholder="Nombre de la nueva etiqueta"
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none text-gray-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={crearEtiquetaRapida}
                  className="px-3 py-2 bg-brand text-white rounded-xl text-sm font-semibold shrink-0"
                >
                  Crear
                </button>
              </div>
            )}
          </div>

          {/* Opciones finales */}
          <div className="flex flex-wrap gap-6 pt-2 border-t border-gray-100 dark:border-white/10">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={destacada}
                onChange={(e) => setDestacada(e.target.checked)}
                className="w-4 h-4 accent-brand"
              />
              Destacar en el inicio
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
                className="w-4 h-4 accent-brand"
              />
              Publicar ahora
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : esGaleria ? 'Agregar a la galería' : 'Publicar'}
          </button>
        </form>
      </div>

      {/* Confirmación de borrado de etiqueta */}
      {confirmBorrarEtiqueta && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white">Eliminar etiqueta</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Se eliminará <strong>"{confirmBorrarEtiqueta.nombre}"</strong> y se desvinculará de todas las publicaciones.
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmBorrarEtiqueta(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarEtiqueta}
                disabled={etiquetaBorrando === confirmBorrarEtiqueta.id}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5"
              >
                {etiquetaBorrando === confirmBorrarEtiqueta.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
