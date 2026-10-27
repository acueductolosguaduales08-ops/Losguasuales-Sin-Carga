import { useState } from 'react';
import { MessageCircle, Clock, Smartphone, Shield, Heart, X } from 'lucide-react';

const STORAGE_KEY = 'acueducto_chat_condiciones_aceptadas';

export function chatCondicionesAceptadas() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function aceptarCondicionesChat() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch { /* ignore */ }
}

export function resetCondicionesChat() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

export default function ChatCondiciones({ onAceptar, onCancelar }) {
  const [aceptando, setAceptando] = useState(false);

  const handleAceptar = () => {
    setAceptando(true);
    aceptarCondicionesChat();
    setTimeout(() => onAceptar(), 300);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-[modalPop_0.2s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-brand" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Chat Interno</h2>
          </div>
          <button
            onClick={onCancelar}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Contenido */}
        <div className="px-5 pb-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Antes de usar el chat, por favor lee y acepta las siguientes condiciones:
          </p>

          {/* Condición 1 */}
          <div className="flex gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-800/40 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Retención de mensajes</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Los mensajes se conservan en el servidor por <strong>8 días</strong>. Sin embargo, se guardan
                localmente en este dispositivo, por lo que <strong>no se perderán en este celular</strong>.
                Si cambias de dispositivo, el historial no se transferirá automáticamente.
              </p>
            </div>
          </div>

          {/* Condición 2 */}
          <div className="flex gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Uso exclusivo</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                El chat es <strong>exclusivamente para temas del acueducto</strong>: pagos, quejas,
                inquietudes, solicitudes y cualquier asunto relacionado con el servicio de agua.
              </p>
            </div>
          </div>

          {/* Condición 3 */}
          <div className="flex gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-green-100 dark:bg-green-800/40 flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Cordialidad</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Mantén un trato <strong>respetuoso y cordial</strong> en todo momento. Los mensajes
                ofensivos o inapropiados podrán ser eliminados por los administradores.
              </p>
            </div>
          </div>

          {/* Condición 4 */}
          <div className="flex gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-800/40 flex items-center justify-center">
              <Smartphone className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Eliminación de mensajes</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Puedes solicitar eliminar tus propios mensajes. La eliminación requiere la
                <strong> aprobación del otro participante</strong>. Los administradores pueden
                eliminar conversaciones completas.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancelar}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-dark-muted text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAceptar}
              disabled={aceptando}
              className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-sm font-semibold text-white transition-colors disabled:opacity-60"
            >
              {aceptando ? 'Aceptando…' : 'Acepto las condiciones'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
