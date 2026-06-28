"use client";

import { useEffect, useState } from "react";
import { Radio, WifiOff, CircleSlash } from "lucide-react";

type Props = {
  latestTs?: string;
  sampleIntervalS?: number;
};

function fmtAge(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function ConnectionStatus({ latestTs, sampleIntervalS = 300 }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!latestTs) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
        <CircleSlash className="size-3.5" />
        Not connected
      </span>
    );
  }

  const ageMs = now - new Date(latestTs).getTime();
  const offlineAfterMs = sampleIntervalS * 1000 * 2;
  const offline = ageMs > offlineAfterMs;

  if (offline) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-medium text-danger">
        <WifiOff className="size-3.5" />
        Offline · last seen {fmtAge(ageMs)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ok">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-ok opacity-70 animate-pulse-dot" />
        <span className="relative inline-flex size-2 rounded-full bg-ok" />
      </span>
      <Radio className="size-3.5" />
      Online · {fmtAge(ageMs)}
    </span>
  );
}
