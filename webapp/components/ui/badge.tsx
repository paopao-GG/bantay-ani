import * as React from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "ok" | "warn" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg border-border",
  brand: "bg-brand-soft text-brand border-brand/30",
  ok: "bg-ok/15 text-ok border-ok/30",
  warn: "bg-warn/15 text-warn border-warn/30",
  danger: "bg-danger/15 text-danger border-danger/40",
};

export function Badge({
  className,
  tone = "neutral",
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
        "text-[11px] font-medium tracking-wide uppercase",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
