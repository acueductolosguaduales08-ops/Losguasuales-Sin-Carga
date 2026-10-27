import { useMemo, useState } from 'react';
import { Megaphone, Search, ChevronDown, ChevronUp, X, Star } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { HomeAPI } from '../../api/home';
import { GALLERY_CATEGORY } from '../../api/publicaciones';
import Pagination from '../common/Pagination';
import UserAvatar from '../common/UserAvatar';

const MAX_EMOJIS_VISIBLE = 4;

// Imagen de tarjeta con fundido de entrada: evita que la foto "aparezca de
// golpe" (con salto visual) cuando termina de descargar sobre el esqueleto.
function PostThumbImage({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt={alt}
      onLoad={() => setLoaded(true)}
      loading="lazy"
      className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}

function PostReactionsSummary({ postId }) {
  const { data } = useFetch(() => HomeAPI.reacciones(postId), [postId]);
  const reacciones = (data || []).filter((r) => r.contador > 0);
  if (reacciones.length === 0) return null;
  const visibles = reacciones.slice(0, MAX_EMOJIS_VISIBLE);
  const hay_mas = reacciones.length > MAX_EMOJIS_VISIBLE;
  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {visibles.map((r) => (
        <span key={r.emoji} className="flex items-center gap-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full px-1.5 py-0.5">
          <span>{r.emoji}</span>
          <span className="text-gray-600 dark:text-gray-300 font-medium">{r.contador}</span>
        </span>
      ))}
      {hay_mas && (
        <span className="text-xs text-gray-400 dark:text-gray-500 px-1">…</span>
      )}
    </div>
  );
}

function formatFecha(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function toPlainText(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export default function PublicacionesSection({ onOpenItem }) {
  const [pagina, setPagina] = useState(1);
  const { data, loading, error } = useFetch(() => HomeAPI.publicacionesPublicas({ page: pagina - 1, size: 12 }), [pagina]);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const publicaciones = useMemo(() => {
    const content = data?.content || [];
    const filtered = content.filter((p) => (p.categoria || '').toLowerCase() !== GALLERY_CATEGORY);
    return filtered.sort((a, b) => {
      const da = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
      const db = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
      return db - da;
    });
  }, [data]);

  const publicacionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return publicaciones;
    return publicaciones.filter((p) => (p.titulo || '').toLowerCase().includes(q));
  }, [publicaciones, busqueda]);

  const totalPaginas = data?.totalPages || 1;

  const toggleBuscador = () => {
    setBuscadorAbierto((v) => {
      if (v) setBusqueda(''); // limpiar al cerrar
      return !v;
    });
  };

  return (
    <section id="publicaciones" className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-brand" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Publicaciones</h2>
        </div>
        {/* Botón desplegable del buscador */}
        <button
          onClick={toggleBuscador}
          aria-label={buscadorAbierto ? 'Cerrar buscador' : 'Buscar publicación'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-muted transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Buscar</span>
          {buscadorAbierto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Buscador desplegable */}
      {buscadorAbierto && (
        <div className="mb-4 flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título…"
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-white placeholder-gray-400"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Resultado de búsqueda */}
      {buscadorAbierto && busqueda && (
        <p className="text-xs text-gray-400 mb-3">
          {publicacionesFiltradas.length} resultado{publicacionesFiltradas.length !== 1 ? 's' : ''} para «{busqueda}»
        </p>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
          <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse" />
        </div>
      )}

      {error && <p className="text-sm text-gray-400">No se pudieron cargar las publicaciones.</p>}

      {!loading && !error && publicacionesFiltradas.length === 0 && (
        <p className="text-sm text-gray-400 py-6">
          {busqueda ? 'Sin resultados para tu búsqueda.' : 'Aún no hay publicaciones para mostrar.'}
        </p>
      )}

      {!loading && publicacionesFiltradas.length > 0 && (
        <>
          {/* Publicación destacada */}
          {!busqueda && publicacionesFiltradas.length > 0 && (() => {
            const featured = publicacionesFiltradas[0];
            return (
              <article
                key={`featured-${featured.id}`}
                onClick={() => onOpenItem(featured)}
                className="mb-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Destacada</span>
                </div>
                <div className="flex items-center gap-2.5 mb-3">
                  <UserAvatar username={featured.autor} rol={featured.autorRol} size="w-9 h-9" />
                  <div>
                    <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{featured.autor}</p>
                    <p className="text-xs text-gray-500">{formatFecha(featured.fechaCreacion)}</p>
                  </div>
                  {featured.categoria && (
                    <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 capitalize">
                      {featured.categoria}
                    </span>
                  )}
                </div>
                {featured.imagenUrl && featured.posicionImagen !== 'ABAJO' && (
                  <PostThumbImage
                    src={featured.imagenUrl}
                    alt={featured.titulo}
                    className="w-full h-48 object-cover rounded-xl mb-3 bg-gray-100 dark:bg-gray-950"
                  />
                )}
                <h3 className="text-xl font-bold mb-2 text-gray-850 dark:text-white">{featured.titulo}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {featured.descripcionCorta || toPlainText(featured.contenidoCompleto)}
                </p>
                {featured.imagenUrl && featured.posicionImagen === 'ABAJO' && (
                  <PostThumbImage
                    src={featured.imagenUrl}
                    alt={featured.titulo}
                    className="w-full h-48 object-cover rounded-xl mt-3 bg-gray-100 dark:bg-gray-950"
                  />
                )}
                <PostReactionsSummary postId={featured.id} />
              </article>
            );
          })()}

          {/* Resto de publicaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(busqueda ? publicacionesFiltradas : publicacionesFiltradas.slice(1)).map((post) => (
              <article
                key={post.id}
                onClick={() => onOpenItem(post)}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar username={post.autor} rol={post.autorRol} size="w-9 h-9" />
                    <div>
                      <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{post.autor}</p>
                      <p className="text-xs text-gray-500">{formatFecha(post.fechaCreacion)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    {post.categoria && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 capitalize">
                        {post.categoria}
                      </span>
                    )}
                    <PostReactionsSummary postId={post.id} />
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-2 text-gray-850 dark:text-white">{post.titulo}</h3>

                {post.posicionImagen !== 'ABAJO' && post.imagenUrl && (
                  <PostThumbImage
                    src={post.imagenUrl}
                    alt={post.titulo}
                    className="w-full h-40 object-cover rounded-xl mb-3 bg-gray-100 dark:bg-gray-950"
                  />
                )}

                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {post.descripcionCorta || toPlainText(post.contenidoCompleto)}
                </p>

                {post.posicionImagen === 'ABAJO' && post.imagenUrl && (
                  <PostThumbImage
                    src={post.imagenUrl}
                    alt={post.titulo}
                    className="w-full h-40 object-cover rounded-xl mt-3 bg-gray-100 dark:bg-gray-950"
                  />
                )}
              </article>
            ))}
          </div>
          <Pagination currentPage={pagina} totalPages={totalPaginas} onPageChange={setPagina} />
        </>
      )}
    </section>
  );
}
