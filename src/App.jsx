import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sileo';
import Intro from './components/common/Intro';
import Home from './pages/Home';
import ErrorBoundary from './components/common/ErrorBoundary';
import RouteLoading from './components/common/RouteLoading';
import ProtectedRoute from './components/common/ProtectedRoute';
import BottomNav from './components/layout/BottomNav';
import InstallBanner from './components/common/InstallBanner';
import PendingDeletesModal from './components/common/PendingDeletesModal';
import OfflineBadge from './components/common/OfflineBadge';
import { useBottomNav } from './context/BottomNavContext';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { solicitarPermisoNotificaciones } from './utils/notificacionesSistema';

// Code-splitting por ruta: cada página se descarga solo cuando el usuario
// navega a ella, en vez de que el bundle inicial cargue las ~20 páginas de
// una sola vez. Home queda fuera del lazy() porque es la pantalla de
// entrada más común y así se ve al instante tras el Intro.
const Encuestas = lazy(() => import('./pages/Encuestas'));
const EscanearQr = lazy(() => import('./pages/EscanearQr'));
const CrearNotificacion = lazy(() => import('./pages/CrearNotificacion'));
const NotificationsListPage = lazy(() => import('./pages/NotificationsListPage'));
const Medidores = lazy(() => import('./pages/Medidores'));
const Asociados = lazy(() => import('./pages/Asociados'));
const PerfilAsociado = lazy(() => import('./pages/PerfilAsociado'));
const Lecturas = lazy(() => import('./pages/Lecturas'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Facturacion = lazy(() => import('./pages/Facturacion'));
const MisFacturas = lazy(() => import('./pages/MisFacturas'));
const MisMultas = lazy(() => import('./pages/MisMultas'));
const MiConsumo = lazy(() => import('./pages/MiConsumo'));
const PeriodosContables = lazy(() => import('./pages/PeriodosContables'));
const DetallePeriodo = lazy(() => import('./pages/DetallePeriodo'));
const ReportesComunidad = lazy(() => import('./pages/ReportesComunidad'));
const Auditoria = lazy(() => import('./pages/Auditoria'));
const Estadisticas = lazy(() => import('./pages/Estadisticas'));
const Tesoreria = lazy(() => import('./pages/Tesoreria'));
const Multas = lazy(() => import('./pages/Multas'));
const Recibos = lazy(() => import('./pages/Recibos'));
const Informes = lazy(() => import('./pages/Informes'));
const MiCuenta = lazy(() => import('./pages/MiCuenta'));
const CompartirApp = lazy(() => import('./pages/CompartirApp'));
const DatosImportantes = lazy(() => import('./pages/DatosImportantes'));
const ChatPage = lazy(() => import('./components/chat/ChatPage'));
const Help = lazy(() => import('./pages/Help'));
const NotasCredito = lazy(() => import('./pages/NotasCredito'));
const DeudasCartera = lazy(() => import('./pages/DeudasCartera'));
const ConciliacionBancaria = lazy(() => import('./pages/ConciliacionBancaria'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ServerInfoPage = lazy(() => import('./pages/ServerInfoPage'));
const RecuperarPassword = lazy(() => import('./pages/RecuperarPassword'));
const DocumentoPublico = lazy(() => import('./pages/DocumentoPublico'));
const Panel = lazy(() => import('./pages/Panel'));

// Landing por rol: ADMIN/TESORERO entran al Panel operativo; el resto
// ve la Home comunitaria. El Home comunitario sigue accesible en
// /comunidad para el personal.
function HomeEntrada() {
  const { isAuthenticated, rol } = useAuth();
  if (isAuthenticated && (rol === 'ADMINISTRADOR' || rol === 'TESORERO')) {
    return <Panel />;
  }
  return <Home />;
}

const INTRO_SEEN_KEY = 'acueducto_intro_seen';

function App() {
  const { theme } = useTheme();
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem(INTRO_SEEN_KEY));
  // Controla si la animación de entrada (app-enter) ya terminó. Una vez
  // termina, se quita la clase por completo (no solo se confía en que el
  // frame final del keyframe sea `transform: none`). Ver nota extensa en
  // index.css: algunos navegadores móviles siguen tratando un elemento
  // como generador de "containing block" para sus descendientes `fixed`
  // mientras la propiedad `animation` siga presente, incluso si el valor
  // computado del frame final es `none`. Quitando la clase (y por lo
  // tanto la animación) del todo, se elimina cualquier ambigüedad.
  const [appEntered, setAppEntered] = useState(false);
  const { enabled: bottomNavEnabled } = useBottomNav();

  useEffect(() => {
    // Si el usuario tiene activado "reducir movimiento", el CSS fuerza
    // `animation: none` (ver index.css), así que el evento onAnimationEnd
    // de abajo nunca se dispara. Sin este chequeo, la clase `app-enter`
    // (y con ella cualquier riesgo de containing block) se quedaría
    // aplicada para siempre en ese caso.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAppEntered(true);
    }
  }, []);

  const handleIntroFinish = () => {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    setShowIntro(false);
  };

  useEffect(() => {
    if (!showIntro) {
      const timer = setTimeout(() => solicitarPermisoNotificaciones(), 2000);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  // Toast global para cola offline / errores de red dormido
  useEffect(() => {
    const onQueued = (e) => {
      try {
        const op = e.detail;
        const isDelete = op && String(op.path).includes('/api/v1/') && op.method === 'DELETE';
        if (isDelete) {
          // sileo se importa dinámicamente para no romper si no está montado
          import('sileo').then(({ sileo }) => sileo.warning({ title: 'Eliminación pendiente de confirmación', description: 'Se pedirá confirmar antes de aplicarla.' }));
        } else {
          import('sileo').then(({ sileo }) => sileo.info({ title: 'Guardado localmente', description: 'El servidor está despertando. Se sincronizará automáticamente.' }));
        }
      } catch {}
    };
    const onSyncDone = (e) => {
      const d = e.detail || {};
      if (d.synced > 0) import('sileo').then(({ sileo }) => sileo.success({ title: `Sincronizado ${d.synced} cambio(s)`, description: d.failed ? `${d.failed} fallo(s) reintentando` : 'Todo al día.' }));
    };
    window.addEventListener('acueducto-offline-queued', onQueued);
    window.addEventListener('acueducto-sync-done', onSyncDone);
    return () => {
      window.removeEventListener('acueducto-offline-queued', onQueued);
      window.removeEventListener('acueducto-sync-done', onSyncDone);
    };
  }, []);

  if (showIntro) {
    return <Intro onFinish={handleIntroFinish} />;
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-center" theme={theme === 'dark' ? 'light' : 'dark'} />
      <div
        className={`${appEntered ? '' : 'app-enter'} ${
          bottomNavEnabled ? 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0' : ''
        }`}
        onAnimationEnd={() => setAppEntered(true)}
      >
      <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route path="/" element={<HomeEntrada />} />
        <Route path="/comunidad" element={<Home />} />
        <Route path="/panel" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <Panel />
          </ProtectedRoute>
        } />
        <Route path="/factura/:numero" element={<DocumentoPublico />} />
        <Route path="/recibo/:numero" element={<DocumentoPublico />} />
        <Route path="/encuestas" element={<Encuestas />} />
        <Route path="/escanear-qr" element={<EscanearQr />} />
        <Route path="/notificaciones" element={<NotificationsListPage />} />
        <Route path="/mis-facturas" element={<MisFacturas />} />
        <Route path="/mis-multas" element={<MisMultas />} />
        <Route path="/mi-consumo" element={<MiConsumo />} />
        <Route path="/reportes-comunidad" element={<ReportesComunidad />} />
        <Route path="/mi-cuenta" element={<MiCuenta />} />
        <Route path="/compartir" element={<CompartirApp />} />
        <Route path="/datos-importantes" element={
          <ProtectedRoute roles={['ADMINISTRADOR']}>
            <DatosImportantes />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/help" element={<Help />} />
        <Route path="/recibos" element={
          <ProtectedRoute roles={['ADMINISTRADOR', 'TESORERO', 'ASOCIADO']}>
            <Recibos />
          </ProtectedRoute>
        } />
        <Route path="/notificaciones/crear" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <CrearNotificacion />
          </ProtectedRoute>
        } />
        <Route path="/medidores" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <Medidores />
          </ProtectedRoute>
        } />
        <Route path="/asociados" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <Asociados />
          </ProtectedRoute>
        } />
        <Route path="/asociados/:asociadoId" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <PerfilAsociado />
          </ProtectedRoute>
        } />
        <Route path="/lecturas" element={
          <ProtectedRoute roles={['ADMINISTRADOR']}>
            <Lecturas />
          </ProtectedRoute>
        } />
        <Route path="/configuracion" element={
          <ProtectedRoute roles={['ADMINISTRADOR', 'TESORERO']}>
            <Configuracion />
          </ProtectedRoute>
        } />
        <Route path="/facturacion" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <Facturacion />
          </ProtectedRoute>
        } />
        <Route path="/periodos-contables" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <PeriodosContables />
          </ProtectedRoute>
        } />
        <Route path="/periodos-contables/:periodoId" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <DetallePeriodo />
          </ProtectedRoute>
        } />
        <Route path="/auditoria" element={
          <ProtectedRoute roles={['ADMINISTRADOR']}>
            <Auditoria />
          </ProtectedRoute>
        } />
        <Route path="/estadisticas" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <Estadisticas />
          </ProtectedRoute>
        } />
        <Route path="/tesoreria" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <Tesoreria />
          </ProtectedRoute>
        } />
        <Route path="/multas" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <Multas />
          </ProtectedRoute>
        } />
        <Route path="/informes" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <Informes />
          </ProtectedRoute>
        } />
        <Route path="/notas-credito" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <NotasCredito />
          </ProtectedRoute>
        } />
        <Route path="/deudas-cartera" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <DeudasCartera />
          </ProtectedRoute>
        } />
        <Route path="/conciliacion" element={
          <ProtectedRoute roles={['TESORERO', 'ADMINISTRADOR']}>
            <ConciliacionBancaria />
          </ProtectedRoute>
        } />
        <Route path="/servidor-despertando" element={<ServerInfoPage />} />
        <Route path="/recuperar" element={<RecuperarPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      </div>
      {/* Fuera del wrapper con animación de entrada a propósito: un elemento
          `fixed` anidado dentro de un ancestro que anima `transform` corre
          riesgo de posicionarse relativo a ese ancestro en vez de a la
          pantalla en algunos navegadores móviles (la misma causa raíz que
          rompía los modales — ver notas en index.css y RevealSection). */}
      <BottomNav />
      <InstallBanner />
      <PendingDeletesModal />
      <OfflineBadge />
    </ErrorBoundary>
  );
}

export default App;
