import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const toast = React.useMemo(() => ({
    success: (msg: string, dur?: number) => addToast(msg, 'success', dur),
    error: (msg: string, dur?: number) => addToast(msg, 'error', dur),
    info: (msg: string, dur?: number) => addToast(msg, 'info', dur),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
        <style>{`
          @keyframes shrink-progress {
            from { width: 100%; }
            to { width: 0%; }
          }
          @keyframes slide-in-toast {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slide-in-toast {
            animation: slide-in-toast 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>
        {toasts.map((t) => {
          let icon = <Info className="w-5 h-5 text-blue-400" />;
          let borderClass = 'border-blue-500/20 shadow-blue-500/5';
          let bgClass = 'bg-slate-900/90';
          let progressBg = 'bg-blue-500';

          if (t.type === 'success') {
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            borderClass = 'border-emerald-500/20 shadow-emerald-500/5';
            progressBg = 'bg-emerald-500';
          } else if (t.type === 'error') {
            icon = <AlertCircle className="w-5 h-5 text-rose-400" />;
            borderClass = 'border-rose-500/20 shadow-rose-500/5';
            progressBg = 'bg-rose-500';
          }

          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 rounded-xl border ${bgClass} ${borderClass} text-slate-200 shadow-xl backdrop-blur-md animate-slide-in-toast relative overflow-hidden`}
              role="alert"
            >
              <div className="shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 text-sm font-medium pr-4 break-words leading-relaxed">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/80 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* Progress bar under toast */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950/40">
                <div
                  className={`h-full ${progressBg} transition-all ease-linear`}
                  style={{
                    animation: `shrink-progress ${t.duration || 4000}ms linear forwards`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
