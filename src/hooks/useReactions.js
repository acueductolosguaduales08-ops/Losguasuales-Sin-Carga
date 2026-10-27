import { useEffect, useState, useCallback } from 'react';
import { HomeAPI } from '../api/home';

const STORAGE_KEY = 'acueducto_mis_reacciones';

function readStoredReactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeStoredReactions(all) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/**
 * Maneja el conteo de reacciones de una publicación y evita que el mismo
 * dispositivo reaccione más de una vez con el mismo emoji (guardado en localStorage,
 * ya que el backend no lleva registro de quién reacciona).
 */
export function useReactions(publicacionId) {
  const [reacciones, setReacciones] = useState([]);
  const [misReacciones, setMisReacciones] = useState([]);

  useEffect(() => {
    if (!publicacionId) return;
    HomeAPI.reacciones(publicacionId)
      .then((data) => setReacciones(data || []))
      .catch(() => setReacciones([]));

    const stored = readStoredReactions();
    setMisReacciones(stored[publicacionId] || []);
  }, [publicacionId]);

  const toggle = useCallback(
    async (emoji) => {
      if (!publicacionId) return;
      const yaReacciono = misReacciones.includes(emoji);

      try {
        if (yaReacciono) {
          await HomeAPI.quitarReaccion(publicacionId, emoji);
          setMisReacciones((prev) => {
            const next = prev.filter((e) => e !== emoji);
            const all = readStoredReactions();
            all[publicacionId] = next;
            writeStoredReactions(all);
            return next;
          });
          setReacciones((prev) =>
            prev.map((r) => (r.emoji === emoji ? { ...r, contador: Math.max(0, r.contador - 1) } : r))
          );
        } else {
          await HomeAPI.reaccionar(publicacionId, emoji);
          setMisReacciones((prev) => {
            const next = [...prev, emoji];
            const all = readStoredReactions();
            all[publicacionId] = next;
            writeStoredReactions(all);
            return next;
          });
          setReacciones((prev) => {
            const existe = prev.some((r) => r.emoji === emoji);
            if (existe) return prev.map((r) => (r.emoji === emoji ? { ...r, contador: r.contador + 1 } : r));
            return [...prev, { emoji, contador: 1 }];
          });
        }
        return true;
      } catch {
        return false;
      }
    },
    [publicacionId, misReacciones]
  );

  return { reacciones, misReacciones, toggle };
}
