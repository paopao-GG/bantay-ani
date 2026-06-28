"use client";

import { useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { Download, FileSpreadsheet } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNodes, useReadings } from "@/lib/data/use-store";
import { useToast } from "@/components/ui/toast";

function toCsv(rows: ReturnType<typeof useReadings>) {
  const header = [
    "ts",
    "node_id",
    "ph",
    "ph_raw",
    "moisture_pct",
    "moist_raw",
    "rssi",
  ];
  const body = rows
    .map((r) =>
      [
        r.ts,
        r.node_id,
        r.ph.toFixed(2),
        r.ph_raw,
        r.moisture_pct.toFixed(1),
        r.moist_raw,
        r.rssi,
      ].join(","),
    )
    .join("\n");
  return `${header.join(",")}\n${body}`;
}

export default function ExportPage() {
  const allReadings = useReadings();
  const nodes = useNodes();
  const toast = useToast();
  const today = new Date();
  const [from, setFrom] = useState(
    format(subDays(today, 7), "yyyy-MM-dd"),
  );
  const [to, setTo] = useState(format(today, "yyyy-MM-dd"));
  const [selected, setSelected] = useState<Set<string>>(
    new Set(nodes.map((n) => n.id)),
  );

  const filtered = useMemo(() => {
    const start = parseISO(from).getTime();
    const end = parseISO(to).getTime() + 24 * 60 * 60 * 1000;
    return allReadings.filter((r) => {
      const t = parseISO(r.ts).getTime();
      return t >= start && t <= end && selected.has(r.node_id);
    });
  }, [allReadings, from, to, selected]);

  function toggle(id: string) {
    setSelected((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function download() {
    if (!filtered.length) {
      toast.push("No readings match this range", "warn");
      return;
    }
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bantay-ani-${from}_to_${to}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.push(
      `Downloaded ${filtered.length} rows. Real .xlsx export ships with backend wiring.`,
      "success",
    );
  }

  return (
    <>
      <Topbar
        title="Export"
        description="Pull historical readings for offline analysis."
      />
      <div className="p-6 space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>Build export</CardTitle>
                <CardDescription>
                  Pick a date range and the nodes you want to include.
                </CardDescription>
              </div>
              <Badge tone="brand">
                <FileSpreadsheet className="size-3" /> .xlsx · coming
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nodes</Label>
              <div className="flex flex-wrap gap-2">
                {nodes.map((n) => {
                  const active = selected.has(n.id);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => toggle(n.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-border text-muted hover:bg-surface-2"
                      }`}
                    >
                      {n.id} · {n.location}
                    </button>
                  );
                })}
              </div>
            </div>
            <PreviewTable count={filtered.length} />
          </CardBody>
          <CardFooter className="justify-between flex-wrap gap-3">
            <div className="text-xs text-muted max-w-md">
              CSV is built in the browser from your selected range.{" "}
              <code className="font-mono text-fg">.xlsx</code> export via a
              server route is on the roadmap.
            </div>
            <Button onClick={download} disabled={!filtered.length}>
              <Download className="size-3.5" />
              Download
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

function PreviewTable({ count }: { count: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-4">
      <div className="text-xs uppercase tracking-widest text-muted">
        Preview
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <div className="numeric text-3xl font-semibold">{count}</div>
        <div className="text-sm text-muted">rows match</div>
      </div>
      <div className="mt-2 text-xs text-muted">
        Columns: ts · node_id · ph · ph_raw · moisture_pct · moist_raw · rssi
      </div>
    </div>
  );
}
