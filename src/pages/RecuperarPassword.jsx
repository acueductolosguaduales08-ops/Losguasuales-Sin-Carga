import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// Página pública /recuperar — dos modos:
// 1. Sin sesión de recovery: pide el correo y envía el enlace.
// 2. Con sesión de recovery (viene del enlace del correo): pide la contraseña nueva.
export default function RecuperarPassword() {
  const navigate = useNavigate();
  const [fase, setFase] = useState('verificando'); // verificando | solicitar | definir | listo
  const [correo, setCorreo] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [msg, setMsg] = useState(null); // { tipo: 'error'|'ok', texto }
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      // Link inválido/expirado (ej. clic por segunda vez)
      if (window.location.hash.includes('error=')) {
        if (!cancel) {
          setMsg({ tipo: 'error', texto: 'El enlace es inválido o ya expiró (los enlaces son de un solo uso). Pide uno nuevo abajo.' });
          setFase('solicitar');
        }
        return;
      }
      // supabase-js con detectSessionInUrl procesa el hash automáticamente al cargar.
      // Esperamos un momento a que la sesión de recovery esté disponible.
      for (let i = 0; i < 10; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancel) return;
        if (session?.user) {
          setFase('definir');
          return;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!cancel) setFase('solicitar');
    })();
    return () => { cancel = true; };
  }, []);

  const solicitar = async (e) => {
    e.preventDefault();
    if (!correo.includes('@')) {
      setMsg({ tipo: 'error', texto: 'Escribe un correo válido.' });
      return;
    }
    setCargando(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
        redirectTo: `${window.location.origin}/recuperar`,
      });
      if (error) throw error;
      setMsg({ tipo: 'ok', texto: 'Listo. Revisa tu correo y abre el enlace (solo funciona una vez y vence en 1 hora).' });
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message || 'No se pudo enviar el correo.' });
    } finally {
      setCargando(false);
    }
  };

  const definir = async (e) => {
    e.preventDefault();
    if (nueva.length < 8) {
      setMsg({ tipo: 'error', texto: 'La contraseña debe tener mínimo 8 caracteres.' });
      return;
    }
    if (nueva !== confirmar) {
      setMsg({ tipo: 'error', texto: 'La confirmación no coincide.' });
      return;
    }
    setCargando(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: nueva });
      if (error) throw error;
      setFase('listo');
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message || 'No se pudo guardar. Pide un enlace nuevo.' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-[70dvh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Recuperar contraseña</h2>

        {fase === 'verificando' && (
          <p className="text-sm text-gray-500 mt-4">Verificando enlace…</p>
        )}

        {fase === 'solicitar' && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Te enviamos un enlace a tu correo para crear una nueva.</p>
            <form onSubmit={solicitar} className="space-y-4">
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tu-correo@ejemplo.com"
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 rounded-2xl outline-none dark:text-white font-medium"
              />
              <button type="submit" disabled={cargando}
                className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold rounded-2xl transition-all">
                {cargando ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>
          </>
        )}

        {fase === 'definir' && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Escribe tu nueva contraseña.</p>
            <form onSubmit={definir} className="space-y-4">
              <input
                type="password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                placeholder="Nueva contraseña (mín. 8)"
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 rounded-2xl outline-none dark:text-white font-medium"
              />
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 rounded-2xl outline-none dark:text-white font-medium"
              />
              <button type="submit" disabled={cargando}
                className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold rounded-2xl transition-all">
                {cargando ? 'Guardando…' : 'Guardar contraseña'}
              </button>
            </form>
          </>
        )}

        {fase === 'listo' && (
          <div className="text-center py-6">
            <p className="text-emerald-600 font-bold text-lg">¡Contraseña actualizada!</p>
            <button onClick={() => navigate('/')}
              className="mt-4 px-6 py-3 bg-brand text-white font-bold rounded-2xl">
              Ir al inicio e iniciar sesión
            </button>
          </div>
        )}

        {msg && (
          <p className={`text-sm mt-4 px-1 ${msg.tipo === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>{msg.texto}</p>
        )}

        <Link to="/" className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-6">Volver al inicio</Link>
      </div>
    </div>
  );
}
