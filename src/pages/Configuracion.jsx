import { useState } from 'react';
import { Settings, SlidersHorizontal, Wallet, Image, Layout } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import ConfiguracionGeneralForm from '../components/configuracion/ConfiguracionGeneralForm';
import MetodosPagoPanel from '../components/configuracion/MetodosPagoPanel';
import ArchivosInstitucionalesPanel from '../components/configuracion/ArchivosInstitucionalesPanel';
import HeroPanel from '../components/configuracion/HeroPanel';

const TABS = [
  { value: 'general', label: 'General y tarifas', icon: SlidersHorizontal, roles: ['ADMINISTRADOR'] },
  { value: 'hero', label: 'Hero de inicio', icon: Layout, roles: ['ADMINISTRADOR'] },
  { value: 'metodos', label: 'Métodos de pago', icon: Wallet, roles: ['ADMINISTRADOR', 'TESORERO'] },
  { value: 'archivos', label: 'Archivos institucionales', icon: Image, roles: ['ADMINISTRADOR'] },
];

export default function Configuracion() {
  const { rol } = useAuth();
  const puedeVer = rol === 'ADMINISTRADOR' || rol === 'TESORERO';
  const tabsVisibles = TABS.filter((t) => t.roles.includes(rol));
  const [tab, setTab] = useState(tabsVisibles[0]?.value || 'general');

  if (!puedeVer) {
    return (
      <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
        <Header />
        <main className="w-full max-w-2xl mx-auto pt-28 pb-10 px-4 text-center">
          <Settings className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Acceso restringido</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo administradores y tesoreros pueden ver la configuración del sistema.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100 min-h-screen font-sans antialiased pb-16 transition-colors">
      <Header />

      <main className="w-full max-w-4xl mx-auto pt-24 md:pt-28 pb-10 px-4 md:px-6">
        <section className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-brand shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración del sistema</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Módulo 6 · Datos institucionales, tarifas, métodos de pago y archivos oficiales
            </p>
          </div>
        </section>

        <div className="flex gap-1.5 mb-6 flex-wrap">
          {tabsVisibles.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all flex items-center gap-1.5 ${
                  tab === t.value
                    ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20'
                    : 'border-gray-200 dark:border-dark-muted bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:border-brand'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'general' && rol === 'ADMINISTRADOR' && <ConfiguracionGeneralForm />}
        {tab === 'hero' && rol === 'ADMINISTRADOR' && <HeroPanel />}
        {tab === 'metodos' && <MetodosPagoPanel />}
        {tab === 'archivos' && rol === 'ADMINISTRADOR' && <ArchivosInstitucionalesPanel />}
      </main>
    </div>
  );
}
