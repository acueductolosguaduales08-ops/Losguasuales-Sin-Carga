import { createContext, useContext, useCallback, useMemo } from 'react';
import { sileo } from 'sileo';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toast = useCallback(
    (message, type = 'info', duration = 4000, description = null) => {
      const opts = {
        title: message,
        duration: duration || 4000,
      };
      if (description) opts.description = description;
      switch (type) {
        case 'success':
          sileo.success(opts);
          break;
        case 'error':
          sileo.error(opts);
          break;
        case 'warning':
          sileo.warning(opts);
          break;
        case 'info':
        default:
          sileo.info(opts);
          break;
      }
    },
    []
  );

  const success = useCallback((title, description) => {
    sileo.success({ title, description: description || undefined, duration: 4000 });
  }, []);

  const error = useCallback((title, description) => {
    sileo.error({ title, description: description || undefined, duration: 6000 });
  }, []);

  const warning = useCallback((title, description) => {
    sileo.warning({ title, description: description || undefined, duration: 5000 });
  }, []);

  const info = useCallback((title, description) => {
    sileo.info({ title, description: description || undefined, duration: 4000 });
  }, []);

  const chatMessage = useCallback((senderName, message, toastId) => {
    const truncated = message && message.length > 80 ? message.slice(0, 80) + '...' : message;
    return sileo.info({
      id: toastId || 'chat-nuevo-mensaje',
      title: `Nuevo mensaje de ${senderName}`,
      description: truncated || 'Nuevo mensaje',
      duration: null,
    });
  }, []);

  const dismissById = useCallback((toastId) => {
    sileo.dismiss(toastId);
  }, []);

  const value = useMemo(() => ({ toast, success, error, warning, info, chatMessage, dismissById }), [toast, success, error, warning, info, chatMessage, dismissById]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}
