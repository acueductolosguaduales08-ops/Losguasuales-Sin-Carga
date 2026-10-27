import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Database, Bell } from 'lucide-react';

// SUPABASE-ONLY: ya no hay servidor Render que "despierte".
// Esta página ahora explica la conexión directa.
const CARDS = [
  {
    icon: Zap,
    color: 'blue',
    title: 'Conexión directa',
    description: 'La app habla directamente con Supabase, sin servidor intermedio. No hay tiempos de espera por activación.',
  },
  {
    icon: Database,
    color: 'indigo',
    title: 'Tus datos en Supabase',
    description: 'Facturas, pagos, asociados y demás viven en tu proyecto Supabase con respaldo automático.',
  },
  {
    icon: Bell,
    color: 'orange',
    title: 'Si algo no carga',
    description: 'Revisa tu conexión a internet y vuelve a intentar. Si persiste, avisa al administrador con captura del error.',
  },
];

const COLOR_MAP = {
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    iconText: 'text-blue-600 dark:text-blue-400',
  },
  indigo: {
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
    iconText: 'text-indigo-600 dark:text-indigo-400',
  },
  orange: {
    iconBg: 'bg-orange-100 dark:bg-orange-500/20',
    iconText: 'text-orange-600 dark:text-orange-400',
    cardBg: 'bg-orange-50 dark:bg-orange-500/10',
    cardBorder: 'border-orange-200 dark:border-orange-500/20',
  },
};

export default function ServerInfoPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <div className="max-w-2xl mx-auto px-4 pt-24 md:pt-28 pb-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
          Estado de la conexión
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Cómo se conecta la app a tus datos.
        </p>

        <div className="space-y-4">
          {CARDS.map((card) => {
            const colors = COLOR_MAP[card.color];
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`p-5 rounded-2xl border flex items-start gap-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-dark-muted ${
                  colors.cardBg || ''
                } ${colors.cardBorder || ''}`}
              >
                <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 ${colors.iconBg} ${colors.iconText}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <strong className="block mb-1 font-semibold text-gray-900 dark:text-white">
                    {card.title}
                  </strong>
                  <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {card.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-8 w-full py-3 rounded-xl font-semibold text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </main>
  );
}
