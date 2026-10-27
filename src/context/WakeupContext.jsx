import { createContext, useContext } from 'react';

// SUPABASE-ONLY: sin servidor Render que despertar. Proveedor no-op
// para no romper las pantallas que usan useWakeup().
const WakeupContext = createContext(null);

export function WakeupProvider({ children }) {
  return (
    <WakeupContext.Provider
      value={{
        wakeupActive: false,
        elapsedSeconds: 0,
        attempts: 0,
        isAwake: true,
        hidden: true,
        triggerWakeup: () => {},
        hideWakeup: () => {},
      }}
    >
      {children}
    </WakeupContext.Provider>
  );
}

export function useWakeup() {
  const ctx = useContext(WakeupContext);
  if (!ctx) throw new Error('useWakeup must be used within WakeupProvider');
  return ctx;
}
