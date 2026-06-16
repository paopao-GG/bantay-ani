import { Badge } from "@/components/ui/badge";
import type { Severity } from "@/lib/types";

const labels: Record<Severity, string> = {
  ok: "In range",
  warn: "Near threshold",
  danger: "Out of range",
};

export function StatusPill({ severity }: { severity: Severity }) {
  const tone = severity === "ok" ? "ok" : severity === "warn" ? "warn" : "danger";
  return <Badge tone={tone}>{labels[severity]}</Badge>;
}
