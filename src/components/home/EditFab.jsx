import { useState } from 'react';
import { Pencil, Images, FileText } from 'lucide-react';
import AdminPanel from '../admin/AdminPanel';
import { useBottomNav } from '../../context/BottomNavContext';

export default function EditFab({ onContentChanged }) {
  const [open, setOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [initialTab, setInitialTab] = useState('publicaciones');
  const { enabled: bottomNavEnabled } = useBottomNav();

  const handleAction = (tab) => {
    setOpen(false);
    setInitialTab(tab);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    onContentChanged?.();
  };

  return (
    <>
      <div
        // En móvil, cuando la barra de navegación inferior está activa,
        // el botón sube por encima de ella (más su zona segura) para no
        // quedar tapado; en escritorio, o con la barra desactivada, se
        // queda en su posición original de siempre.
        className={`fixed right-6 z-40 ${bottomNavEnabled ? 'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6' : 'bottom-6'}`}
        style={{ filter: 'url(#gooey-filter)' }}
      >
        <div className="relative w-16 h-16">
          <button
            onClick={() => handleAction('galeria')}
            aria-label="Editar galería"
            className={`gooey-fab-item absolute bottom-0 right-0 rounded-full bg-brand-light text-white shadow-lg flex items-center justify-center ${
              open ? '-translate-y-[85px]' : 'translate-y-0'
            }`}
            style={{ width: 52, height: 52 }}
          >
            <Images className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleAction('publicaciones')}
            aria-label="Editar publicaciones"
            className={`gooey-fab-item absolute bottom-0 right-0 rounded-full bg-brand text-white shadow-lg flex items-center justify-center ${
              open ? '-translate-x-[85px]' : 'translate-x-0'
            }`}
            style={{ width: 52, height: 52 }}
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú de edición' : 'Abrir menú de edición'}
            className="gooey-fab-btn absolute bottom-0 right-0 w-16 h-16 rounded-full bg-brand-dark text-white shadow-xl flex items-center justify-center z-10"
          >
            <Pencil className={`w-6 h-6 transition-transform duration-300 ${open ? 'rotate-[135deg]' : ''}`} />
          </button>
        </div>

        {/* Filtro SVG invisible para el efecto "gooey" */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id="gooey-filter">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="gooey" />
              <feBlend in="SourceGraphic" in2="gooey" />
            </filter>
          </defs>
        </svg>
      </div>

      <AdminPanel open={panelOpen} initialTab={initialTab} onClose={handleClosePanel} />
    </>
  );
}
