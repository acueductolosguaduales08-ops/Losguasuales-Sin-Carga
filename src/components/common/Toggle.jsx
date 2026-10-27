// Interruptor on/off reutilizable. Extraído del que ya existía dentro de
// EncuestaCrearModal.jsx para poder usarlo también en otras pantallas
// (preferencias de Mi cuenta, etc.) sin duplicar el mismo marcado.
export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" aria-label={label} />
      <div className="w-11 h-6 bg-gray-300 dark:bg-dark-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
    </label>
  );
}
