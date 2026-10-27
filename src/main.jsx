import { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import { ReportesComunidadProvider } from './context/ReportesComunidadContext.jsx';
import { BottomNavProvider } from './context/BottomNavContext.jsx';
import { WakeupProvider } from './context/WakeupContext.jsx';
import NotificationDetailModal from './components/notifications/NotificationDetailModal.jsx';
import WakeupScreen from './components/common/WakeupScreen.jsx';
import { attachAutoSync } from './utils/syncManager.js';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
          <div className="text-center max-w-md py-16">
            <p className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Algo salió mal</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Se produjo un error inesperado. Puedes recargar la página para intentar de nuevo.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Activa sync offline al despertar / recuperar conexión
attachAutoSync();

// Registro SW solo en producción para no romper dev HMR
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationsProvider>
                <ReportesComunidadProvider>
                  <BottomNavProvider>
                    <WakeupProvider>
                      <App />
                      <WakeupScreen />
                    </WakeupProvider>
                  </BottomNavProvider>
                  <NotificationDetailModal />
                </ReportesComunidadProvider>
              </NotificationsProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
