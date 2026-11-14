import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl shadow-lg border text-sm animate-in slide-in-from-bottom-2 duration-150 backdrop-blur-sm ${
              item.type === "success"
                ? "bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 border-emerald-200 dark:border-emerald-800/60 shadow-emerald-500/10"
                : item.type === "error"
                ? "bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 border-rose-200 dark:border-rose-800/60 shadow-rose-500/10"
                : "bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 border-stone-200 dark:border-stone-800 shadow-stone-900/10"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              ) : item.type === "error" ? (
                <AlertCircle size={16} className="text-rose-600 dark:text-rose-400" />
              ) : (
                <Info size={16} className="text-violet-600 dark:text-violet-400" />
              )}
            </div>
            <div className="flex-1 text-xs font-medium text-stone-800 dark:text-stone-200 leading-snug">
              {item.message}
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded cursor-pointer transition"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default useToast;
