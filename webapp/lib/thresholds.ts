import type { Metric, Reading, Severity, Thresholds } from "./types";

export function severityFor(
  value: number,
  min: number,
  max: number,
): Severity {
  const span = max - min;
  const buffer = span * 0.1;
  if (value < min || value > max) return "danger";
  if (value < min + buffer || value > max - buffer) return "warn";
  return "ok";
}

export function readingSeverity(
  reading: Reading,
  metric: Metric,
  t: Thresholds,
): Severity {
  if (metric === "ph") return severityFor(reading.ph, t.ph_min, t.ph_max);
  return severityFor(reading.moisture_pct, t.moist_min, t.moist_max);
}

export function metricLabel(m: Metric) {
  return m === "ph" ? "pH" : "Moisture";
}

export function severityColor(s: Severity) {
  if (s === "ok") return "ok";
  if (s === "warn") return "warn";
  return "danger";
}
