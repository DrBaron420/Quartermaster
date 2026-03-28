import { useState, useEffect, useCallback } from "react";

interface ToastData {
  id: number;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

type ToastListener = (toasts: ToastData[]) => void;

/** Simple global toast system */
let toasts: ToastData[] = [];
let nextId = 0;
const listeners = new Set<ToastListener>();

function notify() {
  listeners.forEach((fn) => fn([...toasts]));
}

export function showToast(
  message: string,
  type: ToastData["type"] = "info",
  durationMs = 4000
) {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, durationMs);
}

const typeStyles: Record<ToastData["type"], string> = {
  info: "border-info bg-info/10",
  success: "border-success bg-success/10",
  error: "border-error bg-error/10",
  warning: "border-warning bg-warning/10",
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastData[]>([]);

  const handleUpdate = useCallback((updated: ToastData[]) => {
    setItems(updated);
  }, []);

  useEffect(() => {
    listeners.add(handleUpdate);
    return () => { listeners.delete(handleUpdate); };
  }, [handleUpdate]);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {items.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border-l-4 px-4 py-3 text-sm text-text-primary
                     bg-bg-secondary shadow-lg ${typeStyles[toast.type]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
