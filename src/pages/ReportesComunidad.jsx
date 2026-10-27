import { useEffect, useState } from 'react';
import { MessageSquareWarning, Send, Loader2, Phone, Clock, Inbox, CheckCircle2, Trash2 } from 'lucide-react';
import Header from '../components/layout/Header';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ImageUploader from '../components/common/ImageUploader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useReportesComunidad } from '../context/ReportesComunidadContext';
import { ReportesComunidadAPI } from '../api/reportesComunidad';

const inputCls =
  'w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-dark-muted rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-brand transition-colors';

const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5';

const initialForm = { nombre: '', mensaje: '', contacto: '', imagenUrl: '' };

function formatearFecha(fechaString) {
  if (!fechaString) return '';
  const opciones = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  return new Date(fechaString).toLocaleDateString('es-CO', opciones);
}

// ==========================================
// FORMULARIO PÚBLICO
// ==========================================
function FormularioReporte({ onEnviado }) {
  const { success, error, warning } = useToast();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.mensaje.trim()) {
      warning("Campos requeridos.", "Ingresa tu nombre y el detalle del reporte.");
      return;
    }
    setSubmitting(true);
    try {
      await ReportesComunidadAPI.enviar({
        nombre: form.nombre.trim(),
        mensaje: form.mensaje.trim(),
        contacto: form.contacto.trim() || null,
        imagenUrl: form.imagenUrl.trim() || null,
      });
      success("Reporte enviado.", "Será revisado por el equipo del acueducto.");
      setForm(initialForm);
      onEnviado?.();
    } catch (err) {
      error(err.message || 'No se pudo enviar el reporte.', 'Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-muted overflow-hidden">
      <div className="p-6 md:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
          <MessageSquareWarning className="w-5 h-5 text-brand" />
          Nuevo reporte
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Cuéntanos sobre una fuga, queja o reclamo. No necesitas iniciar sesión.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Nombre completo *</label>
            <input
              type="text"
              required
              maxLength={150}
              value={form.nombre}
              onChange={handleChange('nombre')}
              placeholder="Ingrese el nombre"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Medio de contacto (opcional)</label>
            <input
              type="text"
              maxLength={150}
              value={form.contacto}
              onChange={handleChange('contacto')}
              placeholder="Teléfono o correo electrónico"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Detalle del reporte *</label>
            <textarea
              required
              rows={4}
              value={form.mensaje}
              onChange={handleChange('mensaje')}
              placeholder="Describe la fuga, queja o zona afectada..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <ImageUploader
              bucket="reportes"
              folder="reportes-comunidad"
              value={form.imagenUrl}
              onChange={(url) => setForm((prev) => ({ ...prev, imagenUrl: url }))}
              label="Foto del reporte"
              optional
              acceptCamera
              maxWidthOrHeight={1080}
              maxSizeMB={0.4}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Enviar reporte
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// GESTIÓN (ADMINISTRADOR / TESORERO)
// ==========================================
function TarjetaReporte({ reporte, esAdmin, onEliminar }) {
  const [imgError, setImgError] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await onEliminar(reporte.id);
      setConfirmando(false);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-dark-muted hover:border-brand/40 transition-colors flex flex-col shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold shrink-0">
          {reporte.nombre?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-white leading-tight truncate">{reporte.nombre}</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" /> {formatearFecha(reporte.fechaCreacion)}
          </span>
        </div>
        {esAdmin && (
          <button
            onClick={() => setConfirmando(true)}
            title="Eliminar reporte definitivamente"
            className="shrink-0 p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {reporte.imagenUrl && !imgError && (
        <img
          src={reporte.imagenUrl}
          alt="Foto adjunta al reporte"
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-36 object-cover rounded-xl mb-3 bg-gray-100 dark:bg-gray-950"
        />
      )}

      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-950 rounded-xl p-3 flex-grow border border-gray-100 dark:border-dark-muted/50">
        {reporte.mensaje}
      </p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-dark-muted text-xs">
        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 truncate">
          <Phone className="w-3.5 h-3.5 shrink-0" />
          {reporte.contacto || 'Sin contacto'}
        </span>
        <span className="font-mono bg-gray-100 dark:bg-dark-muted text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
          #{reporte.id}
        </span>
      </div>

      <ConfirmDialog
        open={confirmando}
        title="¿Eliminar este reporte?"
        message="Se borra de inmediato y no se puede deshacer, a diferencia de la retención automática de 8 días."
        confirmLabel={eliminando ? 'Eliminando…' : 'Eliminar'}
        onConfirm={handleEliminar}
        onCancel={() => setConfirmando(false)}
      />
    </div>
  );
}

function GestionReportes() {
  const { rol } = useAuth();
  const { success, error } = useToast();
  const { reportes, loading, fetchReportes, marcarVistos, quitarReporte } = useReportesComunidad();

  useEffect(() => {
    fetchReportes();
    marcarVistos();
    // Al salir de esta vista también se marcan como vistos los que llegaron mientras se miraba.
    return () => marcarVistos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEliminar = async (id) => {
    try {
      await ReportesComunidadAPI.eliminar(id);
      quitarReporte(id);
      success("Reporte eliminado.", "Ha sido removido del sistema permanentemente.");
    } catch (err) {
      error(err.message || 'No se pudo eliminar el reporte.', 'El reporte sigue disponible en el sistema.');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (reportes.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-dark-muted">
        <Inbox className="w-8 h-8 mx-auto mb-3 opacity-50" />
        No hay reportes de la comunidad por el momento.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reportes.map((reporte) => (
        <TarjetaReporte
          key={reporte.id}
          reporte={reporte}
          esAdmin={rol === 'ADMINISTRADOR'}
          onEliminar={handleEliminar}
        />
      ))}
    </div>
  );
}

// ==========================================
// PÁGINA
// ==========================================
export default function ReportesComunidad() {
  const { puedeEditar } = useAuth();
  const [tab, setTab] = useState(puedeEditar ? 'gestion' : 'publico');
  const [enviado, setEnviado] = useState(false);

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <MessageSquareWarning className="w-6 h-6 text-brand" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Reportes de la comunidad</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {tab === 'gestion'
                  ? 'Fugas, quejas y reclamos enviados por la comunidad.'
                  : 'Canal directo con el acueducto para reportar fugas, quejas o reclamos.'}
              </p>
            </div>
          </div>

          {puedeEditar && (
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setTab('gestion')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === 'gestion' ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Gestión
              </button>
              <button
                onClick={() => setTab('publico')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === 'publico' ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Enviar reporte
              </button>
            </div>
          )}
        </div>

        {tab === 'gestion' && puedeEditar && <GestionReportes />}

        {(tab === 'publico' || !puedeEditar) && (
          <>
            {enviado && (
              <div className="max-w-2xl mx-auto mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-sm">¡Gracias! Tu reporte ya fue registrado.</p>
              </div>
            )}
            <FormularioReporte onEnviado={() => setEnviado(true)} />
          </>
        )}
      </main>
    </div>
  );
}
