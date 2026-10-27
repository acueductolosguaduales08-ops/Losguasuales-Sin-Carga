import { useEffect, useState } from 'react';

// Envuelve una sección del Home que aparece con una animación de entrada
// (clases `reveal-section reveal-N` definidas en index.css).
//
// Igual que `.app-enter` en App.jsx: una vez la animación termina, se
// quita la clase por completo (no solo se confía en que el frame final
// del keyframe tenga `transform: none`). Esto elimina cualquier riesgo de
// que el navegador siga tratando la sección como generador de "containing
// block" para sus descendientes `position: fixed` mientras la propiedad
// `animation` siga presente en el elemento — comportamiento observado en
// algunos navegadores móviles que causaba que modales abiertos desde
// dentro de una sección (por ejemplo, el reproductor de video) se
// posicionaran relativos a la sección en vez de a la pantalla.
export default function RevealSection({ delay = 1, children }) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    // Si el usuario tiene "reducir movimiento" activado, el CSS fuerza
    // `animation: none` (ver index.css) y el evento onAnimationEnd de
    // abajo nunca se dispara; sin este chequeo la clase se quedaría
    // aplicada para siempre en ese caso.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEntered(true);
    }
  }, []);

  return (
    <div
      className={entered ? '' : `reveal-section reveal-${delay}`}
      onAnimationEnd={() => setEntered(true)}
    >
      {children}
    </div>
  );
}
