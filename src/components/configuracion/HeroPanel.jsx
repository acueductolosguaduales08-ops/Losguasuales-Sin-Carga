import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Star, RotateCcw, Image, ChevronDown, ChevronUp } from 'lucide-react';
import { ConfiguracionAPI } from '../../api/configuracion';
import { useToast } from '../../context/ToastContext';
import { setStoredHeroImageUrl } from '../../utils/heroConfig';
import logo from '../../assets/logo-losguaduales.webp';

const inputCls =
  'w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-4 py-2 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-brand transition-colors';

export default function HeroPanel() {
  const { success, error, warning, info } = useToast();
  const [heroes, setHeroes] = useState([]);
  const [modo, setModo] = useState('UNICO');
  const [loading, setLoading] = useState(true);
  const [urlNueva, setUrlNueva] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [cambiandoModo, setCambiandoModo] = useState(false);
  const [marcandoId, setMarcandoId] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  const cargar = () => {
    setLoading(true);
    Promise.all([
      ConfiguracionAPI.heroListar(),
      ConfiguracionAPI.obtener(),
    ])
      .then(([lista, config]) => {
        const items = Array.isArray(lista) ? lista : lista?.content || [];
        setHeroes(items);
        setModo(config?.modoHero || 'UNICO');
      })
      .catch((err) => error("Error al cargar", err.message || 'No se pudieron cargar los héroes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!urlNueva.trim()) { warning("URL requerida", "Debes ingresar una URL válida de imagen."); return; }
    setAgregando(true);
    try {
      await ConfiguracionAPI.heroAgregar(urlNueva.trim());
      success("Hero agregado", "La imagen se agregó al carrusel del inicio.");
      setUrlNueva('');
      cargar();
    } catch (err) {
      error("Error al agregar", err.message || 'No se pudo agregar el hero.');
    } finally {
      setAgregando(false);
    }
  };

  const handleEliminar = async (id) => {
    setEliminandoId(id);
    try {
      await ConfiguracionAPI.heroEliminar(id);
      success("Hero eliminado", "La imagen fue removida del carrusel.");
      const remaining = heroes.filter((h) => h.id !== id);
      setHeroes(remaining);
      // Si era el principal o no quedan heroes, limpiar cache y refrescar
      const elEliminado = heroes.find((h) => h.id === id);
      if (elEliminado?.principal || remaining.length === 0) {
        setStoredHeroImageUrl('');
        // Refrescar el hero vigente del backend
        ConfiguracionAPI.heroActual()
          .then((data) => {
            const nextUrl = data?.link?.trim() || '';
            setStoredHeroImageUrl(nextUrl);
          })
          .catch(() => {});
      }
    } catch (err) {
      error("Error al eliminar", err.message || 'No se pudo eliminar la imagen.');
    } finally {
      setEliminandoId(null);
    }
  };

  const handleMarcarPrincipal = async (id) => {
    setMarcandoId(id);
    try {
      await ConfiguracionAPI.heroPrincipal(id);
      setHeroes((prev) => prev.map((h) => ({ ...h, principal: h.id === id })));
      success("Hero principal", "Esta imagen ahora se muestra como principal.");
    } catch (err) {
      error("Error al destacar", err.message || 'No se pudo marcar como principal.');
    } finally {
      setMarcandoId(null);
    }
  };

  const handleCambiarModo = async (nuevoModo) => {
    setCambiandoModo(true);
    try {
      await ConfiguracionAPI.heroModo(nuevoModo);
      setModo(nuevoModo);
      // Actualizar hero en home si el modo cambia a UNICO
      if (nuevoModo === 'UNICO') {
        const principal = heroes.find((h) => h.principal);
        if (principal?.link) setStoredHeroImageUrl(principal.link);
      }
      success("Modo actualizado", `El carrusel ahora usa modo ${nuevoModo === 'UNICO' ? 'imagen única' : 'rotación cada 15 min'}.`);
    } catch (err) {
      info("Error al cambiar modo", err.message || 'No se pudo cambiar el modo.');
    } finally {
      setCambiandoModo(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Selector de modo */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-3">
          <RotateCcw className="w-4 h-4 text-brand" /> Modo de visualización
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleCambiarModo('UNICO')}
            disabled={cambiandoModo || modo === 'UNICO'}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
              modo === 'UNICO'
                ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20'
                : 'border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 hover:border-brand'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Image className="w-4 h-4" />
              Imagen única
            </div>
            <p className="text-[10px] font-normal mt-1 opacity-70">Siempre muestra el principal</p>
          </button>
          <button
            onClick={() => handleCambiarModo('ALEATORIO_15MIN')}
            disabled={cambiandoModo || modo === 'ALEATORIO_15MIN'}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
              modo === 'ALEATORIO_15MIN'
                ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20'
                : 'border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 hover:border-brand'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Rotación 15 min
            </div>
            <p className="text-[10px] font-normal mt-1 opacity-70">Cambia cada 15 minutos</p>
          </button>
        </div>
      </div>

      {/* Agregar hero */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-brand" /> Agregar hero
        </h3>
        <form onSubmit={handleAgregar} className="flex gap-2">
          <input
            type="url"
            value={urlNueva}
            onChange={(e) => setUrlNueva(e.target.value)}
            placeholder="https://sitio.com/imagen-hero.jpg"
            className={`${inputCls} flex-1`}
          />
          <button
            type="submit"
            disabled={agregando || !urlNueva.trim()}
            className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            {agregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Agregar
          </button>
        </form>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          El primero que agregas queda como principal automáticamente.
        </p>
      </div>

      {/* Lista de heroes */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-3">
          <Image className="w-4 h-4 text-brand" /> Heroes registrados
          <span className="text-xs font-normal text-gray-400 ml-auto">{heroes.length} imagen{heroes.length !== 1 ? 'es' : ''}</span>
        </h3>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        )}

        {!loading && heroes.length === 0 && (
          <p className="text-sm text-gray-400 py-6 text-center">No hay heroes registrados. Agrega uno arriba.</p>
        )}

        {!loading && heroes.length > 0 && (
          <div className="space-y-3">
            {heroes.map((hero) => (
              <div
                key={hero.id}
                className={`relative rounded-xl overflow-hidden border transition-all ${
                  hero.principal
                    ? 'border-brand shadow-md shadow-brand/10'
                    : 'border-gray-200 dark:border-dark-muted hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Preview */}
                <div className="relative h-32 bg-gray-200 dark:bg-dark-muted overflow-hidden group">
                  <img
                    src={logo}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <img
                    src={hero.link}
                    alt="Hero"
                    onError={(e) => { e.target.style.display = 'none'; }}
                    className="absolute inset-0 z-10 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/40 to-transparent" />
                  <svg
                    className="absolute bottom-0 z-30 w-full h-6 text-gray-50 dark:text-dark-card pointer-events-none"
                    preserveAspectRatio="none"
                    viewBox="0 0 1440 320"
                    fill="currentColor"
                  >
                    <path d="M0,224L120,213.3C240,203,480,181,720,186.7C960,192,1200,224,1320,240L1440,256L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"></path>
                  </svg>

                  {/* Badge principal */}
                  {hero.principal && (
                    <div className="absolute top-2 left-2 z-30 flex items-center gap-1 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-current" />
                      Principal
                    </div>
                  )}

                  {/* Badge modo */}
                  <div className="absolute top-2 right-2 z-30 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {modo === 'UNICO' ? 'Único' : '15 min'}
                  </div>

                  {/* Acciones */}
                  <div className="absolute bottom-2 right-2 z-30 flex gap-1.5">
                    {!hero.principal && (
                      <button
                        onClick={() => handleMarcarPrincipal(hero.id)}
                        disabled={marcandoId === hero.id}
                        className="bg-white/90 hover:bg-white text-gray-700 text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                        title="Marcar como principal"
                      >
                        {marcandoId === hero.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Star className="w-3 h-3" />
                        )}
                        Principal
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminar(hero.id)}
                      disabled={eliminandoId === hero.id}
                      className="bg-red-500/90 hover:bg-red-500 text-white text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                      title="Eliminar"
                    >
                      {eliminandoId === hero.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* URL (truncada) */}
                <div className="px-3 py-2">
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate" title={hero.link}>
                    {hero.link}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
