import { QrCode } from 'lucide-react';

export default function EncuestaPublicCard({ encuesta, onShowQr, onResponder }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-white/10/60 p-5 flex flex-col hover:border-brand/50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg leading-tight text-gray-800 dark:text-white">{encuesta.titulo}</h3>
        <button
          onClick={() => onShowQr(encuesta)}
          title="Mostrar QR"
          className="text-gray-400 hover:text-brand shrink-0"
        >
          <QrCode className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-grow">{encuesta.descripcion}</p>

      <div className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex gap-4">
        <span>Código: {encuesta.codigo}</span>
        <span>
          {(encuesta.preguntas || []).length} pregunta{(encuesta.preguntas || []).length === 1 ? '' : 's'}
        </span>
      </div>

      <button
        onClick={() => onResponder(encuesta)}
        className="w-full bg-brand hover:bg-brand-dark text-white py-2 rounded-lg font-medium transition-colors"
      >
        Responder ahora
      </button>
    </div>
  );
}
