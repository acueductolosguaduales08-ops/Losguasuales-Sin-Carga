import SimpleModal from './SimpleModal';

export default function EncuestaQrModal({ encuesta, onClose }) {
  return (
    <SimpleModal open={!!encuesta} onClose={onClose} title="Compartir formulario" maxWidth="max-w-sm">
      {encuesta && (
        <div className="flex flex-col items-center text-center">
          <div className="bg-white p-2 rounded-xl mb-4 border border-gray-100">
            <img src={encuesta.codigoQr} alt={`QR de ${encuesta.titulo}`} className="w-48 h-48 object-contain" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Escanea este código para acceder directamente a la encuesta.
          </p>
          <p className="text-xs font-mono bg-gray-50 dark:bg-gray-950 px-3 py-1 rounded mt-3 text-gray-600 dark:text-gray-300">
            Código: {encuesta.codigo}
          </p>
        </div>
      )}
    </SimpleModal>
  );
}
