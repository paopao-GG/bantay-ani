"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThresholdsForm } from "@/components/settings/thresholds-form";
import { useConfig, useNodes } from "@/lib/data/use-store";
import { updateConfig, updateNode } from "@/lib/data/mock-store";
import { useToast } from "@/components/ui/toast";
import { Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <Topbar
        title="Settings"
        description="Tune thresholds, sampling cadence, and per-node calibration."
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardBody className="p-4 flex items-start gap-3 text-sm">
            <Badge tone="brand">Preview</Badge>
            <p className="text-muted">
              Changes are kept in-memory for this session. Once Firebase is
              wired in, edits here will write to{" "}
              <code className="font-mono text-fg">config/global</code> and{" "}
              <code className="font-mono text-fg">nodes/&#123;id&#125;</code>.
            </p>
          </CardBody>
        </Card>

        <Tabs defaultValue="thresholds">
          <TabsList>
            <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
            <TabsTrigger value="sampling">Sampling</TabsTrigger>
            <TabsTrigger value="nodes">Nodes</TabsTrigger>
          </TabsList>

          <TabsContent value="thresholds" className="mt-4">
            <ThresholdsTab />
          </TabsContent>
          <TabsContent value="sampling" className="mt-4">
            <SamplingTab />
          </TabsContent>
          <TabsContent value="nodes" className="mt-4">
            <NodesTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function ThresholdsTab() {
  const config = useConfig();
  const toast = useToast();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Default thresholds</CardTitle>
        <CardDescription>
          Applied to every node unless overridden. Defaults come from the PRD:
          pH 6.0–7.5 and moisture 30–70%.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <ThresholdsForm
          value={config.thresholds}
          onSave={(t) => {
            updateConfig({ thresholds: t });
            toast.push("Thresholds saved", "success");
          }}
        />
      </CardBody>
    </Card>
  );
}

function SamplingTab() {
  const config = useConfig();
  const [interval, setIntervalS] = useState(config.sample_interval_s);
  const toast = useToast();
  const options = [
    { label: "1 minute", value: 60 },
    { label: "5 minutes", value: 300 },
    { label: "15 minutes", value: 900 },
    { label: "30 minutes", value: 1800 },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sampling cadence</CardTitle>
        <CardDescription>
          How often each node measures and uploads. Lower values surface
          changes faster but drain bandwidth.
        </CardDescription>
      </CardHeader>
      <CardBody className="grid gap-4 sm:grid-cols-2 max-w-xl">
        <div className="space-y-2">
          <Label>Interval</Label>
          <Select
            value={interval}
            onChange={(e) => setIntervalS(Number(e.target.value))}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Per day</Label>
          <div className="h-9 flex items-center text-sm font-medium">
            ≈ {Math.round((86400 / interval) * 10) / 10} samples
          </div>
        </div>
      </CardBody>
      <CardFooter className="flex justify-end">
        <Button
          onClick={() => {
            updateConfig({ sample_interval_s: interval });
            toast.push("Sampling interval saved", "success");
          }}
        >
          <Save className="size-3.5" />
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}

function NodesTab() {
  const nodes = useNodes();
  const toast = useToast();
  return (
    <div className="space-y-4">
      {nodes.map((n) => (
        <NodeCard
          key={n.id}
          node={n}
          onSave={(patch) => {
            updateNode(n.id, patch);
            toast.push(`${n.id} updated`, "success");
          }}
        />
      ))}
    </div>
  );
}

function NodeCard({
  node,
  onSave,
}: {
  node: ReturnType<typeof useNodes>[number];
  onSave: (patch: Partial<typeof node>) => void;
}) {
  const [location, setLocation] = useState(node.location);
  const [installDate, setInstallDate] = useState(node.install_date);
  const [rawDry, setRawDry] = useState(node.raw_dry);
  const [rawWet, setRawWet] = useState(node.raw_wet);
  return (
    <Card>
      <CardHeader className="flex-row justify-between items-start">
        <div>
          <CardTitle>{node.id}</CardTitle>
          <CardDescription>{node.location}</CardDescription>
        </div>
        <Badge tone="ok">Connected</Badge>
      </CardHeader>
      <CardBody className="grid gap-4 sm:grid-cols-2">
        <Field label="Location">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Field>
        <Field label="Install date">
          <Input
            type="date"
            value={installDate}
            onChange={(e) => setInstallDate(e.target.value)}
          />
        </Field>
        <Field label="Raw dry (ADC, in air)">
          <Input
            type="number"
            value={rawDry}
            onChange={(e) => setRawDry(Number(e.target.value))}
          />
        </Field>
        <Field label="Raw wet (ADC, submerged)">
          <Input
            type="number"
            value={rawWet}
            onChange={(e) => setRawWet(Number(e.target.value))}
          />
        </Field>
      </CardBody>
      <CardFooter className="justify-end">
        <Button
          onClick={() =>
            onSave({
              location,
              install_date: installDate,
              raw_dry: rawDry,
              raw_wet: rawWet,
            })
          }
        >
          <Save className="size-3.5" />
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
