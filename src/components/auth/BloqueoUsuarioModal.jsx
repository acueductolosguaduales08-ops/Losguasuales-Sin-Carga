import { useState } from 'react';
import { X, Lock, Eye, EyeOff, Loader2, ShieldAlert, ShieldCheck, Mail, Tag } from 'lucide-react';
import { AuthAPI } from '../../api/auth';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const ROL_LABEL = {
  ASOCIADO: 'Asociado',
  TESORERO: 'Tesorero',
  ADMINISTRADOR: 'Administrador',
};

const ROL_STYLE = {
  ADMINISTRADOR: 'bg-brand/15 text-brand dark:bg-brand/25 dark:text-brand-light',
  TESORERO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ASOCIADO: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
};

export default function BloqueoUsuarioModal({ open, onClose, usuario: usuarioSeleccionado, onEstadoCambiado }) {
  const { success, error, warning } = useToast();
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useLockBodyScroll(open);

  if (!open || !usuarioSeleccionado) return null;

  const estaActivo = usuarioSeleccionado.activo;
  const inicial = (usuarioSeleccionado.username || '?').charAt(0).toUpperCase();
  const estiloAvatar = ROL_STYLE[usuarioSeleccionado.rol] || 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      warning('Contraseña requerida', 'Ingresa tu contraseña para confirmar.');
      return;
    }
    if (estaActivo && !motivo.trim()) {
      warning('Motivo requerido', 'El motivo es obligatorio al bloquear una cuenta.');
      return;
    }

    setEnviando(true);
    try {
      await AuthAPI.cambiarEstadoUsuario(usuarioSeleccionado.id, password, motivo.trim() || null);
      success(
        estaActivo ? 'Cuenta bloqueada' : 'Cuenta activada',
        estaActivo
          ? `El usuario ${usuarioSeleccionado.username} ya no puede iniciar sesión.`
          : `El usuario ${usuarioSeleccionado.username} ahora puede acceder.`
      );
      setPassword('');
      setMotivo('');
      onEstadoCambiado?.();
      onClose();
    } catch (err) {
      error("Error al cambiar estado", err.message || 'No se pudo cambiar el estado de la cuenta.');
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = () => {
    setPassword('');
    setMotivo('');
    onClose();
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={cerrar} aria-hidden="true" />
      <div
        className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bloqueo-usuario-titulo"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-start shrink-0">
          <div>
            <h3 id="bloqueo-usuario-titulo" className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
              {estaActivo ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
              {estaActivo ? 'Bloquear cuenta' : 'Activar cuenta'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {estaActivo
                ? 'El usuario no podrá iniciar sesión ni usar el sistema.'
                : 'Se reactivará el acceso de este usuario.'}
            </p>
          </div>
          <button onClick={cerrar} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-5">
          {/* Detalles del usuario */}
          <div className="flex items-center gap-3.5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shrink-0 ${estiloAvatar}`}>
              {inicial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-gray-800 dark:text-white truncate">{usuarioSeleccionado.username}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <Tag className="w-3 h-3 shrink-0" />
                <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${estiloAvatar}`}>
                  {ROL_LABEL[usuarioSeleccionado.rol] || usuarioSeleccionado.rol}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950">
              <p className="text-gray-400 dark:text-gray-500 mb-0.5">Correo / Contacto</p>
              <p className="font-semibold text-gray-800 dark:text-white truncate flex items-center gap-1">
                <Mail className="w-3 h-3 shrink-0 text-gray-400" />
                {usuarioSeleccionado.contacto || '—'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950">
              <p className="text-gray-400 dark:text-gray-500 mb-0.5">Estado</p>
              <p className={`font-semibold flex items-center gap-1 ${estaActivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                <span className={`w-2 h-2 rounded-full ${estaActivo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {estaActivo ? 'Activo' : 'Inactivo / Bloqueado'}
              </p>
            </div>
            {usuarioSeleccionado.asociadoId && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-950 col-span-2">
                <p className="text-gray-400 dark:text-gray-500 mb-0.5">Asociado</p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {usuarioSeleccionado.asociadoNombre || `ID: ${usuarioSeleccionado.asociadoId}`}
                </p>
              </div>
            )}
          </div>

          {estaActivo && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Motivo del bloqueo
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Mal uso de la plataforma"
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Tu contraseña (confirmación de seguridad)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                </div>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña del administrador"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={cerrar}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all shadow-lg disabled:opacity-50 ${
                  estaActivo
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                }`}
              >
                {enviando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : estaActivo ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {estaActivo ? 'Bloquear cuenta' : 'Activar cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
