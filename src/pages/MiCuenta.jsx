import { useEffect, useState } from 'react';
import { Loader2, Mail, Gauge, LayoutGrid, ShieldCheck, UserPlus, Users, ChevronRight, KeyRound, PenLine, Trash2 } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useBottomNav } from '../context/BottomNavContext';
import { AuthAPI, ROLES_QUE_PUEDE_CREAR } from '../api/auth';
import { cacheClear } from '../api/client';
import CambiarPasswordForm from '../components/auth/CambiarPasswordForm';
import CrearUsuarioForm from '../components/auth/CrearUsuarioForm';
import ListadoUsuariosModal from '../components/auth/ListadoUsuariosModal';
import EditarPerfilModal from '../components/asociados/EditarPerfilModal';
import Toggle from '../components/common/Toggle';

const ROL_LABEL = {
  ASOCIADO: 'Asociado',
  TESORERO: 'Tesorero',
  ADMINISTRADOR: 'Administrador',
};

// Tarjeta de acción tipo "fila de ajustes": ícono, título, descripción y una
// flecha, todo el bloque es clicable. Mismo tratamiento visual para todas
// las funciones del perfil (cambiar contraseña, crear cuenta), para que
// crecer la lista en el futuro sea simplemente agregar otra fila igual.
function AccionPerfil({ icon: Icon, iconClass, titulo, descripcion, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-bg/60 transition-colors"
    >
      <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${iconClass}`}>
        <Icon className="w-5 h-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-800 dark:text-white">{titulo}</span>
        <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{descripcion}</span>
      </span>
      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
    </button>
  );
}

export default function MiCuenta() {
  const { usuario, rol } = useAuth();
  const { success, error } = useToast();
  const { enabled: bottomNavEnabled, setEnabled: setBottomNavEnabled } = useBottomNav();
  const [perfil, setPerfil] = useState(usuario || null);
  const [loading, setLoading] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [crearCuentaOpen, setCrearCuentaOpen] = useState(false);
  const [listadoOpen, setListadoOpen] = useState(false);
  const [editarPerfilOpen, setEditarPerfilOpen] = useState(false);
  const [limpiandoCache, setLimpiandoCache] = useState(false);

  useEffect(() => {
    AuthAPI.perfil()
      .then(setPerfil)
      .catch((err) => error(err.message || 'Error al cargar perfil.', 'No se pudieron obtener los datos de tu cuenta.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const puedeCrearCuentas = (ROLES_QUE_PUEDE_CREAR[rol] || []).length > 0;
  const puedeVerListado = rol === 'ADMINISTRADOR';
  const p = perfil || usuario;

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-4xl mx-auto pt-20 md:pt-24 pb-10 px-0 md:px-6">
        <div className="space-y-5">
          {/* Ficha de perfil, estilo "tarjeta de presentación": banner con el
              color de marca y el avatar superpuesto, como un perfil real. */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted md:rounded-2xl overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-brand to-sky-400 relative">
              <div className="absolute -bottom-9 left-5 w-20 h-20 rounded-2xl bg-white dark:bg-gray-900 p-1.5 shadow-lg">
                <div className="w-full h-full rounded-xl bg-brand/10 text-brand flex items-center justify-center font-black text-2xl">
                  {(p?.username || '?').slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="pt-11 pb-5 px-5">
              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando perfil…
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold text-gray-800 dark:text-white truncate">{p?.username}</p>
                  <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {p?.contacto || '—'}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand/10 text-brand">
                      {ROL_LABEL[p?.rol] || p?.rol || 'Sin rol'}
                    </span>
                    {p?.rol === 'ASOCIADO' && p?.asociadoId ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                        <Gauge className="w-3.5 h-3.5" /> ID asociado: {p.asociadoId}
                      </span>
                    ) : null}
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        p?.activo
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400'
                      }`}
                    >
                      {p?.activo ? 'Cuenta activa' : 'Cuenta inactiva'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Funciones de la cuenta: cada una es un botón que abre su propio
              modal, en vez de mostrar todos los formularios expandidos a la
              vez en la página. */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted md:rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-dark-muted">
            <AccionPerfil
              icon={KeyRound}
              iconClass="bg-brand/10 text-brand"
              titulo="Cambiar contraseña"
              descripcion="Actualiza tu contraseña de acceso"
              onClick={() => setPasswordOpen(true)}
            />
            {rol === 'ASOCIADO' && (
              <AccionPerfil
                icon={PenLine}
                iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                titulo="Editar mis datos"
                descripcion="Actualiza tu información personal"
                onClick={() => setEditarPerfilOpen(true)}
              />
            )}
            {puedeCrearCuentas && (
              <AccionPerfil
                icon={UserPlus}
                iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                titulo="Crear cuenta"
                descripcion="Crea el acceso para otro usuario del sistema"
                onClick={() => setCrearCuentaOpen(true)}
              />
            )}
            {puedeVerListado && (
              <AccionPerfil
                icon={Users}
                iconClass="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                titulo="Listado de cuentas"
                descripcion="Ver y gestionar las cuentas de usuario"
                onClick={() => setListadoOpen(true)}
              />
            )}
          </div>

          {/* Preferencias de la app */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted md:rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Preferencias</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Estas opciones se guardan en este dispositivo.
            </p>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <LayoutGrid className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Barra de navegación inferior
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Accesos rápidos en la parte de abajo de la pantalla, solo en celular. Si prefieres más espacio
                    para el contenido, puedes desactivarla y seguir navegando desde el menú ☰ de arriba.
                  </p>
                </div>
              </div>
              <Toggle
                checked={bottomNavEnabled}
                onChange={(e) => setBottomNavEnabled(e.target.checked)}
                label="Activar barra de navegación inferior"
              />
            </div>
          </div>

          {/* Borrar Caché */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted md:rounded-2xl p-5">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Caché de datos</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              La app guarda datos temporalmente para cargar más rápido. Si ves información desactualizada, puedes borrar la caché.
            </p>
            <button
              onClick={() => {
                setLimpiandoCache(true);
                setTimeout(() => {
                  cacheClear();
                  setLimpiandoCache(false);
                  success("Caché borrada.", "Datos temporales eliminados correctamente.");
                }, 300);
              }}
              disabled={limpiandoCache}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${limpiandoCache
                  ? 'bg-gray-100 dark:bg-dark-muted text-gray-400 dark:text-gray-500 cursor-wait'
                  : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 active:scale-[0.97]'
                }`}
            >
              <Trash2 className={`w-4 h-4 ${limpiandoCache ? 'animate-spin' : ''}`} />
              {limpiandoCache ? 'Borrando...' : 'Borrar Caché'}
            </button>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 px-4">
            <ShieldCheck className="w-3.5 h-3.5" /> Tu información se gestiona de forma segura.
          </p>
        </div>
      </main>

      <CambiarPasswordForm open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <EditarPerfilModal open={editarPerfilOpen} onClose={() => setEditarPerfilOpen(false)} />
      {puedeCrearCuentas && <CrearUsuarioForm open={crearCuentaOpen} onClose={() => setCrearCuentaOpen(false)} />}
      {puedeVerListado && <ListadoUsuariosModal open={listadoOpen} onClose={() => setListadoOpen(false)} />}
    </div>
  );
}
