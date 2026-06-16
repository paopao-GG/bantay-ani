import * as React from "react";
import { cn } from "@/lib/cn";

export function Logo({
  className,
  withWordmark = true,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-8" />
      {withWordmark && (
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">
            BANTAY-ANI
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            IoT Monitoring
          </div>
        </div>
      )}
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="rgb(var(--color-brand))" />
          <stop offset="100%" stopColor="rgb(var(--color-accent-ph))" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="10"
        fill="url(#logo-grad)"
      />
      {/* leaf */}
      <path
        d="M12 24c4-10 12-12 18-12-1 7-5 13-12 15-2 .6-4 .4-6-.6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12 24c2.5-5 6.5-8 12-9.5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* drop */}
      <path
        d="M28 26c0 1.7-1.3 3-3 3s-3-1.3-3-3c0-1.8 3-5 3-5s3 3.2 3 5z"
        fill="white"
      />
    </svg>
  );
}
