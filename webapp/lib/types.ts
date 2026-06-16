export type Reading = {
  ts: string;
  node_id: string;
  ph: number;
  ph_raw: number;
  moisture_pct: number;
  moist_raw: number;
  rssi: number;
};

export type Thresholds = {
  ph_min: number;
  ph_max: number;
  moist_min: number;
  moist_max: number;
};

export type Metric = "ph" | "moisture";

export type Severity = "ok" | "warn" | "danger";

export type Alert = {
  id: string;
  ts: string;
  node_id: string;
  metric: Metric;
  value: number;
  threshold: number;
  acknowledged: boolean;
};

export type Node = {
  id: string;
  location: string;
  install_date: string;
  raw_dry: number;
  raw_wet: number;
  thresholds_override?: Partial<Thresholds>;
  sample_interval_override?: number;
};

export type Config = {
  thresholds: Thresholds;
  sample_interval_s: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  ph_min: 6.0,
  ph_max: 7.5,
  moist_min: 30,
  moist_max: 70,
};

export const DEFAULT_CONFIG: Config = {
  thresholds: DEFAULT_THRESHOLDS,
  sample_interval_s: 300,
};
