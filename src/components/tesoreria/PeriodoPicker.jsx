import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PeriodosAPI, NOMBRES_MESES } from '../../api/periodos';

// Selector compacto de año → mes contable. Usado para el campo obligatorio
// `mesContableId` de los movimientos de tesorería (ingresos y gastos).
// Preselecciona automáticamente el mes más reciente que no esté CERRADO.
export default function PeriodoPicker({ value, onChange }) {
  const [years, setYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [yearId, setYearId] = useState(null);
  const [months, setMonths] = useState([]);
  const [loadingMonths, setLoadingMonths] = useState(false);

  useEffect(() => {
    setLoadingYears(true);
    PeriodosAPI.listarAnios()
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content || [];
        setYears(lista);
        setYearId(lista[lista.length - 1]?.id ?? lista[0]?.id ?? null);
      })
      .catch(() => setYears([]))
      .finally(() => setLoadingYears(false));
  }, []);

  useEffect(() => {
    if (!yearId) {
      setMonths([]);
      return;
    }
    setLoadingMonths(true);
    PeriodosAPI.listarMeses(yearId)
      .then((data) => {
        const lista = (Array.isArray(data) ? data : data?.content || []).slice().sort((a, b) => a.numeroMes - b.numeroMes);
        setMonths(lista);
        if (!value) {
          const abierto = lista.find((m) => m.estado !== 'CERRADO');
          onChange(abierto?.id ?? lista[lista.length - 1]?.id ?? null);
        }
      })
      .catch(() => setMonths([]))
      .finally(() => setLoadingMonths(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearId]);

  return (
    <div className="space-y-2">
      {loadingYears ? (
        <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando años…
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-wrap">
          {years.map((y) => (
            <button
              key={y.id}
              type="button"
              onClick={() => setYearId(y.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                yearId === y.id
                  ? 'bg-brand border-brand text-white'
                  : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-brand'
              }`}
            >
              {y.anio}
            </button>
          ))}
        </div>
      )}

      {loadingMonths ? (
        <div className="flex items-center gap-2 text-gray-400 text-xs py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando meses…
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-wrap">
          {months.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                value === m.id
                  ? 'bg-gray-800 dark:bg-white border-gray-800 dark:border-white text-white dark:text-gray-900'
                  : 'border-gray-200 dark:border-dark-muted text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-gray-400'
              }`}
            >
              {NOMBRES_MESES[m.numeroMes - 1]}
              {m.estado === 'CERRADO' && ' 🔒'}
            </button>
          ))}
          {months.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">Este ejercicio no tiene meses aperturados.</p>
          )}
        </div>
      )}
    </div>
  );
}
