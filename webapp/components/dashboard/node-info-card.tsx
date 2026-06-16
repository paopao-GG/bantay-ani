"use client";

import {
  MapPin,
  CalendarDays,
  HardDrive,
  Signal,
  Database,
} from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtRelative, fmtRssi } from "@/lib/format";
import type { Node, Reading } from "@/lib/types";

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

export function NodeInfoCard({
  node,
  latest,
}: {
  node: Node;
  latest?: Reading;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Node details</CardTitle>
      </CardHeader>
      <CardBody className="divide-y divide-border">
        <Row icon={MapPin} label="Location" value={node.location} />
        <Row
          icon={CalendarDays}
          label="Installed"
          value={node.install_date}
        />
        <Row
          icon={Signal}
          label="Signal"
          value={latest ? fmtRssi(latest.rssi) : "—"}
        />
        <Row
          icon={Database}
          label="Last sample"
          value={latest ? fmtRelative(latest.ts) : "—"}
        />
        <Row
          icon={HardDrive}
          label="Calibration raws"
          value={
            <span className="numeric text-xs">
              dry {node.raw_dry} · wet {node.raw_wet}
            </span>
          }
        />
      </CardBody>
    </Card>
  );
}
