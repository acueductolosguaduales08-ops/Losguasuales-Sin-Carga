import { useEffect, useState } from 'react';
import { CalendarDays, Loader2, FileBarChart } from 'lucide-react';
import { PeriodosAPI, NOMBRES_MESES } from '../../api/periodos';
import { InformesAPI } from '../../api/informes';
import { useToast } from '../../context/ToastContext';
import InformeAccionesBar from './InformeAccionesBar';
import InformePeriodoView from './InformePeriodoView';

export default function InformeMensualPanel() {
  const { info, error } = useToast();

  const [years, setYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [selectedYearId, setSelectedYearId] = useState(null);

  const [months, setMonths] = useState([]);
  const [loadingMonths, setLoadingMonths] = useState(false);
  const [selectedMonthId, setSelectedMonthId] = useState(null);

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

  useEffect(() => {
    if (!selectedYearId) {
      setMonths([]);
      setSelectedMonthId(null);
      return;
    }
    setLoadingMonths(true);
    PeriodosAPI.listarMeses(selectedYearId)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setMonths(lista);
        setSelectedMonthId((prev) => (prev && lista.some((m) => m.id === prev) ? prev : lista[0]?.id ?? null));
      })
      .catch((err) => error("Error al cargar", err.message || 'No se pudieron cargar los meses del año.'))
      .finally(() => setLoadingMonths(false));
  }, [selectedYearId]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarInforme = () => {
    if (!selectedMonthId) return;
    setLoadingInforme(true);
    InformesAPI.periodoMes(selectedMonthId)
      .then(setInforme)
      .catch((err) => {
        setInforme(null);
        error("Error al generar", err.message || 'No se pudo generar el informe mensual.');
      })
      .finally(() => setLoadingInforme(false));
  };

  useEffect(() => {
    if (selectedMonthId) cargarInforme();
    else setInforme(null);
  }, [selectedMonthId]); // eslint-disable-line react-hooks/exhaustive-deps

  const mesSeleccionado = months.find((m) => m.id === selectedMonthId);
  const nombreMes = mesSeleccionado ? NOMBRES_MESES[(mesSeleccionado.numeroMes ?? 1) - 1] : '';
  const anioSeleccionado = years.find((y) => y.id === selectedYearId);

  return (
    <div className="space-y-5">
      {/* Selector de año / mes */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-0.5">
          <CalendarDays className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide">
            Selecciona el período
          </h3>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 ml-6">Elige el año y luego el mes a consultar.</p>

        {loadingYears ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando años contables…
          </div>
        ) : years.length === 0 ? (
          <p className="text-sm text-gray-400">No hay años contables registrados todavía.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Año contable</label>
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

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Mes contable</label>
              {loadingMonths ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando meses…
                </div>
              ) : months.length === 0 ? (
                <p className="text-sm text-gray-400 py-2.5">Este año no tiene meses aperturados.</p>
              ) : (
                <select
                  value={selectedMonthId ?? ''}
                  onChange={(e) => setSelectedMonthId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  {months.map((m) => (
                    <option key={m.id} value={m.id}>
                      {NOMBRES_MESES[(m.numeroMes ?? 1) - 1]} · {m.estado}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </div>

      {!selectedMonthId && !loadingYears && years.length > 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-dark-muted rounded-2xl">
          <FileBarChart className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecciona un mes con período aperturado para generar el informe.
          </p>
        </div>
      )}

      {selectedMonthId && (
        <>
          <InformeAccionesBar
            titulo={`Informe mensual · ${nombreMes} ${anioSeleccionado?.anio ?? ''}`}
            subtitulo="Ingresos, gastos, facturación, multas y consumo del mes."
            onRefrescar={cargarInforme}
            refrescando={loadingInforme}
            disabled={loadingInforme}
            cargarHtml={() => InformesAPI.periodoMesHtml(selectedMonthId)}
            cargarPdf={() => InformesAPI.periodoMesPdf(selectedMonthId)}
            nombreArchivo={`informe-mensual-${anioSeleccionado?.anio ?? ''}-${mesSeleccionado?.numeroMes ?? ''}.pdf`}
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
