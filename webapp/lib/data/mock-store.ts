"use client";

import {
  DEFAULT_CONFIG,
  type Alert,
  type Config,
  type Node,
  type Reading,
  type Thresholds,
} from "../types";

type Listener = () => void;

const SEED_DAYS = 7;
const TICK_MS = 4000;

const NODES: Node[] = [
  {
    id: "node-001",
    location: "North field — tomato bed",
    install_date: "2026-04-12",
    raw_dry: 3050,
    raw_wet: 1180,
  },
  {
    id: "node-002",
    location: "Greenhouse — pepper row",
    install_date: "2026-05-02",
    raw_dry: 2980,
    raw_wet: 1240,
  },
];

let config: Config = { ...DEFAULT_CONFIG, thresholds: { ...DEFAULT_CONFIG.thresholds } };
let nodes: Node[] = NODES.map((n) => ({ ...n }));
let readings: Reading[] = [];
let alerts: Alert[] = [];

const listeners = new Set<Listener>();
let tickHandle: ReturnType<typeof setInterval> | null = null;
let started = false;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function diurnal(hourOfDay: number, baseline: number, amplitude: number) {
  const phase = ((hourOfDay - 6) / 24) * Math.PI * 2;
  return baseline + Math.sin(phase) * amplitude;
}

function rawFromPct(pct: number, node: Node) {
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(node.raw_dry - (clamped / 100) * (node.raw_dry - node.raw_wet));
}

function buildReading(node: Node, atMs: number, prior?: Reading): Reading {
  const date = new Date(atMs);
  const hour = date.getHours() + date.getMinutes() / 60;
  // pH drifts slowly around per-node baseline.
  const phBase: Record<string, number> = {
    "node-001": 6.7,
    "node-002": 6.95,
    "node-003": 6.3,
  };
  const phBaseline = phBase[node.id] ?? 6.8;
  const phNoise = rand(-0.06, 0.06);
  const phDrift = prior ? (prior.ph - phBaseline) * 0.7 : 0;
  const ph = +(phBaseline + phDrift + phNoise).toFixed(2);

  // Moisture follows a diurnal evapotranspiration curve.
  const moistBase: Record<string, number> = {
    "node-001": 52,
    "node-002": 60,
    "node-003": 38,
  };
  const baseline = moistBase[node.id] ?? 50;
  const m = diurnal(hour, baseline, 9) + rand(-2, 2);
  const moisture_pct = +Math.max(8, Math.min(95, m)).toFixed(1);

  return {
    ts: date.toISOString(),
    node_id: node.id,
    ph,
    ph_raw: Math.round(ph * 100),
    moisture_pct,
    moist_raw: rawFromPct(moisture_pct, node),
    rssi: Math.round(rand(-78, -52)),
  };
}

function seed() {
  const now = Date.now();
  const stepMs = 5 * 60 * 1000;
  const total = (SEED_DAYS * 24 * 60) / 5;
  const start = now - total * stepMs;
  const collected: Reading[] = [];
  for (const node of nodes) {
    let prior: Reading | undefined;
    for (let i = 0; i < total; i++) {
      const r = buildReading(node, start + i * stepMs, prior);
      collected.push(r);
      prior = r;
    }
  }
  readings = collected.sort((a, b) => a.ts.localeCompare(b.ts));
  // Seed a few historical alerts off the synthetic data.
  alerts = [];
  for (const r of readings) {
    maybeAlert(r, /*persistOnly*/ true);
  }
}

function emit() {
  for (const l of listeners) l();
}

function maybeAlert(r: Reading, persistOnly = false) {
  const t = effectiveThresholds(r.node_id);
  if (r.ph < t.ph_min || r.ph > t.ph_max) {
    pushAlert({
      id: `alt-${r.node_id}-${r.ts}-ph`,
      ts: r.ts,
      node_id: r.node_id,
      metric: "ph",
      value: r.ph,
      threshold: r.ph < t.ph_min ? t.ph_min : t.ph_max,
      acknowledged: persistOnly ? Math.random() > 0.4 : false,
    });
  }
  if (r.moisture_pct < t.moist_min || r.moisture_pct > t.moist_max) {
    pushAlert({
      id: `alt-${r.node_id}-${r.ts}-m`,
      ts: r.ts,
      node_id: r.node_id,
      metric: "moisture",
      value: r.moisture_pct,
      threshold:
        r.moisture_pct < t.moist_min ? t.moist_min : t.moist_max,
      acknowledged: persistOnly ? Math.random() > 0.4 : false,
    });
  }
}

function pushAlert(a: Alert) {
  if (alerts.find((x) => x.id === a.id)) return;
  alerts = [a, ...alerts].slice(0, 500);
}

function ensureStarted() {
  if (started) return;
  started = true;
  seed();
  tickHandle = setInterval(() => {
    const now = Date.now();
    for (const node of nodes) {
      const last = [...readings]
        .reverse()
        .find((r) => r.node_id === node.id);
      const r = buildReading(node, now, last);
      readings.push(r);
      maybeAlert(r);
    }
    if (readings.length > 12000) {
      readings = readings.slice(readings.length - 12000);
    }
    emit();
  }, TICK_MS);
}

export function effectiveThresholds(nodeId: string): Thresholds {
  const node = nodes.find((n) => n.id === nodeId);
  return { ...config.thresholds, ...(node?.thresholds_override ?? {}) };
}

export function subscribe(l: Listener) {
  ensureStarted();
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getNodes(): Node[] {
  ensureStarted();
  return nodes;
}

export function getConfig(): Config {
  ensureStarted();
  return config;
}

export function getReadings(nodeId?: string): Reading[] {
  ensureStarted();
  if (!nodeId) return readings;
  return readings.filter((r) => r.node_id === nodeId);
}

export function getAlerts(): Alert[] {
  ensureStarted();
  return alerts;
}

export function updateConfig(next: Partial<Config>) {
  config = { ...config, ...next, thresholds: { ...config.thresholds, ...(next.thresholds ?? {}) } };
  emit();
}

export function updateThresholds(t: Partial<Thresholds>) {
  config = { ...config, thresholds: { ...config.thresholds, ...t } };
  emit();
}

export function updateNode(id: string, patch: Partial<Node>) {
  nodes = nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
  emit();
}

export function acknowledgeAlert(id: string) {
  alerts = alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a));
  emit();
}

export function simulateBreach(nodeId: string, metric: "ph" | "moisture") {
  const now = Date.now();
  const node = nodes.find((n) => n.id === nodeId) ?? nodes[0];
  const base = buildReading(node, now);
  const r: Reading =
    metric === "ph"
      ? { ...base, ph: 8.6, ph_raw: 860 }
      : { ...base, moisture_pct: 18, moist_raw: rawFromPct(18, node) };
  readings.push(r);
  maybeAlert(r);
  emit();
}

export const TICK_INTERVAL_MS = TICK_MS;
