"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { AllClearIllustration } from "@/components/graphics/empty-state";
import { acknowledgeAlert } from "@/lib/data/firestore-store";
import { useAlerts, useNodes } from "@/lib/data/use-store";
import { fmtDateTime, fmtPh, fmtMoist } from "@/lib/format";
import type { Alert } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Status = "all" | "open" | "acknowledged";
type MetricFilter = "all" | "ph" | "moisture";

function severityOf(a: Alert): "danger" | "warn" {
  const dist =
    a.metric === "ph"
      ? Math.abs(a.value - a.threshold)
      : Math.abs(a.value - a.threshold);
  return dist > (a.metric === "ph" ? 0.5 : 8) ? "danger" : "warn";
}

export default function AlertsPage() {
  const alerts = useAlerts();
  const nodes = useNodes();
  const toast = useToast();
  const [status, setStatus] = useState<Status>("open");
  const [metric, setMetric] = useState<MetricFilter>("all");
  const [nodeId, setNodeId] = useState<string>("all");

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (status === "open" && a.acknowledged) return false;
      if (status === "acknowledged" && !a.acknowledged) return false;
      if (metric !== "all" && a.metric !== metric) return false;
      if (nodeId !== "all" && a.node_id !== nodeId) return false;
      return true;
    });
  }, [alerts, status, metric, nodeId]);

  const openCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <>
      <Topbar
        title="Alerts"
        description="Threshold breaches across all nodes."
        right={
          <Badge tone={openCount ? "danger" : "ok"}>
            {openCount} open
          </Badge>
        }
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardBody className="flex flex-wrap items-end gap-3 pt-5">
            <Filter label="Status">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
              >
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="all">All</option>
              </Select>
            </Filter>
            <Filter label="Metric">
              <Select
                value={metric}
                onChange={(e) => setMetric(e.target.value as MetricFilter)}
              >
                <option value="all">All metrics</option>
                <option value="ph">pH</option>
                <option value="moisture">Moisture</option>
              </Select>
            </Filter>
            <Filter label="Node">
              <Select
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
              >
                <option value="all">All nodes</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id}
                  </option>
                ))}
              </Select>
            </Filter>
            <div className="ml-auto text-sm text-muted">
              Showing <span className="font-medium text-fg">{filtered.length}</span>{" "}
              of {alerts.length}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {status === "open"
                ? "Open alerts"
                : status === "acknowledged"
                  ? "Acknowledged"
                  : "All alerts"}
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-muted border-b border-border">
                      <Th>When</Th>
                      <Th>Node</Th>
                      <Th>Metric</Th>
                      <Th>Value</Th>
                      <Th>Threshold</Th>
                      <Th>Severity</Th>
                      <Th className="text-right">Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => {
                      const sev = severityOf(a);
                      return (
                        <tr
                          key={a.id}
                          className="border-b border-border last:border-0 hover:bg-surface-2/50 transition-colors"
                        >
                          <Td className="text-muted numeric text-xs">
                            {fmtDateTime(a.ts)}
                          </Td>
                          <Td className="font-medium">{a.node_id}</Td>
                          <Td>
                            <Badge tone={a.metric === "ph" ? "brand" : "neutral"}>
                              {a.metric === "ph" ? "pH" : "Moisture"}
                            </Badge>
                          </Td>
                          <Td className="numeric font-semibold">
                            {a.metric === "ph" ? fmtPh(a.value) : fmtMoist(a.value)}
                          </Td>
                          <Td className="numeric text-muted">
                            {a.metric === "ph"
                              ? fmtPh(a.threshold)
                              : fmtMoist(a.threshold)}
                          </Td>
                          <Td>
                            <Badge tone={sev}>
                              {sev === "danger" ? "Severe" : "Warning"}
                            </Badge>
                          </Td>
                          <Td className="text-right">
                            {a.acknowledged ? (
                              <span className="inline-flex items-center gap-1 text-xs text-muted">
                                <CheckCircle2 className="size-3.5 text-ok" />
                                Acknowledged
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  acknowledgeAlert(a.id);
                                  toast.push("Alert acknowledged", "success");
                                }}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Filter({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-medium uppercase tracking-widest text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`text-left font-medium px-5 py-3 ${className}`}>{children}</th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-3 ${className}`}>{children}</td>;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <AllClearIllustration className="w-44 h-32 mb-4" />
      <h3 className="text-lg font-semibold">All clear</h3>
      <p className="text-sm text-muted mt-1 max-w-sm">
        No alerts match your filters. Threshold breaches will show up here as
        soon as they happen.
      </p>
    </div>
  );
}
