"use client";

import { useEffect, useState } from "react";
import {
  effectiveThresholds,
  getAlerts,
  getConfig,
  getNodes,
  getReadings,
  subscribe,
} from "./store";
import type { Alert, Config, Node, Reading, Thresholds } from "../types";

function useSubscribed<T>(read: () => T): T {
  const [value, setValue] = useState<T>(read);
  useEffect(() => {
    setValue(read());
    return subscribe(() => setValue(read()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

export function useNodes(): Node[] {
  return useSubscribed(getNodes);
}

export function useConfig(): Config {
  return useSubscribed(getConfig);
}

export function useReadings(nodeId?: string): Reading[] {
  return useSubscribed(() => getReadings(nodeId));
}

export function useAlerts(): Alert[] {
  return useSubscribed(getAlerts);
}

export function useEffectiveThresholds(nodeId: string): Thresholds {
  return useSubscribed(() => effectiveThresholds(nodeId));
}

export function useLatestReading(nodeId: string): Reading | undefined {
  const readings = useReadings(nodeId);
  return readings.length ? readings[readings.length - 1] : undefined;
}
