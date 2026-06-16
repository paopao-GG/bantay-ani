"use client";

import { Radio } from "lucide-react";

export function LiveIndicator({ label = "Streaming" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ok">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-ok opacity-70 animate-pulse-dot" />
        <span className="relative inline-flex size-2 rounded-full bg-ok" />
      </span>
      <Radio className="size-3.5" />
      {label}
    </span>
  );
}
