import { useEffect, useState } from 'react';
import {
  X, Loader2, FileBarChart, ExternalLink, Send, MessageCircle, CheckCircle2, TrendingUp, TrendingDown, Droplet,
} from 'lucide-react';
import { PeriodosAPI } from '../../api/periodos';
import { InformesAPI } from '../../api/informes';
import { NotificacionesAPI } from '../../api/notificaciones';
import { PublicacionesAPI } from '../../api/publicaciones';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { cargarInformePeriodoHtml, abrirDocumentoHtml } from '../../utils/documentos';
import { formatCOP, formatNumero } from '../../utils/formatCOP';

// Modal "Informe del mes" del Panel: resumen del período, vista previa
// del informe HTML/PDF, y "Publicar a asociados" (notificación pública +
// publicación en la comunidad) con opción de compartir por WhatsApp.
export default function InformeMesModal({ open, mes, onClose }) {
  const { success, error: toastError, info } = useToast();
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoHtml, setCargandoHtml] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [publicado, setPublicado] = useState(false);

  useLockBodyScroll(open, onClose);

  useEffect(() => {
    if (!open || !mes?.id) return;
    setCargando(true);
    setPublicado(false);
    PeriodosAPI.resumenMes(mes.id)
      .then(setResumen)
      .catch(() => setResumen(null))
      .finally(() => setCargando(false));
  }, [open, mes?.id]);

  if (!open) return null;

  const tituloInforme = `Informe de ${mes?.nombreMes || ''} ${mes?.anio || ''}`.trim();

  const resumenTexto = resumen
    ? [
        `Resumen contable de ${tituloInforme} del Acueducto.`,
        '',
        `• Facturado: ${formatCOP(resumen.totalFacturado)} (${resumen.facturasGeneradas} facturas)`,
        `• Cobrado: ${resumen.facturasPagadas} facturas pagadas`,
        `• Pendientes: ${resumen.facturasPendientes} · Vencidas: ${resumen.facturasVencidas}`,
        `• Ingresos: ${formatCOP(resumen.totalIngresos)} · Gastos: ${formatCOP(resumen.totalGastos)}`,
        `• Balance: ${formatCOP(resumen.balance)}`,
        `• Consumo: ${formatNumero(resumen.totalM3Consumidos)} m³ (${resumen.asociadosActivos} asociados activos)`,
      ].join('\n')
    : `Resumen contable de ${tituloInforme}.`;

  const handleVerHtml = async () => {
    setCargandoHtml(true);
    info('Preparando informe', 'Abriendo nueva ventana con el informe del mes.');
    try {
      const html = await InformesAPI.periodoMesHtml(mes.id);
      abrirDocumentoHtml(html);
    } catch (err) {
      toastError('No se pudo abrir el informe.', err.message || 'Inténtalo de nuevo.');
    } finally {
      setCargandoHtml(false);
    }
  };

  const handleDescargarPdf = async () => {
    setCargandoHtml(true);
    try {
      const res = await InformesAPI.periodoMesPdf(mes.id);
      if (res?.ok) success('Informe abierto', 'Usa "Guardar como PDF" en el diálogo de impresión.');
    } catch (err) {
      toastError('No se pudo abrir el PDF.', err.message || 'Inténtalo de nuevo.');
    } finally {
      setCargandoHtml(false);
    }
  };

  const handlePublicar = async () => {
    setPublicando(true);
    try {
      // Doble publicación: notificación in-app (campana) + publicación
      // fija en la comunidad para que todos los asociados la vean.
      await NotificacionesAPI.crear({
        titulo: tituloInforme,
        tipo: 'PUBLICA',
        descripcionCorta: `Resumen de ${mes?.nombreMes || ''} ${mes?.anio || ''}: ${formatCOP(resumen?.totalFacturado || 0)} facturados, ${formatCOP(resumen?.balance || 0)} de balance.`,
        contenidoCompleto: resumenTexto,
      });
      const pub = await PublicacionesAPI.crear({
        titulo: tituloInforme,
        contenido: resumenTexto,
        descripcionCorta: `Resumen de ${mes?.nombreMes || ''} ${mes?.anio || ''}`,
      });
      await PublicacionesAPI.publicar(pub.id);
      setPublicado(true);
      success('Informe publicado', 'Los asociados ya pueden verlo en la comunidad y en su campana.');
    } catch (err) {
      toastError('No se pudo publicar el informe.', err.message || 'Verifica tus permisos.');
    } finally {
      setPublicando(false);
    }
  };

  const waCompartir = `https://wa.me/?text=${encodeURIComponent(
    `${tituloInforme} del Acueducto ya está publicado. Consulta la comunidad de la app para ver el resumen completo.`
  )}`;

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] max-h-[90dvh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-center shrink-0">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-brand" /> {tituloInforme}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-5 overflow-y-auto overscroll-contain custom-scroll space-y-4">
          {cargando && (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando resumen…</span>
            </div>
          )}

          {!cargando && resumen && (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-3 border border-gray-200 dark:border-dark-muted">
                <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">Facturado</p>
                <p className="text-lg font-black text-gray-800 dark:text-white tabular-nums">{formatCOP(resumen.totalFacturado)}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Ingresos</p>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{formatCOP(resumen.totalIngresos)}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase text-red-700 dark:text-red-400 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Gastos</p>
                <p className="text-lg font-black text-red-700 dark:text-red-400 tabular-nums">{formatCOP(resumen.totalGastos)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-950 rounded-xl p-3 border border-gray-200 dark:border-dark-muted">
                <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">Balance</p>
                <p className="text-lg font-black text-gray-800 dark:text-white tabular-nums">{formatCOP(resumen.balance)}</p>
              </div>
              <div className="col-span-2 bg-brand/5 dark:bg-brand/10 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-brand flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5" /> Consumo</span>
                <span className="text-sm font-bold text-brand tabular-nums">{formatNumero(resumen.totalM3Consumidos)} m³ · {resumen.asociadosActivos} asociados</span>
              </div>
            </div>
          )}

          {!cargando && !resumen && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
              No se pudo cargar el resumen del mes.
            </p>
          )}

          {/* Acciones del documento */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleVerHtml}
              disabled={cargandoHtml || !mes}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-dark-muted dark:hover:bg-dark-muted/80 text-sm font-semibold text-gray-700 dark:text-white transition-colors disabled:opacity-60"
            >
              {cargandoHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Ver informe
            </button>
            <button
              onClick={handleDescargarPdf}
              disabled={cargandoHtml || !mes}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-dark-muted dark:hover:bg-dark-muted/80 text-sm font-semibold text-gray-700 dark:text-white transition-colors disabled:opacity-60"
            >
              {cargandoHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBarChart className="w-4 h-4" />}
              PDF
            </button>
          </div>

          {/* Publicar a asociados */}
          <div className="border-t border-gray-200 dark:border-dark-muted pt-4 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Publica el resumen del mes para que todos los asociados lo vean en la comunidad y reciban una notificación.
            </p>
            {publicado ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <p className="flex-1 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Informe publicado
                </p>
                <a
                  href={waCompartir}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Compartir
                </a>
              </div>
            ) : (
              <button
                onClick={handlePublicar}
                disabled={publicando || !resumen}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {publicando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publicar a asociados
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
