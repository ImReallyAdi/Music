import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '@material/web/icon/icon.js';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              layout
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-elevation-3 backdrop-blur-md border border-white/10 ${
                toast.type === 'error' ? 'bg-error-container text-error-on-container' :
                toast.type === 'success' ? 'bg-primary-container text-primary-on-container' :
                'bg-surface-container-highest text-surface-on'
              }`}
            >
              {toast.type === 'success' && <md-icon class="material-symbols-rounded shrink-0" style={{ fontSize: '20px' }}>check_circle</md-icon>}
              {toast.type === 'error' && <md-icon class="material-symbols-rounded shrink-0" style={{ fontSize: '20px' }}>error</md-icon>}
              {toast.type === 'info' && <md-icon class="material-symbols-rounded shrink-0" style={{ fontSize: '20px' }}>info</md-icon>}
              <span className="text-body-medium font-medium flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-black/10 rounded-full flex items-center justify-center">
                <md-icon class="material-symbols-rounded" style={{ fontSize: '16px' }}>close</md-icon>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
