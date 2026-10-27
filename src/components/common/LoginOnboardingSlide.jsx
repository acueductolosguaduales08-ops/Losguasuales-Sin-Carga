import { Bell, KeyRound, UserCircle2 } from 'lucide-react';

// Contenido de las 3 tarjetas de bienvenida al acceso administrativo/asociado.
// Se muestran una sola vez por dispositivo (se guarda en localStorage).
export const SLIDES = [
  {
    Icon: Bell,
    title: 'Mantente al tanto de nuestra comunidad',
    text: 'Ve notificaciones y participa en encuestas fácilmente.',
  },
  {
    Icon: KeyRound,
    title: 'Cuida tu contraseña',
    text: 'Nunca la compartas con nadie y cámbiala periódicamente para mantener segura tu cuenta.',
  },
  {
    Icon: UserCircle2,
    title: 'Ingresa fácilmente a tu información',
    text: 'Consulta tus datos, tus pagos y el estado de tu servicio desde un solo lugar.',
  },
];

export default function LoginOnboardingSlide({ slide, active }) {
  const { Icon, title, text } = slide;
  return (
    <div
      className={`flex-none w-full flex flex-col items-center justify-center text-center px-4 transition-opacity duration-300 ${
        active ? 'opacity-100' : 'opacity-40'
      }`}
    >
      <div className="w-28 h-28 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-8">
        <Icon className="w-12 h-12 text-brand dark:text-brand-light" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">{text}</p>
    </div>
  );
}
