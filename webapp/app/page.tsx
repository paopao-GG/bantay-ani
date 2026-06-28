"use client";

import { useEffect, useState } from "react";
import { Droplets, Beaker } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { HeroIllustration } from "@/components/graphics/hero-illustration";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConnectionStatus } from "@/components/dashboard/connection-status";
import { StatTile } from "@/components/dashboard/stat-tile";
import { SensorGauge } from "@/components/dashboard/sensor-gauge";
import { ReadingChart } from "@/components/dashboard/reading-chart";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  useConfig,
  useEffectiveThresholds,
  useLatestReading,
  useNodes,
  useReadings,
} from "@/lib/data/use-store";
import { fmtMoist, fmtPh } from "@/lib/format";
import { readingSeverity } from "@/lib/thresholds";

export default function DashboardPage() {
  const nodes = useNodes();
  const config = useConfig();
  const [nodeId, setNodeId] = useState<string>("");

  useEffect(() => {
    if (!nodes.length) return;
    if (!nodes.some((n) => n.id === nodeId)) setNodeId(nodes[0].id);
  }, [nodes, nodeId]);

  if (!nodes.length) return <NoNodesView />;

  return (
    <ConnectedDashboard
      nodeId={nodeId || nodes[0].id}
      onNodeChange={setNodeId}
      sampleIntervalS={config.sample_interval_s}
    />
  );
}

function ConnectedDashboard({
  nodeId,
  onNodeChange,
  sampleIntervalS,
}: {
  nodeId: string;
  onNodeChange: (id: string) => void;
  sampleIntervalS: number;
}) {
  const nodes = useNodes();
  const latest = useLatestReading(nodeId);
  const readings = useReadings(nodeId);
  const thresholds = useEffectiveThresholds(nodeId);

  const sparkPh = readings.slice(-40).map((r) => r.ph);
  const sparkMoist = readings.slice(-40).map((r) => r.moisture_pct);

  const phSeverity = latest ? readingSeverity(latest, "ph", thresholds) : "ok";
  const moistSeverity = latest
    ? readingSeverity(latest, "moisture", thresholds)
    : "ok";

  return (
    <>
      <Topbar
        title="Field overview"
        description="Live soil telemetry from your BANTAY-ANI nodes."
        right={
          <Select
            value={nodeId}
            onChange={(e) => onNodeChange(e.target.value)}
            aria-label="Select node"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.id} — {n.location}
              </option>
            ))}
          </Select>
        }
      />

      <div className="p-6 space-y-6">
        {/* Hero */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 field-grid opacity-60 pointer-events-none" />
          <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-4 p-6 md:p-8">
            <div className="flex flex-col justify-between gap-5 min-w-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="brand">BANTAY-ANI</Badge>
                  <ConnectionStatus
                    latestTs={latest?.ts}
                    sampleIntervalS={sampleIntervalS}
                  />
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Soil pH and moisture, in real time.
                </h2>
                <p className="text-xs uppercase tracking-[0.15em] text-brand font-medium">
                  Bird-detection &amp; Automated Noise-based Threat Alert ·
                  Yield Protection · Agricultural Notification &amp; IoT
                  Monitoring
                </p>
                <p className="text-sm text-muted max-w-prose">
                  An ESP32 node samples your bed every 5 minutes and streams to
                  this dashboard. Calibrate once, set thresholds, and let it
                  watch the field for you.
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <HeroIllustration className="w-full h-auto" />
            </div>
          </div>
        </Card>

        {/* Stat tiles */}
        <div className="grid gap-4 md:grid-cols-2">
          <StatTile
            label="Soil pH"
            value={latest ? fmtPh(latest.ph) : "—"}
            icon={<Beaker className="size-4" />}
            accent="ph"
            trend={sparkPh}
          />
          <StatTile
            label="Moisture"
            value={latest ? fmtMoist(latest.moisture_pct) : "—"}
            icon={<Droplets className="size-4" />}
            accent="moist"
            trend={sparkMoist}
          />
        </div>

        {/* Gauges */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>pH gauge</CardTitle>
              <StatusPill severity={phSeverity} />
            </CardHeader>
            <CardBody>
              <SensorGauge
                value={latest?.ph ?? 7}
                min={4.5}
                max={9}
                okMin={thresholds.ph_min}
                okMax={thresholds.ph_max}
                label="pH"
                accent="rgb(var(--color-accent-ph))"
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Moisture gauge</CardTitle>
              <StatusPill severity={moistSeverity} />
            </CardHeader>
            <CardBody>
              <SensorGauge
                value={latest?.moisture_pct ?? 50}
                min={0}
                max={100}
                okMin={thresholds.moist_min}
                okMax={thresholds.moist_max}
                label="%"
                unit="%"
                accent="rgb(var(--color-accent-moist))"
              />
            </CardBody>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>pH — time series</CardTitle>
            </CardHeader>
            <CardBody>
              <ReadingChart
                readings={readings}
                metric="ph"
                thresholds={thresholds}
                color="rgb(var(--color-accent-ph))"
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Moisture — time series</CardTitle>
            </CardHeader>
            <CardBody>
              <ReadingChart
                readings={readings}
                metric="moisture"
                thresholds={thresholds}
                color="rgb(var(--color-accent-moist))"
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function NoNodesView() {
  return (
    <>
      <Topbar
        title="Field overview"
        description="Live soil telemetry from your BANTAY-ANI nodes."
      />
      <div className="p-6">
        <Card>
          <CardBody className="flex flex-col items-center text-center py-16 px-6 gap-4">
            <Badge tone="warn">No nodes registered</Badge>
            <h3 className="text-lg font-semibold">Waiting for your first node</h3>
            <p className="text-sm text-muted max-w-md">
              Nothing in <code className="font-mono text-fg">nodes/</code> yet.
              Seed the project with{" "}
              <code className="font-mono text-fg">npm run seed</code>, or wait
              for a provisioned ESP32 to post its first reading.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
