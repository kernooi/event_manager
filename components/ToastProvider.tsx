"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  pushToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getToastStyles(variant: ToastVariant) {
  if (variant === "success") {
    return "border-[#bbf7d0] bg-[#ecfdf3] text-[#166534]";
  }

  if (variant === "error") {
    return "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]";
  }

  return "border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]";
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = createToastId();
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => removeToast(id), 4200);
    },
    [removeToast]
  );

  const contextValue = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-50 flex w-[min(90vw,360px)] flex-col gap-3"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-[0_10px_24px_-16px_rgba(15,23,42,0.2)] ${getToastStyles(
              toast.variant
            )}`}
          >
            <p className="font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}



