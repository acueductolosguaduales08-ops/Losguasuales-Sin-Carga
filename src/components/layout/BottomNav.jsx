import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBottomNav } from '../../context/BottomNavContext';
import { getBottomNavConfig } from '../../config/navigation';
import { Z } from '../../utils/zIndex';
import LoginModal from '../common/LoginModal';

const PANEL_WIDTH = 224; // w-56
const EDGE_MARGIN = 8;

// Barra de navegación inferior estilo app de celular. Solo en pantallas
// angostas (md:hidden) — en escritorio la navegación equivalente es el
// menú ☰ del Header, que ya cubre las mismas opciones por rol.
//
// Cada botón es un link directo o abre un panel pequeño ("dropdown")
// anclado justo encima de la barra. El panel se renderiza en un portal a
// document.body con `position: fixed`, y su posición horizontal se
// calcula a partir del botón real (getBoundingClientRect) y luego se
// "clampea" para que nunca se salga de la pantalla por ningún lado —
// antes se centraba con CSS puro sobre cada botón sin importar el
// resultado, así que el panel de los botones más cercanos al borde
// (Tesorería a la izquierda, Más a la derecha) quedaba parcialmente
// cortado en celulares angostos. Mismo patrón ya usado para el picker de
// emojis en la galería.
export default function BottomNav() {
  const { rol, isAuthenticated } = useAuth();
  const { enabled } = useBottomNav();
  const location = useLocation();
  const navigate = useNavigate();
  const [openKey, setOpenKey] = useState(null);
  const [panelCoords, setPanelCoords] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const navRef = useRef(null);
  const panelRef = useRef(null);

  const config = getBottomNavConfig(isAuthenticated ? rol : null);
  const primary = config.primary;

  const calcularCoords = (btnEl) => {
    const rect = btnEl.getBoundingClientRect();
    const centro = rect.left + rect.width / 2;
    const left = Math.min(
      Math.max(centro - PANEL_WIDTH / 2, EDGE_MARGIN),
      window.innerWidth - PANEL_WIDTH - EDGE_MARGIN
    );
    setPanelCoords({ left, bottom: window.innerHeight - rect.top + 8 });
  };

  // Cierra el panel abierto al cambiar de ruta (tras navegar).
  useEffect(() => {
    setOpenKey(null);
  }, [location.pathname]);

  // Tocar fuera (barra o panel) y Escape cierran el panel abierto; en
  // cambios de tamaño de pantalla (p. ej. girar el celular) se recalcula
  // la posición en vez de dejarlo desalineado.
  useEffect(() => {
    if (!openKey) return undefined;
    const handlerClick = (e) => {
      const dentroDeLaBarra = navRef.current && navRef.current.contains(e.target);
      const dentroDelPanel = panelRef.current && panelRef.current.contains(e.target);
      if (!dentroDeLaBarra && !dentroDelPanel) setOpenKey(null);
    };
    const handlerEscape = (e) => {
      if (e.key === 'Escape') setOpenKey(null);
    };
    const handlerResize = () => setOpenKey(null);
    document.addEventListener('mousedown', handlerClick);
    window.addEventListener('keydown', handlerEscape);
    window.addEventListener('resize', handlerResize);
    return () => {
      document.removeEventListener('mousedown', handlerClick);
      window.removeEventListener('keydown', handlerEscape);
      window.removeEventListener('resize', handlerResize);
    };
  }, [openKey]);

  if (!enabled) return null;

  const ejecutarAccion = (item) => {
    setOpenKey(null);
    if (item.action === 'login') {
      setLoginOpen(true);
      return;
    }
    if (item.to && (location.pathname !== item.to || (item.search && location.search !== item.search))) {
      navigate(item.to + (item.search || ''));
    }
  };

  const esActivo = (to) => location.pathname === to;
  const dropdownContieneActivo = (item) =>
    item.type === 'dropdown' && item.children.some((c) => c.to && esActivo(c.to));

  const itemAbierto = primary.find((item, idx) => openKey === item.name + idx);

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Navegación principal"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-dark-muted flex items-stretch h-16"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', zIndex: Z.header }}
      >
        {primary.map((item, idx) => {
          const key = item.name + idx;
          const abierto = openKey === key;
          const activo = item.type === 'link' ? esActivo(item.to) : abierto || dropdownContieneActivo(item);
          const Icon = abierto ? ChevronUp : item.icon;

          return (
            <button
              key={key}
              onClick={(e) => {
                if (item.type === 'link') {
                  setOpenKey(null);
                  if (item.to && (location.pathname !== item.to || (item.search && location.search !== item.search))) {
                    navigate(item.to + (item.search || ''));
                  }
                } else if (abierto) {
                  setOpenKey(null);
                } else {
                  calcularCoords(e.currentTarget);
                  setOpenKey(key);
                }
              }}
              aria-haspopup={item.type === 'dropdown' ? 'menu' : undefined}
              aria-expanded={item.type === 'dropdown' ? abierto : undefined}
              aria-current={item.type === 'link' && activo ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                activo ? 'text-brand dark:text-brand-light' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span className="truncate max-w-[4.2rem]">{item.label || item.name}</span>
            </button>
          );
        })}
      </nav>

      {itemAbierto &&
        panelCoords &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            aria-label={itemAbierto.name}
            className="fixed z-[100] bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted rounded-2xl shadow-2xl overflow-hidden animate-[modalPop_0.15s_ease] py-1.5"
            style={{ left: panelCoords.left, bottom: panelCoords.bottom, width: PANEL_WIDTH }}
          >
            <p className="px-3.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {itemAbierto.name}
            </p>
            {itemAbierto.children.map((child) => {
              const childActivo = child.to && esActivo(child.to);
              return (
                <button
                  key={child.name}
                  role="menuitem"
                  onClick={() => ejecutarAccion(child)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-left transition-colors ${
                    childActivo
                      ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {child.icon && (
                    <child.icon className={`w-4 h-4 shrink-0 ${childActivo ? 'text-brand dark:text-brand-light' : 'text-brand'}`} />
                  )}
                  <span className="truncate">{child.name}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
