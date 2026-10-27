import { useState } from 'react';
import { X, Lock, Eye, EyeOff, Loader2, Users, Search } from 'lucide-react';
import { AuthAPI } from '../../api/auth';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import BloqueoUsuarioModal from './BloqueoUsuarioModal';

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

export default function ListadoUsuariosModal({ open, onClose }) {
  const { error, warning, info } = useToast();
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [autenticado, setAutenticado] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  useLockBodyScroll(open);

  if (!open) return null;

  const handleAutenticar = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      warning("Contraseña requerida", "Debes ingresar tu contraseña para ver el listado.");
      return;
    }
    setCargando(true);
    try {
      const data = await AuthAPI.listarUsuarios(password);
      setUsuarios(Array.isArray(data) ? data : []);
      setAutenticado(true);
    } catch (err) {
      error("Error de autenticación", err.message || 'Contraseña incorrecta.');
    } finally {
      setCargando(false);
    }
  };

  const recargarLista = async () => {
    setCargando(true);
    try {
      const data = await AuthAPI.listarUsuarios(password);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch {
      // Mantener la lista actual si falla la recarga
    } finally {
      setCargando(false);
    }
  };

  const cerrar = () => {
    setPassword('');
    setMostrarPassword(false);
    setAutenticado(false);
    setUsuarios([]);
    setBusqueda('');
    setUsuarioSeleccionado(null);
    onClose();
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (u.username || '').toLowerCase().includes(q) ||
      (u.contacto || '').toLowerCase().includes(q) ||
      (u.rol || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="modal-shell fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={cerrar} aria-hidden="true" />
        <div
          className="modal-shell__card relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.2s_ease] flex flex-col max-h-[90dvh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="listado-usuarios-titulo"
        >
          <div className="modal-shell__header p-5 border-b border-gray-200 dark:border-dark-muted flex justify-between items-start shrink-0">
            <div>
              <h3 id="listado-usuarios-titulo" className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-500" /> Listado de cuentas
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {autenticado
                  ? `${usuarios.length} cuenta${usuarios.length !== 1 ? 's' : ''} registrada${usuarios.length !== 1 ? 's' : ''}`
                  : 'Ingresa tu contraseña para ver las cuentas.'}
              </p>
            </div>
            <button onClick={cerrar} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors shrink-0" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="modal-shell__body flex-1 overflow-y-auto overscroll-contain p-5">
            {!autenticado ? (
              <form onSubmit={handleAutenticar} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    Contraseña del administrador
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
                    </div>
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tu contraseña"
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
                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-brand hover:bg-brand-dark text-white transition-all shadow-lg shadow-brand/20 disabled:opacity-50"
                >
                  {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Ver listado
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                {/* Barra de búsqueda */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por usuario, correo o rol…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted bg-gray-50 dark:bg-gray-950 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                </div>

                {cargando ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Actualizando…
                  </div>
                ) : usuariosFiltrados.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
                    No se encontraron cuentas.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {usuariosFiltrados.map((u) => {
                      const inicial = (u.username || '?').charAt(0).toUpperCase();
                      const estiloAvatar = ROL_STYLE[u.rol] || 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
                      return (
                        <button
                          key={u.id}
                          onClick={() => setUsuarioSeleccionado(u)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-bg/60 transition-colors text-left"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${estiloAvatar}`}>
                            {inicial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{u.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.contacto || '—'}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {u.asociadoNombre && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 block truncate">
                                {u.asociadoNombre}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${estiloAvatar}`}>
                              {ROL_LABEL[u.rol] || u.rol}
                            </span>
                            <span className={`w-2.5 h-2.5 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <BloqueoUsuarioModal
        open={!!usuarioSeleccionado}
        onClose={() => setUsuarioSeleccionado(null)}
        usuario={usuarioSeleccionado}
        onEstadoCambiado={recargarLista}
      />
    </>
  );
}
