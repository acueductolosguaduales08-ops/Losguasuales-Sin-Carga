import { useEffect, useState } from 'react';
import { X, Calculator, Droplet, AlertTriangle } from 'lucide-react';
import { ConfiguracionAPI } from '../../api/configuracion';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { formatCOP } from '../../utils/formatCOP';

// Calculadora de consumo, ahora totalmente aparte del formulario de
// registrar lectura (antes vivía embebida ahí). Se abre con su propio
// botón, sin depender de estar registrando nada — sirve para simular
// cualquier escenario hipotético en cualquier momento.
export default function CalculadoraConsumoModal({ open, onClose }) {
  const [anterior, setAnterior] = useState('');
  const [actual, setActual] = useState('');
  const [valorM3, setValorM3] = useState('');

  useLockBodyScroll(open, onClose);

  useEffect(() => {
    if (!open) return;
    setAnterior('');
    setActual('');
    ConfiguracionAPI.obtener()
      .then((data) => {
        if (data?.valorM3 != null) setValorM3(String(data.valorM3));
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const consumo = actual !== '' && anterior !== '' ? Number(actual) - Number(anterior) : null;
  const consumoNegativo = consumo != null && consumo < 0;
  const total = consumo != null && !consumoNegativo && valorM3 !== '' ? consumo * Number(valorM3) : null;

  return (
    <div className="modal-shell fixed inset-0 z-[130] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="modal-shell__card relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calculadora-consumo-titulo"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-start shrink-0">
          <div>
            <h3
              id="calculadora-consumo-titulo"
              className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2"
            >
              <Calculator className="w-4 h-4 text-brand" /> Calculadora de consumo
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Simula cualquier escenario, sin registrar nada.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Lectura anterior</label>
              <input
                type="number"
                value={anterior}
                onChange={(e) => setAnterior(e.target.value)}
                placeholder="Ej: 120"
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Lectura actual</label>
              <input
                type="number"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder="Ej: 145"
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white outline-none focus:border-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Valor por m³</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={valorM3}
              onChange={(e) => setValorM3(e.target.value)}
              placeholder="Ingrese el valor por m³"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white outline-none focus:border-brand"
            />
          </div>

          <div className="bg-brand/10 border border-brand/30 rounded-lg p-3 space-y-2 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-brand dark:text-brand-light">
                <Droplet className="w-4 h-4" />
                <span>Consumo</span>
              </div>
              <span className={`text-lg font-bold ${consumoNegativo ? 'text-red-500' : 'text-brand'}`}>
                {consumo != null ? `${consumo} m³` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand dark:text-brand-light">Total</span>
              <span className="text-lg font-bold text-brand">
                {total != null
                  ? formatCOP(total)
                  : '—'}
              </span>
            </div>
            {consumoNegativo && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                La lectura actual es menor que la anterior: revisa los números.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
