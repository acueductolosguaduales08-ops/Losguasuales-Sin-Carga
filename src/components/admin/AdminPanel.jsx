import { useEffect, useMemo, useState } from 'react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import {
  X,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Loader2,
  Image as ImageIcon,
  Megaphone,
} from 'lucide-react';
import { PublicacionesAPI, GALLERY_CATEGORY } from '../../api/publicaciones';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import PostEditorModal from './PostEditorModal';

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

const ESTADO_STYLE = {
  PUBLICADA: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  BORRADOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  OCULTA: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export default function AdminPanel({ open, initialTab = 'publicaciones', onClose }) {
  useLockBodyScroll(Boolean(open), onClose);

  const [tab, setTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [actioningId, setActioningId] = useState(null);

  const { rol } = useAuth();
  const { success, error } = useToast();
  const esAdmin = rol === 'ADMINISTRADOR';

  const cargar = () => {
    setLoading(true);
    PublicacionesAPI.listarAdmin({ page: 0, size: 100 })
      .then((data) => setItems(data?.content || data || []))
      .catch(() => error("Error al cargar", "No se pudieron cargar las publicaciones."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) cargar();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  const itemsFiltrados = useMemo(() => {
    const esGaleriaTab = tab === 'galeria';
    let base = items.filter((p) =>
      esGaleriaTab
        ? (p.categoria || '').toLowerCase() === GALLERY_CATEGORY
        : (p.categoria || '').toLowerCase() !== GALLERY_CATEGORY
    );
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      base = base.filter((p) => (p.titulo || '').toLowerCase().includes(q));
    }
    return base;
  }, [items, tab, busqueda]);

  if (!open) return null;

  const runAction = async (id, fn, successMsg) => {
    setActioningId(id);
    try {
      await fn();
      success(successMsg.title, successMsg.desc);
      cargar();
    } catch (err) {
      error("Error en acción", err.message || 'No se pudo completar la acción.');
    } finally {
      setActioningId(null);
    }
  };

  const handleTogglePublicado = (post) => {
    if (post.estado === 'PUBLICADA') {
      runAction(post.id, () => PublicacionesAPI.ocultar(post.id), { title: 'Contenido ocultado', desc: 'La publicación ya no es visible en el inicio.' });
    } else {
      runAction(post.id, () => PublicacionesAPI.publicar(post.id), { title: 'Contenido publicado', desc: 'La publicación ahora es visible en el inicio.' });
    }
  };

  const handleToggleDestacada = (post) => {
    runAction(
      post.id,
      () => PublicacionesAPI.destacar(post.id, !post.destacada),
      !post.destacada
        ? { title: 'Marcado como destacado', desc: 'La publicación aparecerá destacada en el inicio.' }
        : { title: 'Destacado removido', desc: 'La publicación ya no está destacada.' }
    );
  };

  const handleEliminar = (post) => {
    if (!window.confirm(`¿Eliminar definitivamente "${post.titulo}"? Esta acción no se puede deshacer.`)) return;
    runAction(post.id, () => PublicacionesAPI.eliminar(post.id), { title: 'Publicación eliminada', desc: 'La publicación fue eliminada permanentemente.' });
  };

  const openNew = () => {
    setEditingPost(null);
    setEditorOpen(true);
  };

  const openEdit = (post) => {
    setEditingPost(post);
    setEditorOpen(true);
  };

  return (
    <div className="modal-shell fixed inset-0 bg-black/60 z-[100] flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="modal-shell__card bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl my-4 shadow-2xl relative flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-shell__header flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Panel de contenido</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 shrink-0">
          <button
            onClick={() => setTab('publicaciones')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'publicaciones' ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Megaphone className="w-4 h-4" /> Publicaciones
          </button>
          <button
            onClick={() => setTab('galeria')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'galeria' ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Galería
          </button>
        </div>

        {/* Buscador + nuevo */}
        <div className="flex gap-2 px-6 py-4 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título…"
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand text-gray-800 dark:text-white"
            />
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>

        {/* Lista */}
        <div className="modal-shell__body flex-1 overflow-y-auto px-6 pb-6 space-y-3">
          {loading && (
            <>
              <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <div className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </>
          )}

          {!loading && itemsFiltrados.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">
              {tab === 'galeria' ? 'Aún no hay imágenes en la galería.' : 'Aún no hay publicaciones.'}
            </p>
          )}

          {!loading &&
            itemsFiltrados.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <img
                  src={post.imagenUrl}
                  alt={post.titulo}
                  loading="lazy"
                  className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-100 dark:bg-gray-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800 dark:text-white truncate">{post.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_STYLE[post.estado] || ESTADO_STYLE.BORRADOR}`}>
                      {post.estado}
                    </span>
                    {post.destacada && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        Destacada
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatFecha(post.fechaCreacion)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {actioningId === post.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-2" />
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggleDestacada(post)}
                        title={post.destacada ? 'Quitar destacado' : 'Destacar'}
                        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          post.destacada ? 'text-amber-500' : 'text-gray-400'
                        }`}
                      >
                        <Star className="w-4 h-4" fill={post.destacada ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => handleTogglePublicado(post)}
                        title={post.estado === 'PUBLICADA' ? 'Ocultar' : 'Publicar'}
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {post.estado === 'PUBLICADA' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(post)}
                        title="Editar"
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {esAdmin && (
                        <button
                          onClick={() => handleEliminar(post)}
                          title="Eliminar definitivamente"
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      <PostEditorModal
        open={editorOpen}
        initialPost={editingPost}
        onClose={() => setEditorOpen(false)}
        onSaved={cargar}
      />
    </div>
  );
}
