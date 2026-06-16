import * as React from "react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { Sparkline } from "./sparkline";

export function StatTile({
  label,
  value,
  unit,
  trend,
  icon,
  accent,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  trend?: number[];
  icon?: React.ReactNode;
  accent?: "brand" | "ph" | "moist" | "neutral";
  className?: string;
}) {
  const accentColor =
    accent === "ph"
      ? "rgb(var(--color-accent-ph))"
      : accent === "moist"
        ? "rgb(var(--color-accent-moist))"
        : accent === "brand"
          ? "rgb(var(--color-brand))"
          : "rgb(var(--color-muted))";
  return (
    <Card className={cn("relative overflow-hidden p-5", className)}>
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: accentColor }}
      />
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-widest text-muted font-medium">
          {label}
        </div>
        {icon && (
          <div
            className="rounded-lg p-2 text-fg"
            style={{ background: `${accentColor}1A`, color: accentColor }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="numeric text-4xl font-semibold leading-none">
          {value}
        </div>
        {unit && (
          <div className="text-sm text-muted font-medium">{unit}</div>
        )}
      </div>
      {trend && trend.length > 1 && (
        <div className="mt-3 h-10 -mx-1">
          <Sparkline data={trend} color={accentColor} />
        </div>
      )}
    </Card>
  );
}
