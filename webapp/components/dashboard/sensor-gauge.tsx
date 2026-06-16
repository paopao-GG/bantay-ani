"use client";

import { cn } from "@/lib/cn";

type Props = {
  value: number;
  min: number;
  max: number;
  okMin: number;
  okMax: number;
  label: string;
  unit?: string;
  accent: string;
  className?: string;
};

const START_ANGLE = -210;
const END_ANGLE = 30;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
) {
  const [x1, y1] = polar(cx, cy, r, fromDeg);
  const [x2, y2] = polar(cx, cy, r, toDeg);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function angleFor(value: number, min: number, max: number) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return START_ANGLE + t * (END_ANGLE - START_ANGLE);
}

export function SensorGauge({
  value,
  min,
  max,
  okMin,
  okMax,
  label,
  unit,
  accent,
  className,
}: Props) {
  const cx = 100;
  const cy = 100;
  const r = 78;
  const needleAngle = angleFor(value, min, max);
  const okFrom = angleFor(okMin, min, max);
  const okTo = angleFor(okMax, min, max);
  const warnBand = (okMax - okMin) * 0.15;
  const warnLowFrom = angleFor(Math.max(min, okMin - warnBand), min, max);
  const warnHighTo = angleFor(Math.min(max, okMax + warnBand), min, max);

  const [nx, ny] = polar(cx, cy, r - 14, needleAngle);
  const [tx, ty] = polar(cx, cy, r - 26, needleAngle);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg viewBox="0 0 200 160" className="w-full h-auto max-w-[280px]">
        {/* danger base */}
        <path
          d={arcPath(cx, cy, r, START_ANGLE, END_ANGLE)}
          stroke="rgb(var(--color-danger) / 0.85)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        {/* warn band */}
        <path
          d={arcPath(cx, cy, r, warnLowFrom, warnHighTo)}
          stroke="rgb(var(--color-warn) / 0.9)"
          strokeWidth="14"
          strokeLinecap="butt"
          fill="none"
        />
        {/* ok band */}
        <path
          d={arcPath(cx, cy, r, okFrom, okTo)}
          stroke="rgb(var(--color-ok))"
          strokeWidth="14"
          strokeLinecap="butt"
          fill="none"
        />
        {/* outer tick ring */}
        <path
          d={arcPath(cx, cy, r + 11, START_ANGLE, END_ANGLE)}
          stroke="rgb(var(--color-border))"
          strokeWidth="1"
          fill="none"
          opacity="0.7"
        />
        {/* ticks */}
        {Array.from({ length: 9 }).map((_, i) => {
          const a = START_ANGLE + (i / 8) * (END_ANGLE - START_ANGLE);
          const [x1, y1] = polar(cx, cy, r + 8, a);
          const [x2, y2] = polar(cx, cy, r + 14, a);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgb(var(--color-muted))"
              strokeWidth="1"
              opacity="0.6"
            />
          );
        })}

        {/* needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: "all 600ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <circle cx={cx} cy={cy} r="7" fill={accent} />
        <circle cx={cx} cy={cy} r="3" fill="rgb(var(--color-surface))" />
        <circle cx={tx} cy={ty} r="2.5" fill={accent} opacity="0.5" />

        {/* value text */}
        <text
          x={cx}
          y={cy + 38}
          textAnchor="middle"
          fontSize="22"
          fontFamily="var(--font-mono)"
          fontWeight="600"
          fill="rgb(var(--color-fg))"
        >
          {value.toFixed(1)}
          <tspan
            fontSize="11"
            fill="rgb(var(--color-muted))"
            dx="3"
          >
            {unit}
          </tspan>
        </text>
        <text
          x={cx}
          y={cy + 54}
          textAnchor="middle"
          fontSize="9"
          letterSpacing="2"
          fill="rgb(var(--color-muted))"
        >
          {label.toUpperCase()}
        </text>
      </svg>
      <div className="mt-1 flex items-center justify-between w-full max-w-[280px] px-2 text-[10px] font-medium text-muted">
        <span>{min}</span>
        <span className="text-ok">
          {okMin}–{okMax}
        </span>
        <span>{max}</span>
      </div>
    </div>
  );
}
