import { cn } from "@/lib/cn";

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 220"
      className={cn("w-full h-full", className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--color-brand-soft))" stopOpacity="0.6" />
          <stop offset="100%" stopColor="rgb(var(--color-bg))" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--color-accent-moist))" stopOpacity="0.7" />
          <stop offset="100%" stopColor="rgb(var(--color-accent-moist))" stopOpacity="0.25" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgb(var(--color-warn))" stopOpacity="0.6" />
          <stop offset="100%" stopColor="rgb(var(--color-warn))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* sky wash */}
      <rect x="0" y="0" width="360" height="160" fill="url(#sky)" />

      {/* sun */}
      <circle cx="290" cy="55" r="44" fill="url(#sun)" />
      <circle cx="290" cy="55" r="16" fill="rgb(var(--color-warn))" opacity="0.85" />

      {/* hills */}
      <path
        d="M0 150 Q60 110 120 140 T240 130 T360 145 V160 H0 Z"
        fill="rgb(var(--color-brand))"
        opacity="0.18"
      />
      <path
        d="M0 165 Q90 130 180 150 T360 155 V170 H0 Z"
        fill="rgb(var(--color-brand))"
        opacity="0.25"
      />

      {/* soil ground */}
      <rect x="0" y="160" width="360" height="60" fill="url(#soil)" />
      <path
        d="M0 162 Q90 170 180 162 T360 162"
        stroke="rgb(var(--color-accent-moist))"
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
      />

      {/* plant pot soil mound */}
      <ellipse cx="100" cy="172" rx="50" ry="6" fill="rgb(var(--color-fg))" opacity="0.1" />

      {/* probe shaft going into soil */}
      <g transform="translate(78 100)">
        <rect x="0" y="0" width="6" height="80" rx="2" fill="rgb(var(--color-fg))" opacity="0.85" />
        <rect x="-6" y="-8" width="18" height="12" rx="2" fill="rgb(var(--color-brand))" />
        <circle cx="3" cy="-14" r="3" fill="rgb(var(--color-ok))">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
        {/* wire */}
        <path d="M3 -8 C 30 -40 60 -40 90 -28" stroke="rgb(var(--color-fg))" strokeWidth="1.4" fill="none" opacity="0.55" />
      </g>

      {/* plant — stem + leaves with sway */}
      <g transform="translate(118 168)" style={{ transformOrigin: "0 30px" }} className="origin-bottom animate-sway">
        <path
          d="M0 0 C -2 -22 4 -38 0 -60"
          stroke="rgb(var(--color-brand))"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* leaves */}
        <path
          d="M0 -20 C -16 -28 -22 -16 -8 -10 C -4 -10 -1 -14 0 -20 Z"
          fill="rgb(var(--color-brand))"
          opacity="0.85"
        />
        <path
          d="M0 -38 C 18 -44 24 -32 8 -28 C 4 -28 1 -32 0 -38 Z"
          fill="rgb(var(--color-brand))"
        />
        <path
          d="M0 -55 C -14 -62 -20 -52 -6 -46 C -2 -46 -1 -50 0 -55 Z"
          fill="rgb(var(--color-brand))"
          opacity="0.9"
        />
        {/* sprout tip */}
        <circle cx="0" cy="-60" r="3" fill="rgb(var(--color-ok))" />
      </g>

      {/* signal arcs */}
      <g transform="translate(170 88)" opacity="0.7">
        <path d="M0 0 Q 14 -10 28 0" stroke="rgb(var(--color-accent-ph))" strokeWidth="1.4" fill="none" />
        <path d="M-4 6 Q 14 -16 32 6" stroke="rgb(var(--color-accent-ph))" strokeWidth="1.2" fill="none" opacity="0.7" />
        <path d="M-8 12 Q 14 -22 36 12" stroke="rgb(var(--color-accent-ph))" strokeWidth="1" fill="none" opacity="0.4" />
      </g>

      {/* tiny droplets */}
      <g fill="rgb(var(--color-accent-ph))" opacity="0.85">
        <path d="M40 110 c0 2 -1.5 4 -3 4 s-3 -2 -3 -4 c0 -2 3 -6 3 -6 s3 4 3 6z" />
        <path d="M210 130 c0 1.5 -1 2.7 -2 2.7 s-2 -1.2 -2 -2.7 c0 -1.5 2 -4 2 -4 s2 2.5 2 4z" opacity="0.7" />
        <path d="M320 122 c0 2 -1.5 4 -3 4 s-3 -2 -3 -4 c0 -2 3 -6 3 -6 s3 4 3 6z" opacity="0.6" />
      </g>
    </svg>
  );
}
