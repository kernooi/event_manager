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
    return "border-[#cfe6d7] bg-[#eff7f1] text-[#21523b]";
  }

  if (variant === "error") {
    return "border-[#f3cbc2] bg-[#fff1ed] text-[#7a3327]";
  }

  return "border-[#eadbce] bg-[#fbf8f2] text-[#5b4a3d]";
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
            className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_20px_50px_-35px_rgba(27,26,24,0.6)] ${getToastStyles(
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
