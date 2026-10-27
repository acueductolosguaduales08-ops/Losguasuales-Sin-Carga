import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileBarChart, CalendarDays, CalendarRange, UserSearch, Users } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import InformeMensualPanel from '../components/informes/InformeMensualPanel';
import InformeAnualPanel from '../components/informes/InformeAnualPanel';
import InformeAsociadoPanel from '../components/informes/InformeAsociadoPanel';
import ListadoAsociadosPanel from '../components/informes/ListadoAsociadosPanel';

const TABS = [
  { key: 'mensual', label: 'Informe mensual', icon: CalendarDays },
  { key: 'anual', label: 'Informe anual', icon: CalendarRange },
  { key: 'asociado', label: 'Informe por asociado', icon: UserSearch },
  { key: 'listado', label: 'Listado de asociados', icon: Users },
];

export default function Informes() {
  const { rol } = useAuth();
  const puedeVer = rol === 'ADMINISTRADOR' || rol === 'TESORERO';
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('mensual');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some((t) => t.key === tabParam)) {
      setTab(tabParam);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const asociadoIdInicial = searchParams.get('asociadoId') || null;
  const asociadoNombreInicial = searchParams.get('asociadoNombre') || '';

  if (!puedeVer) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <FileBarChart className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden generar informes. Inicia sesión con una cuenta autorizada.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-6xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        {/* Encabezado */}
        <section className="flex items-center gap-2 mb-6">
          <FileBarChart className="w-6 h-6 text-brand shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Informes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Módulo 16 · Informes mensuales, anuales y de seguimiento a asociados
            </p>
          </div>
        </section>

        {/* Pestañas */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {TABS.map((t) => {
            const Icon = t.icon;
            const activo = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                  activo
                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-dark-muted text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Contenido */}
        {tab === 'mensual' && <InformeMensualPanel />}
        {tab === 'anual' && <InformeAnualPanel />}
        {tab === 'asociado' && (
          <InformeAsociadoPanel
            asociadoIdInicial={asociadoIdInicial}
            asociadoNombreInicial={asociadoNombreInicial}
          />
        )}
        {tab === 'listado' && <ListadoAsociadosPanel />}
      </main>
    </div>
  );
}
