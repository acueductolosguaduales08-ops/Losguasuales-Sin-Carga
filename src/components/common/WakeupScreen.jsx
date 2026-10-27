import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sileo } from 'sileo';
import { useWakeup } from '../../context/WakeupContext';

export default function WakeupScreen() {
  const { wakeupActive, isAwake } = useWakeup();
  const navigate = useNavigate();
  const toastIdRef = useRef(null);

  useEffect(() => {
    if (wakeupActive && !toastIdRef.current) {
      toastIdRef.current = sileo.warning({
        title: 'Servidor despertando',
        description: 'Nuestro server se pausó por inactividad y estará disponible en unos segundos.',
        duration: null,
        button: {
          title: 'Ver detalles',
          onClick: () => navigate('/servidor-despertando'),
        },
      });
    }
  }, [wakeupActive, navigate]);

  useEffect(() => {
    if (isAwake && toastIdRef.current) {
      sileo.dismiss(toastIdRef.current);
      toastIdRef.current = null;
      sileo.success({
        title: 'Servidor listo',
        description: 'El servidor ya está activo. Ya puedes usar la app.',
        duration: 4000,
      });
    }
  }, [isAwake]);

  return null;
}
