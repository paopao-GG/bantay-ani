"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Metric, Reading, Thresholds } from "@/lib/types";

type RangeKey = "1h" | "24h" | "7d";
const RANGES: { key: RangeKey; label: string; ms: number }[] = [
  { key: "1h", label: "1h", ms: 60 * 60 * 1000 },
  { key: "24h", label: "24h", ms: 24 * 60 * 60 * 1000 },
  { key: "7d", label: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
];

export function ReadingChart({
  readings,
  metric,
  thresholds,
  color,
  height = 240,
}: {
  readings: Reading[];
  metric: Metric;
  thresholds: Thresholds;
  color: string;
  height?: number;
}) {
  const [range, setRange] = useState<RangeKey>("24h");
  const rangeMs = RANGES.find((r) => r.key === range)!.ms;
  const cutoff = Date.now() - rangeMs;

  const data = useMemo(() => {
    return readings
      .filter((r) => parseISO(r.ts).getTime() >= cutoff)
      .map((r) => ({
        ts: parseISO(r.ts).getTime(),
        ph: r.ph,
        moisture: r.moisture_pct,
      }));
  }, [readings, cutoff]);

  const min = metric === "ph" ? thresholds.ph_min : thresholds.moist_min;
  const max = metric === "ph" ? thresholds.ph_max : thresholds.moist_max;
  const key = metric === "ph" ? "ph" : "moisture";
  const yDomain: [number, number] =
    metric === "ph" ? [4.5, 9] : [0, 100];

  const tickFmt = (v: number) =>
    range === "7d" ? format(v, "MMM d") : format(v, "HH:mm");

  return (
    <div>
      <div className="flex items-center justify-end mb-2 gap-1">
        {RANGES.map((r) => (
          <Button
            key={r.key}
            variant={range === r.key ? "primary" : "ghost"}
            size="sm"
            onClick={() => setRange(r.key)}
            className={cn(range !== r.key && "text-muted")}
          >
            {r.label}
          </Button>
        ))}
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 4"
              stroke="rgb(var(--color-border))"
              vertical={false}
            />
            <XAxis
              dataKey="ts"
              type="number"
              domain={["dataMin", "dataMax"]}
              scale="time"
              tickFormatter={tickFmt}
              stroke="rgb(var(--color-muted))"
              tick={{ fontSize: 11 }}
              minTickGap={40}
            />
            <YAxis
              domain={yDomain}
              stroke="rgb(var(--color-muted))"
              tick={{ fontSize: 11 }}
              width={36}
            />
            <ReferenceArea
              y1={yDomain[0]}
              y2={min}
              fill="rgb(var(--color-danger))"
              fillOpacity={0.05}
            />
            <ReferenceArea
              y1={max}
              y2={yDomain[1]}
              fill="rgb(var(--color-danger))"
              fillOpacity={0.05}
            />
            <ReferenceLine
              y={min}
              stroke="rgb(var(--color-warn))"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <ReferenceLine
              y={max}
              stroke="rgb(var(--color-warn))"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Tooltip
              cursor={{ stroke: "rgb(var(--color-border))" }}
              contentStyle={{
                background: "rgb(var(--color-surface))",
                border: "1px solid rgb(var(--color-border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelFormatter={(v) => format(v as number, "PP HH:mm")}
              formatter={(v: number) => [
                metric === "ph" ? v.toFixed(2) : `${v.toFixed(1)}%`,
                metric === "ph" ? "pH" : "Moisture",
              ]}
            />
            <Area
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${metric})`}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: "rgb(var(--color-surface))", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
