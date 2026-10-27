import { useEffect, useState } from 'react';
import { CalendarRange, Loader2, FileBarChart } from 'lucide-react';
import { PeriodosAPI } from '../../api/periodos';
import { InformesAPI } from '../../api/informes';
import { useToast } from '../../context/ToastContext';
import InformeAccionesBar from './InformeAccionesBar';
import InformePeriodoView from './InformePeriodoView';

export default function InformeAnualPanel() {
  const { info, error } = useToast();

  const [years, setYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [selectedYearId, setSelectedYearId] = useState(null);

  const [informe, setInforme] = useState(null);
  const [loadingInforme, setLoadingInforme] = useState(false);

  useEffect(() => {
    setLoadingYears(true);
    PeriodosAPI.listarAnios()
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setYears(lista);
        setSelectedYearId((prev) => (prev && lista.some((y) => y.id === prev) ? prev : lista[0]?.id ?? null));
      })
      .catch((err) => error("Error al cargar", err.message || 'No se pudieron cargar los años contables.'))
      .finally(() => setLoadingYears(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarInforme = () => {
    if (!selectedYearId) return;
    setLoadingInforme(true);
    InformesAPI.periodoAnio(selectedYearId)
      .then(setInforme)
      .catch((err) => {
        setInforme(null);
        error("Error al generar", err.message || 'No se pudo generar el informe anual.');
      })
      .finally(() => setLoadingInforme(false));
  };

  useEffect(() => {
    if (selectedYearId) cargarInforme();
    else setInforme(null);
  }, [selectedYearId]); // eslint-disable-line react-hooks/exhaustive-deps

  const anioSeleccionado = years.find((y) => y.id === selectedYearId);

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-0.5">
          <CalendarRange className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">
            Selecciona el año contable
          </h3>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 ml-6">Resume todo el año elegido, mes a mes.</p>

        {loadingYears ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando años contables…
          </div>
        ) : years.length === 0 ? (
          <p className="text-sm text-gray-400">No hay años contables registrados todavía.</p>
        ) : (
          <div className="max-w-xs">
            <select
              value={selectedYearId ?? ''}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.anio}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!selectedYearId && !loadingYears && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-dark-muted rounded-2xl">
          <FileBarChart className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona un año contable para generar el informe.</p>
        </div>
      )}

      {selectedYearId && (
        <>
          <InformeAccionesBar
            titulo={`Informe anual · ${anioSeleccionado?.anio ?? ''}`}
            subtitulo="Resumen agregado de todo el año: ingresos, gastos, facturación, multas y consumo."
            onRefrescar={cargarInforme}
            refrescando={loadingInforme}
            disabled={loadingInforme}
            cargarHtml={() => InformesAPI.periodoAnioHtml(selectedYearId)}
            cargarPdf={() => InformesAPI.periodoAnioPdf(selectedYearId)}
            nombreArchivo={`informe-anual-${anioSeleccionado?.anio ?? ''}.pdf`}
          />

          {loadingInforme && !informe && (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Generando informe…</span>
            </div>
          )}

          {informe && <InformePeriodoView data={informe} />}
        </>
      )}
    </div>
  );
}
