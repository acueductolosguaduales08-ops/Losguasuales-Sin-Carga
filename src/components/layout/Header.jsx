import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { Bell, Moon, Sun, LogIn, LogOut, ShieldCheck, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useReportesComunidad } from '../../context/ReportesComunidadContext';
import NotificationsBellDropdown from './NotificationsBellDropdown';
import LoginModal from '../common/LoginModal';
import BuscadorGlobalModal from '../search/BuscadorGlobalModal';
import { ROLES_QUE_PUEDE_CREAR } from '../../api/auth';
import { MENU_SECTIONS, menuTitleForPath } from '../../config/navigation';
import UserAvatar from '../common/UserAvatar';

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [buscadorOpen, setBuscadorOpen] = useState(false);
  const { toggleTheme, isDark } = useTheme();
  const { isAuthenticated, usuario, rol, estadoServicio, logout } = useAuth();
  const puedeCrearCuentas = (ROLES_QUE_PUEDE_CREAR[rol] || []).length > 0;
  const { noLeidas } = useNotifications();
  const { nuevos: reportesNuevos } = useReportesComunidad();
  const navigate = useNavigate();
  const location = useLocation();

  const badgeCounts = { reportesComunidad: reportesNuevos };

  // Bug conocido en algunos celulares: sin esto, el fondo detrás del menú
  // seguía siendo scrolleable y dejaba "bajar" más contenido del que debería
  // verse mientras el sidebar estaba abierto.
  useLockBodyScroll(sidebarOpen);

  const closeSidebar = () => setSidebarOpen(false);

  const handleMenuClick = (item) => {
    closeSidebar();
    if (item.type === 'route') {
      if (location.pathname !== item.to || (item.search && location.search !== item.search)) {
        navigate(item.to + (item.search || ''));
      }
      return;
    }
    // Ancla dentro del Home: si no estamos ahí, navega primero y luego hace scroll.
    const sectionId = item.to.replace('#', '');
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 shadow-sm">
        {/* Fondo con blur en su propia capa: si el blur va en el mismo elemento que
            contiene elementos "fixed" (como el desplegable de notificaciones), el
            navegador crea ahí un nuevo "containing block" y esos elementos dejan de
            posicionarse respecto a la pantalla, sino respecto a este header. Por eso
            el blur vive en una capa aparte, detrás del contenido. */}
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md -z-10" aria-hidden="true" />
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto relative">
          <div className="flex items-center gap-3">
            <button
              aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              className={`burger ${sidebarOpen ? 'is-open' : ''}`}
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <button onClick={() => navigate('/mi-cuenta')} className="shrink-0">
              <UserAvatar username={usuario?.username} rol={rol} estadoServicio={estadoServicio} size="w-9 h-9" />
            </button>
            <h1 className="font-bold text-base sm:text-lg tracking-wide text-gray-800 dark:text-white truncate max-w-[45vw] sm:max-w-none">
              {location.pathname === '/' ? 'Home' : menuTitleForPath(location.pathname)}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {(rol === 'ADMINISTRADOR' || rol === 'TESORERO') && (
              <button
                onClick={() => setBuscadorOpen(true)}
                aria-label="Buscar en todo el sistema"
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={toggleTheme}
              aria-label="Cambiar modo de color"
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Ver notificaciones"
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <Bell className="w-5 h-5" />
              {noLeidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-0.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 min-w-4 px-1 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                </span>
              )}
            </button>
            <NotificationsBellDropdown open={notifOpen} onClose={() => setNotifOpen(false)} onVerMas={() => navigate('/notificaciones')} />

            {!isAuthenticated ? (
              <button
                onClick={() => setLoginOpen(true)}
                className="ml-1 flex items-center gap-2 px-3 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Iniciar sesión</span>
              </button>
            ) : (
              <button
                onClick={logout}
                className="ml-1 flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Fondo oscuro al abrir sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={closeSidebar} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-[85vw] max-w-72 sm:w-72 bg-white dark:bg-gray-900 shadow-2xl pt-20 px-5 sm:px-6 z-40 overflow-hidden flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-4 border-b border-gray-200 dark:border-white/10 pb-2">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Menú de navegación</h2>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {MENU_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(rol));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title}>
                <p className="nav-section-title">{section.title}</p>
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
                    const isActive = location.pathname === item.to;
                    return (
                      <li key={item.name}>
                        <button
                          onClick={() => handleMenuClick(item)}
                          className={`w-full text-left flex items-center gap-3 p-3 text-sm font-medium rounded-lg transition-colors ${
                            isActive
                              ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light'
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                        >
                          {item.icon && (
                            <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand dark:text-brand-light' : 'text-brand'}`} />
                          )}
                          <span className="flex-1 min-w-0">
                            <span className="block truncate">{item.name}</span>
                            {(() => {
                              const subtitle =
                                item.to === '/mi-cuenta' && puedeCrearCuentas
                                  ? 'Perfil, contraseña y crear cuentas'
                                  : item.subtitle;
                              return (
                                subtitle && (
                                  <span className="block text-xs font-normal text-gray-400 dark:text-gray-500 truncate">
                                    {subtitle}
                                  </span>
                                )
                              );
                            })()}
                          </span>
                          {badgeCount > 0 && (
                            <span className="shrink-0 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold">
                              {badgeCount > 9 ? '9+' : badgeCount}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <h2 className="text-lg font-bold mb-4 mt-2 border-t border-b border-gray-200 dark:border-white/10 py-3 text-gray-800 dark:text-white">
          Configuración
        </h2>

        <div className="flex items-center justify-between mb-6">
          <span className="font-medium text-sm text-gray-700 dark:text-gray-200">Modo oscuro</span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 focus:outline-none"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
        </div>

        {isAuthenticated ? (
          <div className="mt-2 w-full flex items-center gap-3 p-3 bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-light rounded-xl text-sm font-bold">
            <ShieldCheck className="w-5 h-5" />
            <span className="truncate">
              {usuario?.username} · {rol}
            </span>
          </div>
        ) : (
          <button
            onClick={() => {
              closeSidebar();
              setLoginOpen(true);
            }}
            className="mt-2 w-full flex items-center gap-3 p-3 bg-brand/10 hover:bg-brand/20 dark:bg-brand/20 dark:hover:bg-brand/30 text-brand dark:text-brand-light rounded-xl text-sm font-bold transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Iniciar sesión (Admin / Tesorero)
          </button>
        )}
      </aside>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <BuscadorGlobalModal open={buscadorOpen} onClose={() => setBuscadorOpen(false)} />
    </>
  );
}
