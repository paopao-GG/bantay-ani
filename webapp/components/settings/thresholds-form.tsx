"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Save } from "lucide-react";
import type { Thresholds } from "@/lib/types";

type Pair = { min: number; max: number };

function RangeRow({
  label,
  unit,
  hardMin,
  hardMax,
  step,
  value,
  onChange,
  accent,
}: {
  label: string;
  unit: string;
  hardMin: number;
  hardMax: number;
  step: number;
  value: Pair;
  onChange: (v: Pair) => void;
  accent: string;
}) {
  const span = hardMax - hardMin;
  const lowPct = ((value.min - hardMin) / span) * 100;
  const highPct = ((value.max - hardMin) / span) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="text-sm font-medium numeric">
          {value.min.toFixed(step < 1 ? 1 : 0)} – {value.max.toFixed(step < 1 ? 1 : 0)} {unit}
        </div>
      </div>
      <div className="relative h-6">
        <div className="absolute inset-y-1/2 -translate-y-1/2 inset-x-0 h-1.5 rounded-full bg-surface-2" />
        <div
          className="absolute inset-y-1/2 -translate-y-1/2 h-1.5 rounded-full"
          style={{
            left: `${lowPct}%`,
            right: `${100 - highPct}%`,
            background: accent,
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px]">Min ({hardMin})</Label>
          <input
            type="range"
            min={hardMin}
            max={value.max - step}
            step={step}
            value={value.min}
            onChange={(e) =>
              onChange({ ...value, min: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <Label className="text-[10px]">Max ({hardMax})</Label>
          <input
            type="range"
            min={value.min + step}
            max={hardMax}
            step={step}
            value={value.max}
            onChange={(e) =>
              onChange({ ...value, max: Number(e.target.value) })
            }
          />
        </div>
      </div>
    </div>
  );
}

export function ThresholdsForm({
  value,
  onSave,
}: {
  value: Thresholds;
  onSave: (t: Thresholds) => void;
}) {
  const [draft, setDraft] = useState<Thresholds>(value);
  useEffect(() => setDraft(value), [value]);
  const dirty =
    draft.ph_min !== value.ph_min ||
    draft.ph_max !== value.ph_max ||
    draft.moist_min !== value.moist_min ||
    draft.moist_max !== value.moist_max;

  return (
    <div className="space-y-8 max-w-2xl">
      <RangeRow
        label="Soil pH"
        unit="pH"
        hardMin={4}
        hardMax={9}
        step={0.1}
        value={{ min: draft.ph_min, max: draft.ph_max }}
        onChange={(v) =>
          setDraft({ ...draft, ph_min: v.min, ph_max: v.max })
        }
        accent="rgb(var(--color-accent-ph))"
      />
      <RangeRow
        label="Moisture"
        unit="%"
        hardMin={0}
        hardMax={100}
        step={1}
        value={{ min: draft.moist_min, max: draft.moist_max }}
        onChange={(v) =>
          setDraft({ ...draft, moist_min: v.min, moist_max: v.max })
        }
        accent="rgb(var(--color-accent-moist))"
      />
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="md"
          disabled={!dirty}
          onClick={() => setDraft(value)}
        >
          Reset
        </Button>
        <Button
          size="md"
          disabled={!dirty}
          onClick={() => onSave(draft)}
        >
          <Save className="size-3.5" />
          Save thresholds
        </Button>
      </div>
    </div>
  );
}
