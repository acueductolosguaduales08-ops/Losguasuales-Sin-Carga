import { useState, useRef } from 'react';
import { X, User, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import LoginOnboardingSlide, { SLIDES } from './LoginOnboardingSlide';

const scrollFieldIntoView = (e) => {
  // Pequeño margen para que el teclado virtual no tape el campo activo.
  setTimeout(() => {
    e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 250);
};

const ONBOARDING_SEEN_KEY = 'acueducto_login_onboarding_seen';

export default function LoginModal({ open, onClose }) {
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDING_SEEN_KEY));
  const [slideIndex, setSlideIndex] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState(null);
  const [shake, setShake] = useState(false);
  const touchStartX = useRef(0);

  const { login } = useAuth();
  const { success: toastSuccess } = useToast();

  useLockBodyScroll(open, onClose);

  if (!open) return null;

  const finishOnboarding = () => {
    localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
    setShowOnboarding(false);
  };

  const nextSlide = () => {
    if (slideIndex < SLIDES.length - 1) setSlideIndex((i) => i + 1);
    else finishOnboarding();
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && slideIndex < SLIDES.length - 1) setSlideIndex((i) => i + 1);
      else if (diff < 0 && slideIndex > 0) setSlideIndex((i) => i - 1);
    }
  };

  const handleClose = () => {
    setSlideIndex(0);
    setFormError(null);
    setUsername('');
    setPassword('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      const usuario = await login(username.trim(), password);
      setSuccess(true);
      toastSuccess(`Bienvenido, ${usuario?.username || 'usuario'}.`);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      const message =
        err.status === 401 || err.status === 403
          ? 'Usuario o contraseña incorrectos.'
          : err.message || 'No se pudo iniciar sesión. Intenta de nuevo.';
      setFormError(message);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-shell fixed inset-0 bg-black/60 z-[100] flex items-start sm:items-center justify-center p-4 py-8 overflow-y-auto overscroll-contain"
      onClick={handleClose}
    >
      <div
        className="modal-shell__card bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md relative shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={handleClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white/70 dark:bg-black/30 rounded-full p-1.5"
        >
          <X className="w-5 h-5" />
        </button>

        {showOnboarding ? (
          <div className="modal-shell__body p-6 pt-10 flex flex-col flex-1" style={{ minHeight: 440 }}>
            <div
              className="flex-1 overflow-hidden relative"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
              >
                {SLIDES.map((slide, i) => (
                  <LoginOnboardingSlide key={i} slide={slide} active={i === slideIndex} />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={finishOnboarding}
                className="text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Omitir
              </button>

              <div className="flex gap-2">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlideIndex(i)}
                    aria-label={`Ir a la diapositiva ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      i === slideIndex ? 'w-6 bg-brand' : 'w-2 bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                aria-label="Siguiente"
                className="w-11 h-11 bg-brand hover:bg-brand-dark text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                {slideIndex === SLIDES.length - 1 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className={`modal-shell__body p-8 flex-1 overflow-y-auto overscroll-contain ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}>
            {success ? (
              <div className="flex flex-col items-center py-10">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">¡Bienvenido!</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Ingresando al panel…</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Iniciar sesión</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ingresa tus credenciales para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <User className="w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={scrollFieldIntoView}
                      placeholder="Usuario"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all dark:text-white font-medium"
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-brand transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={scrollFieldIntoView}
                      placeholder="Contraseña"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all dark:text-white font-medium"
                    />
                  </div>

                  {formError && <p className="text-sm text-red-500 px-1">{formError}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-brand/30 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Ingresando…
                      </>
                    ) : (
                      <>
                        Ingresar
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <a
                    href="/recuperar"
                    onClick={handleClose}
                    className="block text-center text-sm text-brand hover:underline mt-1"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </form>
              </>
            )}
          </div>
        )}
        </div>
    </div>
  );
}
