"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className={cn(
          "fixed z-[100] flex flex-col gap-2 pointer-events-none",
          "top-4 right-4 sm:top-4 sm:right-4",
          "bottom-24 left-1/2 -translate-x-1/2 sm:bottom-auto sm:left-auto sm:translate-x-0",
          "w-[calc(100vw-2rem)] sm:w-auto sm:max-w-sm"
        )}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ item }: { item: ToastItem }) {
  const typeClasses: Record<ToastType, string> = {
    success: "bg-brand-gold text-brand-brown",
    error:   "bg-red-600 text-white",
    info:    "bg-brand-brown text-brand-cream",
  };

  return (
    <div
      className={cn(
        "pointer-events-auto px-4 py-3 rounded-2xl shadow-toast text-sm font-medium",
        "animate-in slide-in-from-top-2 duration-300",
        typeClasses[item.type]
      )}
    >
      {item.message}
    </div>
  );
}
