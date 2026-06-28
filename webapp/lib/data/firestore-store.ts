"use client";

import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "../firebase/client";
import {
  DEFAULT_CONFIG,
  type Alert,
  type Config,
  type Node,
  type Reading,
  type Thresholds,
} from "../types";

type Listener = () => void;

let config: Config = { ...DEFAULT_CONFIG, thresholds: { ...DEFAULT_CONFIG.thresholds } };
let nodes: Node[] = [];
let readings: Reading[] = [];
let alerts: Alert[] = [];

const listeners = new Set<Listener>();
const unsubs: Unsubscribe[] = [];
let started = false;

function emit() {
  for (const l of listeners) l();
}

function ensureStarted() {
  if (started) return;
  started = true;
  const db = getDb();

  unsubs.push(
    onSnapshot(doc(db, "config", "global"), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<Config>;
        config = {
          ...DEFAULT_CONFIG,
          ...data,
          thresholds: { ...DEFAULT_CONFIG.thresholds, ...(data.thresholds ?? {}) },
        };
        emit();
      }
    }),
  );

  unsubs.push(
    onSnapshot(query(collection(db, "nodes")), (snap) => {
      nodes = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Node, "id">) }));
      emit();
    }),
  );

  unsubs.push(
    onSnapshot(query(collection(db, "alerts")), (snap) => {
      alerts = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Alert, "id">) }))
        .sort((a, b) => b.ts.localeCompare(a.ts))
        .slice(0, 500);
      emit();
    }),
  );

  // Readings live under readings/{node_id}/samples. We subscribe per-node
  // once we know which nodes exist. Until then this just stays empty.
  let readingsSubsKey = "";
  const subscribeReadings = () => {
    const key = nodes.map((n) => n.id).sort().join(",");
    if (key === readingsSubsKey) return;
    readingsSubsKey = key;
    // Tear down any previous reading subs.
    while (unsubs.length > 3) {
      const u = unsubs.pop();
      if (u) u();
    }
    const perNode: Record<string, Reading[]> = {};
    for (const node of nodes) {
      const u = onSnapshot(
        query(collection(db, `readings/${node.id}/samples`)),
        (snap) => {
          perNode[node.id] = snap.docs.map((d) => d.data() as Reading);
          readings = Object.values(perNode)
            .flat()
            .sort((a, b) => a.ts.localeCompare(b.ts));
          if (readings.length > 12000) {
            readings = readings.slice(readings.length - 12000);
          }
          emit();
        },
      );
      unsubs.push(u);
    }
  };

  // Re-subscribe whenever the node list changes.
  listeners.add(subscribeReadings);
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

// ---- Mutators (write through Web SDK; blocked by Rules until auth is added)
// These will silently fail in production until Firestore Rules permit writes.
// The /settings page UI works; persistence won't until you wire auth + rules.

export async function updateConfig(next: Partial<Config>) {
  const db = getDb();
  const merged: Partial<Config> = {
    ...next,
    thresholds: next.thresholds
      ? { ...config.thresholds, ...next.thresholds }
      : undefined,
  };
  if (!merged.thresholds) delete merged.thresholds;
  await setDoc(doc(db, "config", "global"), merged, { merge: true });
}

export async function updateThresholds(t: Partial<Thresholds>) {
  const db = getDb();
  await setDoc(
    doc(db, "config", "global"),
    { thresholds: { ...config.thresholds, ...t } },
    { merge: true },
  );
}

export async function updateNode(id: string, patch: Partial<Node>) {
  const db = getDb();
  await setDoc(doc(db, "nodes", id), patch, { merge: true });
}

export async function acknowledgeAlert(id: string) {
  const db = getDb();
  await updateDoc(doc(db, "alerts", id), { acknowledged: true });
}

