import { cn } from "@/lib/cn";

export function AllClearIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 140"
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="sun-clear" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgb(var(--color-warn))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="rgb(var(--color-warn))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="140" cy="50" r="40" fill="url(#sun-clear)" />
      <circle cx="140" cy="50" r="16" fill="rgb(var(--color-warn))" opacity="0.85" />
      {/* cloud */}
      <g fill="rgb(var(--color-fg))" opacity="0.08">
        <ellipse cx="80" cy="80" rx="40" ry="14" />
        <ellipse cx="60" cy="72" rx="22" ry="14" />
        <ellipse cx="100" cy="68" rx="20" ry="14" />
      </g>
      <g stroke="rgb(var(--color-brand))" strokeWidth="2" fill="none" strokeLinecap="round">
        {/* checkmark */}
        <circle cx="100" cy="90" r="20" fill="rgb(var(--color-ok))" fillOpacity="0.15" stroke="rgb(var(--color-ok))" />
        <path d="M91 90 l7 7 l13 -14" stroke="rgb(var(--color-ok))" strokeWidth="2.5" />
      </g>
      <path
        d="M20 125 Q100 115 180 125"
        stroke="rgb(var(--color-brand))"
        strokeWidth="1.5"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}
