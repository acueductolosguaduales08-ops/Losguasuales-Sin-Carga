import { useEffect, useState } from 'react';
import { Search, Loader2, UserSearch, X } from 'lucide-react';
import { AsociadosAPI } from '../../api/asociados';
import { InformesAPI } from '../../api/informes';
import { useToast } from '../../context/ToastContext';
import InformeAccionesBar from './InformeAccionesBar';
import InformeAsociadoView from './InformeAsociadoView';

export default function InformeAsociadoPanel({ asociadoIdInicial, asociadoNombreInicial }) {
  const { info, error } = useToast();

  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const [asociadoSeleccionado, setAsociadoSeleccionado] = useState(null);
  const [informe, setInforme] = useState(null);
  const [loadingInforme, setLoadingInforme] = useState(false);

  // Auto-seleccionar asociado si viene de redirección
  useEffect(() => {
    if (asociadoIdInicial && !asociadoSeleccionado) {
      const partes = asociadoNombreInicial ? asociadoNombreInicial.split(' ') : [];
      const nombres = partes.slice(0, Math.ceil(partes.length / 2)).join(' ');
      const apellidos = partes.slice(Math.ceil(partes.length / 2)).join(' ');
      const fakeAsociado = {
        id: asociadoIdInicial,
        nombres: nombres || 'Asociado',
        apellidos: apellidos || '',
        tipoDocumento: '',
        documento: '',
      };
      seleccionar(fakeAsociado);
    }
  }, [asociadoIdInicial]); // eslint-disable-line react-hooks/exhaustive-deps

  // Búsqueda con debounce, igual al patrón usado en Asociados.
  useEffect(() => {
    if (!busqueda.trim()) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const t = setTimeout(() => {
      AsociadosAPI.buscar(busqueda.trim())
        .then((data) => setResultados(Array.isArray(data) ? data : data?.content || []))
        .catch((err) => error("Error al buscar", err.message || 'No se pudo buscar el asociado.'))
        .finally(() => setBuscando(false));
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarInforme = (asociadoId = asociadoSeleccionado?.id) => {
    if (!asociadoId) return;
    setLoadingInforme(true);
    InformesAPI.asociado(asociadoId)
      .then(setInforme)
      .catch((err) => {
        setInforme(null);
        error("Error al generar", err.message || 'No se pudo generar el informe del asociado.');
      })
      .finally(() => setLoadingInforme(false));
  };

  const seleccionar = (asociado) => {
    setAsociadoSeleccionado(asociado);
    setResultados([]);
    setBusqueda('');
    setInforme(null);
    cargarInforme(asociado.id);
  };

  const limpiarSeleccion = () => {
    setAsociadoSeleccionado(null);
    setInforme(null);
  };

  return (
    <div className="space-y-5">
      {/* Buscador */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-0.5">
          <UserSearch className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">
            Busca el asociado
          </h3>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 ml-6">
          Verás su historial de consumo, facturas y pagos.
        </p>

        {asociadoSeleccionado ? (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                {asociadoSeleccionado.nombres} {asociadoSeleccionado.apellidos}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {asociadoSeleccionado.tipoDocumento}: {asociadoSeleccionado.documento}
              </p>
            </div>
            <button
              onClick={limpiarSeleccion}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-muted transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" /> Cambiar
            </button>
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, apellidos, documento o teléfono…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              {buscando && (
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {resultados.length > 0 && (
              <div className="mt-3 border border-gray-200 dark:border-dark-muted rounded-xl divide-y divide-gray-100 dark:divide-dark-muted max-h-64 overflow-y-auto custom-scroll">
                {resultados.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => seleccionar(a)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {a.nombres} {a.apellidos}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {a.tipoDocumento}: {a.documento}
                      {a.numeroMedidor ? ` · Medidor ${a.numeroMedidor}` : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {!buscando && busqueda.trim() && resultados.length === 0 && (
              <p className="text-sm text-gray-400 mt-3">No se encontraron asociados con ese criterio.</p>
            )}
          </div>
        )}
      </div>
      {/* fin buscador */}

      {!asociadoSeleccionado && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-dark-muted rounded-2xl">
          <UserSearch className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Busca y selecciona un asociado para generar su informe de seguimiento.
          </p>
        </div>
      )}

      {asociadoSeleccionado && (
        <>
          <InformeAccionesBar
            titulo={`Informe de seguimiento · ${asociadoSeleccionado.nombres} ${asociadoSeleccionado.apellidos}`}
            subtitulo="Historial financiero: facturas, pagos y multas del asociado."
            onRefrescar={() => cargarInforme()}
            refrescando={loadingInforme}
            disabled={loadingInforme}
            cargarHtml={() => InformesAPI.asociadoHtml(asociadoSeleccionado.id)}
            cargarPdf={() => InformesAPI.asociadoPdf(asociadoSeleccionado.id)}
            nombreArchivo={`informe-asociado-${asociadoSeleccionado.documento}.pdf`}
          />

          {loadingInforme && !informe && (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Generando informe…</span>
            </div>
          )}

          {informe && <InformeAsociadoView data={informe} />}
        </>
      )}
    </div>
  );
}
