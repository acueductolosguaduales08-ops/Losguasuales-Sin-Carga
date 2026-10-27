import { useState } from 'react';
import { Video, PlayCircle, Plus, EyeOff, Loader2 } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { HomeAPI } from '../../api/home';
import { PublicacionesAPI } from '../../api/publicaciones';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getYouTubeThumbnail } from '../../utils/youtube';

// NOTA: VideoPlayerModal y VideoEditorModal se renderizan en Home.jsx, NO
// aquí. Antes vivían dentro de este componente, que a su vez está envuelto
// en un div `.reveal-section` (animación de entrada) en Home. Un modal
// `fixed` anidado dentro de un ancestro con una animación que anima
// `transform` corre el riesgo de posicionarse relativo a ese ancestro en
// vez de a la pantalla, en algunos navegadores móviles. Por eso ambos
// modales se movieron a Home.jsx como hermanos de las secciones, igual
// que ya hacían GalleryModal y PostModal.
export default function VideosSection({ onOpenVideo, onNuevoVideo }) {
  const { data, loading, error, refetch } = useFetch(() => HomeAPI.videosPublicos(), []);
  const [ocultandoId, setOcultandoId] = useState(null);
  const { puedeEditar } = useAuth();
  const { success, error: toastError, info } = useToast();
  const videos = data || [];

  if (!loading && !error && videos.length === 0 && !puedeEditar) return null;

  const handleOcultar = async (video) => {
    if (!window.confirm(`¿Ocultar el video "${video.titulo}"? Ya no aparecerá en el inicio.`)) return;
    setOcultandoId(video.id);
    try {
      await PublicacionesAPI.ocultarVideo(video.id);
      success("Video ocultado", "El video ya no aparecerá en el inicio.");
      refetch();
    } catch (err) {
      toastError("Error al ocultar", err.message || 'No se pudo ocultar el video.');
    } finally {
      setOcultandoId(null);
    }
  };

  return (
    <section id="videos" className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-brand" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Videos</h2>
        </div>
        {puedeEditar && (
          <button
            onClick={onNuevoVideo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo video
          </button>
        )}
      </div>

      {loading && (
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          <div className="h-40 w-64 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse shrink-0" />
          <div className="h-40 w-64 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse shrink-0" />
          <div className="h-40 w-64 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse shrink-0" />
        </div>
      )}

      {error && <p className="text-sm text-gray-400">No se pudieron cargar los videos.</p>}

      {!loading && !error && videos.length === 0 && puedeEditar && (
        <p className="text-sm text-gray-400 py-6">Aún no hay videos publicados.</p>
      )}

      {!loading && videos.length > 0 && (
        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4">
          <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
            {videos.map((v) => {
              const thumbnail = getYouTubeThumbnail(v.urlVideo);
              return (
                <div
                  key={v.id}
                  className="relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 group shrink-0 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  style={{ width: 240 }}
                >
                  <button onClick={() => onOpenVideo(v)} className="block w-full text-left">
                    <div className="w-full bg-gray-200 dark:bg-dark-muted flex items-center justify-center overflow-hidden relative" style={{ height: 135 }}>
                      {thumbnail ? (
                        <img src={thumbnail} alt={v.titulo} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <PlayCircle className="w-10 h-10 text-gray-400" />
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{v.titulo}</h3>
                    </div>
                  </button>

                  {puedeEditar && (
                    <button
                      onClick={() => handleOcultar(v)}
                      disabled={ocultandoId === v.id}
                      title="Ocultar video"
                      className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors disabled:opacity-60"
                    >
                      {ocultandoId === v.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </section>
  );
}
