import { useEffect, useState } from 'react';
import { X, UserPlus, Loader2, Search, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthAPI, ROLES_QUE_PUEDE_CREAR } from '../../api/auth';
import { AsociadosAPI } from '../../api/asociados';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import useConfirmClose from '../../hooks/useConfirmClose';
import ConfirmDialog from '../common/ConfirmDialog';

const ROL_LABEL = {
  ASOCIADO: 'Asociado',
  TESORERO: 'Tesorero',
  ADMINISTRADOR: 'Administrador',
};

// Modal para crear una cuenta de acceso para otro usuario. Se abre desde el
// botón "Crear cuenta" en el perfil de Mi cuenta (visible solo para quien
// tenga permiso). Se deja abierto tras crear una cuenta con éxito, para
// poder crear varias seguidas sin tener que reabrirlo cada vez.
export default function CrearUsuarioForm({ open, onClose }) {
  const { rol: rolActual } = useAuth();
  const { success, error, warning } = useToast();
  const rolesPermitidos = ROLES_QUE_PUEDE_CREAR[rolActual] || [];

  const [username, setUsername] = useState('');
  const [contacto, setContacto] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [rol, setRol] = useState(rolesPermitidos[0] || '');

  // Vínculo con un asociado (obligatorio en la práctica cuando el rol es ASOCIADO).
  const [busquedaAsociado, setBusquedaAsociado] = useState('');
  const [resultadosAsociado, setResultadosAsociado] = useState([]);
  const [buscandoAsociado, setBuscandoAsociado] = useState(false);
  const [asociadoSeleccionado, setAsociadoSeleccionado] = useState(null);

  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!busquedaAsociado.trim()) {
      setResultadosAsociado([]);
      return;
    }
    setBuscandoAsociado(true);
    const t = setTimeout(() => {
      AsociadosAPI.buscar(busquedaAsociado.trim())
        .then((data) => setResultadosAsociado(Array.isArray(data) ? data : data?.content || []))
        .catch(() => setResultadosAsociado([]))
        .finally(() => setBuscandoAsociado(false));
    }, 350);
    return () => clearTimeout(t);
  }, [busquedaAsociado]);

  const limpiar = () => {
    setUsername('');
    setContacto('');
    setPassword('');
    setMostrarPassword(false);
    setRol(rolesPermitidos[0] || '');
    setBusquedaAsociado('');
    setResultadosAsociado([]);
    setAsociadoSeleccionado(null);
  };

  const isDirty = open && (username !== '' || contacto !== '' || password !== '' || asociadoSeleccionado != null);

  const cerrarYLimpiar = () => {
    limpiar();
    onClose();
  };

  const { confirming, requestClose, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, cerrarYLimpiar);
  useLockBodyScroll(open, requestClose);

  if (!open || rolesPermitidos.length === 0) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !contacto.trim() || !password) {
      warning("Campos requeridos", "Debes completar usuario, contacto y contraseña.");
      return;
    }
    if (password.length < 8) {
      warning("Contraseña corta", "La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (rol === 'ASOCIADO') {
      const idAsociado = asociadoSeleccionado?.id ?? null;
      if (!idAsociado) {
        warning("Asociado requerido", "Debes buscar y seleccionar un asociado vinculado.");
        return;
      }

      if (!idAsociado) {
        warning("ID inválido", "El asociado seleccionado no es válido.");
        return;
      }
    }

    setEnviando(true);
    try {
      const payload = {
        username: username.trim(),
        password,
        contacto: contacto.trim(),
        rol,
      };

      if (rol === 'ASOCIADO') {
        payload.asociadoId = asociadoSeleccionado.id;
      }

      await AuthAPI.crearUsuario(payload).then((res) => {
        if (res?.emailTecnico) {
          warning("Cuenta creada con correo técnico", `El contacto no era email. Se usó ${res.email}: el usuario entra con su USUARIO, no podrá recuperar por correo.`);
        } else {
          success("Cuenta creada", `La cuenta para ${username.trim()} se creó exitosamente.`);
        }
      });
      limpiar();
    } catch (err) {
      info("Error al crear", err.message || 'No se pudo crear la cuenta de usuario.');
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
        aria-labelledby="crear-usuario-titulo"
      >
        <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-start shrink-0">
          <div>
            <h3 id="crear-usuario-titulo" className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand" /> Crear cuenta de usuario
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {rolActual === 'ADMINISTRADOR'
                ? 'Puedes crear cuentas de Tesorero, Administrador o Asociado.'
                : 'Puedes crear cuentas de Asociado.'}
            </p>
          </div>
          <button onClick={requestClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="form-crear-usuario"
          onSubmit={handleSubmit}
          className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nombre.usuario"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Contacto</label>
            <input
              type="text"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="Correo o teléfono"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Contraseña inicial</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
              </div>
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
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
            <p className="text-[11px] text-gray-400 mt-1">Se recomienda pedirle al usuario que la cambie en su primer ingreso.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Rol de la cuenta</label>
            <select
              value={rol}
              onChange={(e) => {
                setRol(e.target.value);
                setAsociadoSeleccionado(null);
                setBusquedaAsociado('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              {rolesPermitidos.map((r) => (
                <option key={r} value={r}>
                  {ROL_LABEL[r]}
                </option>
              ))}
            </select>
          </div>

          {rol === 'ASOCIADO' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  Asociado vinculado
                </label>
                {asociadoSeleccionado ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                        {asociadoSeleccionado.nombres} {asociadoSeleccionado.apellidos}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {asociadoSeleccionado.tipoDocumento}: {asociadoSeleccionado.documento}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAsociadoSeleccionado(null);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-muted shrink-0"
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
                        value={busquedaAsociado}
                        onChange={(e) => setBusquedaAsociado(e.target.value)}
                        placeholder="Buscar por nombre o documento…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                      />
                      {buscandoAsociado && (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {resultadosAsociado.length > 0 && (
                      <div className="mt-2 border border-gray-200 dark:border-dark-muted rounded-xl divide-y divide-gray-100 dark:divide-dark-muted max-h-48 overflow-y-auto custom-scroll">
                        {resultadosAsociado.map((a) => (
                          <button
                            type="button"
                            key={a.id}
                            onClick={() => {
                              setAsociadoSeleccionado(a);
                              setBusquedaAsociado('');
                              setResultadosAsociado([]);
                            }}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-muted/40 transition-colors"
                          >
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                              {a.nombres} {a.apellidos}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {a.tipoDocumento}: {a.documento}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </form>

        <div className="modal-shell__footer p-5 border-t border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950/40 flex justify-end gap-3 shrink-0">
          <button
            onClick={requestClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-muted text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-muted/80 transition-colors text-sm font-semibold"
          >
            Cerrar
          </button>
          <button
            type="submit"
            form="form-crear-usuario"
            disabled={enviando}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-brand hover:bg-brand-dark text-white transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Crear cuenta
          </button>
        </div>
      </div>

      <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
    </div>
  );
}
