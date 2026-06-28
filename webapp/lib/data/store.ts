"use client";

// Single swap-seam between mock-store (no Firebase) and firestore-store.
// Toggle is the presence of NEXT_PUBLIC_FIREBASE_PROJECT_ID at build time.
//
// All callers (use-store.ts, page components) import from here, never from
// the underlying stores directly.

import * as mock from "./mock-store";
import * as fs from "./firestore-store";

const USE_FIRESTORE = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

const impl = USE_FIRESTORE ? fs : mock;

export const subscribe = impl.subscribe;
export const getNodes = impl.getNodes;
export const getConfig = impl.getConfig;
export const getReadings = impl.getReadings;
export const getAlerts = impl.getAlerts;
export const effectiveThresholds = impl.effectiveThresholds;
export const updateConfig = impl.updateConfig;
export const updateThresholds = impl.updateThresholds;
export const updateNode = impl.updateNode;
export const acknowledgeAlert = impl.acknowledgeAlert;
export const simulateBreach = impl.simulateBreach;
export const TICK_INTERVAL_MS = impl.TICK_INTERVAL_MS;

export const STORE_MODE: "firestore" | "mock" = USE_FIRESTORE ? "firestore" : "mock";
