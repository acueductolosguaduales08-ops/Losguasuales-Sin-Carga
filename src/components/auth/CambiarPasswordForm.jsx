import { useMemo, useState } from 'react';
import { X, Lock, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { AuthAPI } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';

// Calcula una fortaleza aproximada (0-4) a partir de longitud y variedad de caracteres.
// Es solo una guía visual para el usuario; la validación real (min. 8) la hace el backend.
function calcularFortaleza(pw) {
  if (!pw) return 0;
  let puntos = 0;
  if (pw.length >= 8) puntos++;
  if (pw.length >= 12) puntos++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) puntos++;
  if (/\d/.test(pw)) puntos++;
  if (/[^A-Za-z0-9]/.test(pw)) puntos++;
  return Math.min(puntos, 4);
}

const NIVELES = [
  { label: 'Muy débil', color: 'bg-red-500', text: 'text-red-500' },
  { label: 'Débil', color: 'bg-red-500', text: 'text-red-500' },
  { label: 'Media', color: 'bg-amber-500', text: 'text-amber-500' },
  { label: 'Fuerte', color: 'bg-emerald-500', text: 'text-emerald-500' },
  { label: 'Muy fuerte', color: 'bg-emerald-600', text: 'text-emerald-600' },
];

function ReglaCheck({ ok, label }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
      {label}
    </li>
  );
}

function CampoPassword({ label, value, onChange, show, onToggleShow, autoComplete, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
        </div>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// Modal para cambiar la contraseña. Se abre desde el botón "Cambiar
// contraseña" en el perfil de Mi cuenta (antes era un card siempre visible
// e inline en la página; ahora es una acción explícita bajo demanda).
export default function CambiarPasswordForm({ open, onClose }) {
  const { logout } = useAuth();
  const { success, info } = useToast();

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  const fortaleza = useMemo(() => calcularFortaleza(passwordNueva), [passwordNueva]);
  const nivel = NIVELES[fortaleza];

  const reglas = useMemo(
    () => ({
      longitud: passwordNueva.length >= 8,
      distinta: passwordNueva.length > 0 && passwordNueva !== passwordActual,
      coincide: passwordConfirmar.length > 0 && passwordNueva === passwordConfirmar,
    }),
    [passwordNueva, passwordActual, passwordConfirmar]
  );

  const formularioValido =
    passwordActual.trim().length > 0 && reglas.longitud && reglas.distinta && reglas.coincide;

  const isDirty = open && (passwordActual !== '' || passwordNueva !== '' || passwordConfirmar !== '');

  const limpiarYCerrar = () => {
    setPasswordActual('');
    setPasswordNueva('');
    setPasswordConfirmar('');
    setMostrarActual(false);
    setMostrarNueva(false);
    setMostrarConfirmar(false);
    setErrorForm(null);
    onClose();
  };

  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, limpiarYCerrar);
  useLockBodyScroll(open, requestClose);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorForm(null);

    if (!passwordActual.trim()) {
      setErrorForm('Ingresa tu contraseña actual.');
      return;
    }
    if (!reglas.longitud) {
      setErrorForm('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!reglas.distinta) {
      setErrorForm('La nueva contraseña debe ser diferente a la actual.');
      return;
    }
    if (!reglas.coincide) {
      setErrorForm('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setEnviando(true);
    try {
      await AuthAPI.cambiarPassword({ passwordActual, passwordNueva });
      success("Contraseña cambiada", "Se cerrará tu sesión por seguridad.");
      // Medida de seguridad: forzamos el cierre de sesión para invalidar la sesión
      // local y obligar a reautenticarse con la nueva contraseña.
      await logout();
    } catch (err) {
      const message =
        err.status === 401 || err.status === 403
          ? 'La contraseña actual es incorrecta.'
          : err.message || 'No se pudo cambiar la contraseña.';
      setErrorForm(message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={requestClose} aria-hidden="true" />
      <div
        className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cambiar-password-titulo"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-start shrink-0">
          <div>
            <h3 id="cambiar-password-titulo" className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand" /> Cambiar contraseña
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Después de cambiarla, cerraremos tu sesión actual por seguridad.
            </p>
          </div>
          <button onClick={requestClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="form-cambiar-password"
          onSubmit={handleSubmit}
          className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4"
        >
          <CampoPassword
            label="Contraseña actual"
            value={passwordActual}
            onChange={(e) => setPasswordActual(e.target.value)}
            show={mostrarActual}
            onToggleShow={() => setMostrarActual((v) => !v)}
            autoComplete="current-password"
            placeholder="Tu contraseña actual"
          />

          <CampoPassword
            label="Nueva contraseña"
            value={passwordNueva}
            onChange={(e) => setPasswordNueva(e.target.value)}
            show={mostrarNueva}
            onToggleShow={() => setMostrarNueva((v) => !v)}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />

          {passwordNueva && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-dark-muted overflow-hidden flex gap-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-full transition-colors ${i < fortaleza ? nivel.color : 'bg-transparent'}`}
                    />
                  ))}
                </div>
                <span className={`text-[11px] font-semibold shrink-0 ${nivel.text}`}>{nivel.label}</span>
              </div>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                <ReglaCheck ok={reglas.longitud} label="Mínimo 8 caracteres" />
                <ReglaCheck ok={reglas.distinta} label="Diferente a la actual" />
              </ul>
            </div>
          )}

          <CampoPassword
            label="Confirmar nueva contraseña"
            value={passwordConfirmar}
            onChange={(e) => setPasswordConfirmar(e.target.value)}
            show={mostrarConfirmar}
            onToggleShow={() => setMostrarConfirmar((v) => !v)}
            autoComplete="new-password"
            placeholder="Repite la nueva contraseña"
          />
          {passwordConfirmar && <ReglaCheck ok={reglas.coincide} label="Las contraseñas coinciden" />}

          {errorForm && <p className="text-sm text-red-500">{errorForm}</p>}
        </form>

        <div className="modal-shell__footer p-5 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-end gap-3 shrink-0">
          <button
            onClick={requestClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-cambiar-password"
            disabled={!formularioValido || enviando}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-brand hover:bg-brand-dark text-white transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Actualizar contraseña
          </button>
        </div>
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  );
}
