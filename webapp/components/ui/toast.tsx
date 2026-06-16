"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

type ToastVariant = "info" | "success" | "warn";
type ToastItem = { id: number; message: string; variant: ToastVariant };

type Ctx = { push: (msg: string, variant?: ToastVariant) => void };
const ToastCtx = React.createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const push = (message: string, variant: ToastVariant = "info") => {
    const id = Date.now() + Math.random();
    setItems((curr) => [...curr, { id, message, variant }]);
    setTimeout(() => {
      setItems((curr) => curr.filter((t) => t.id !== id));
    }, 4500);
  };
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-80 max-w-[90vw] flex-col gap-2">
        {items.map((t) => (
          <ToastBubble
            key={t.id}
            item={t}
            onClose={() =>
              setItems((curr) => curr.filter((x) => x.id !== t.id))
            }
          />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastBubble({
  item,
  onClose,
}: {
  item: ToastItem;
  onClose: () => void;
}) {
  const Icon =
    item.variant === "success"
      ? CheckCircle2
      : item.variant === "warn"
        ? AlertTriangle
        : Info;
  const tone =
    item.variant === "success"
      ? "text-ok"
      : item.variant === "warn"
        ? "text-warn"
        : "text-brand";
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface p-3 shadow-card animate-fade-in",
        "dark:shadow-card-dark",
      )}
    >
      <Icon className={cn("size-5 shrink-0 mt-0.5", tone)} />
      <p className="flex-1 text-sm text-fg">{item.message}</p>
      <button
        onClick={onClose}
        className="text-muted hover:text-fg"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
