import { useEffect, useState } from 'react';
import { Loader2, FileBarChart } from 'lucide-react';
import { InformesAPI } from '../../api/informes';
import { useToast } from '../../context/ToastContext';
import InformeAccionesBar from './InformeAccionesBar';

export default function ListadoAsociadosPanel() {
  const { error } = useToast();
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    InformesAPI.listadoAsociados()
      .then(setResumen)
      .catch((err) => {
        setResumen(null);
        error("Error al cargar", err.message || 'No se pudo cargar el listado de asociados.');
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <InformeAccionesBar
        titulo="Listado general de asociados"
        subtitulo="Listado completo de asociados con sus datos, medidor y estado de cuenta."
        onRefrescar={() => {
          setLoading(true);
          InformesAPI.listadoAsociados()
            .then(setResumen)
            .catch((err) => {
              setResumen(null);
              error("Error al cargar", err.message || 'No se pudo cargar el listado de asociados.');
            })
            .finally(() => setLoading(false));
        }}
        refrescando={loading}
        disabled={loading}
        cargarHtml={() => InformesAPI.listadoAsociadosHtml()}
        cargarPdf={() => InformesAPI.listadoAsociadosPdf()}
        nombreArchivo={`listado-asociados-${new Date().toISOString().slice(0, 10)}.pdf`}
      />

      {loading && !resumen && (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando listado…</span>
        </div>
      )}

      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ResumenCard label="Total" value={resumen.totalAsociados} color="brand" />
          <ResumenCard label="Activos" value={resumen.asociadosActivos} color="green" />
          <ResumenCard label="Suspendidos" value={resumen.asociadosSuspendidos} color="yellow" />
          <ResumenCard label="Con cuenta" value={resumen.asociadosConCuenta} color="blue" />
          <ResumenCard label="Sin cuenta" value={resumen.asociadosSinCuenta} color="red" />
        </div>
      )}

      {!loading && !resumen && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-dark-muted rounded-2xl">
          <FileBarChart className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No se pudo cargar el resumen del listado.
          </p>
        </div>
      )}
    </div>
  );
}

function ResumenCard({ label, value, color }) {
  const colorMap = {
    brand: 'bg-brand/10 text-brand dark:text-brand-light border-brand/20',
    green: 'bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400 border-green-200 dark:border-green-900/40',
    yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/10 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/40',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400 border-blue-200 dark:border-blue-900/40',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400 border-red-200 dark:border-red-900/40',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${colorMap[color] || colorMap.brand}`}>
      <p className="text-2xl font-bold">{value ?? '—'}</p>
      <p className="text-xs font-semibold mt-0.5 opacity-80">{label}</p>
    </div>
  );
}
