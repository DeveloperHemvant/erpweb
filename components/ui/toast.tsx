"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
}

interface ToastContextType {
  toast: (title: string, options?: { description?: string; type?: ToastType }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((title: string, options?: { description?: string; type?: ToastType }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      id,
      title,
      description: options?.description,
      type: options?.type || "info",
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-danger" />,
    info: <Info className="h-5 w-5 text-info" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast portal rendering overlay */}
      <div className="fixed bottom-6 right-6 z-55 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className="bg-card text-card-foreground p-4 rounded-card border border-border shadow-premium flex gap-3 pointer-events-auto items-start"
            >
              <div className="mt-0.5">{icons[t.type || "info"]}</div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-text-primary">{t.title}</p>
                {t.description && <p className="text-xs text-text-secondary leading-relaxed">{t.description}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-text-secondary hover:text-text-primary p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
