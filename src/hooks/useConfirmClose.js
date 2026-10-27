import { useState } from 'react';

// Hook genérico para pedir confirmación antes de cerrar un modal/formulario
// que tiene cambios sin guardar. Evita que el usuario pierda todo lo que
// llevaba escrito por un cierre accidental (click en el fondo, tecla Escape,
// botón "Cancelar", etc.).
//
// Uso:
//   const { requestClose, confirming, confirmDiscard, cancelDiscard } = useConfirmClose(isDirty, onClose);
//   ...
//   <div onClick={requestClose} /> // backdrop
//   <button onClick={requestClose}>Cancelar</button>
//   <ConfirmDialog open={confirming} onConfirm={confirmDiscard} onCancel={cancelDiscard} />
export default function useConfirmClose(isDirty, onClose) {
  const [confirming, setConfirming] = useState(false);

  const requestClose = () => {
    if (isDirty) {
      setConfirming(true);
    } else {
      onClose();
    }
  };

  const confirmDiscard = () => {
    setConfirming(false);
    onClose();
  };

  const cancelDiscard = () => setConfirming(false);

  return { confirming, requestClose, confirmDiscard, cancelDiscard };
}
