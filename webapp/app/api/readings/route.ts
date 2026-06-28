import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { DEFAULT_THRESHOLDS, type Reading, type Thresholds } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_NODES = new Set(["node-001", "node-002"]);

function bad(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function validate(body: unknown): Reading | string {
  if (!body || typeof body !== "object") return "body must be an object";
  const b = body as Record<string, unknown>;
  if (typeof b.ts !== "string" || !b.ts) return "ts: missing or not a string";
  if (typeof b.node_id !== "string" || !ALLOWED_NODES.has(b.node_id))
    return `node_id: must be one of ${[...ALLOWED_NODES].join(", ")}`;
  if (!isFiniteNum(b.ph)) return "ph: not a finite number";
  if (!isFiniteNum(b.ph_raw)) return "ph_raw: not a finite number";
  if (!isFiniteNum(b.moisture_pct)) return "moisture_pct: not a finite number";
  if (!isFiniteNum(b.moist_raw)) return "moist_raw: not a finite number";
  if (!isFiniteNum(b.rssi)) return "rssi: not a finite number";
  return {
    ts: b.ts,
    node_id: b.node_id,
    ph: b.ph,
    ph_raw: b.ph_raw,
    moisture_pct: b.moisture_pct,
    moist_raw: b.moist_raw,
    rssi: b.rssi,
  };
}

async function loadEffectiveThresholds(
  db: FirebaseFirestore.Firestore,
  nodeId: string,
): Promise<Thresholds> {
  const [configSnap, nodeSnap] = await Promise.all([
    db.doc("config/global").get(),
    db.doc(`nodes/${nodeId}`).get(),
  ]);
  const base = (configSnap.exists ? (configSnap.data()?.thresholds as Thresholds | undefined) : undefined)
    ?? DEFAULT_THRESHOLDS;
  const override = nodeSnap.exists
    ? ((nodeSnap.data()?.thresholds_override as Partial<Thresholds> | undefined) ?? {})
    : {};
  return { ...base, ...override };
}

export async function POST(req: Request) {
  const expected = process.env.INGEST_API_KEY;
  if (!expected) return bad(500, "server: INGEST_API_KEY not set");
  if (req.headers.get("x-api-key") !== expected) return bad(401, "unauthorized");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad(400, "invalid JSON");
  }

  const parsed = validate(body);
  if (typeof parsed === "string") return bad(400, parsed);

  try {
    const db = getAdminDb();
    const readingRef = db.collection(`readings/${parsed.node_id}/samples`).doc();
    await readingRef.set(parsed);

    // Inline alert check — avoids needing a Cloud Function for MVP.
    const t = await loadEffectiveThresholds(db, parsed.node_id);
    const alertsToWrite: Array<{
      ts: string;
      node_id: string;
      metric: "ph" | "moisture";
      value: number;
      threshold: number;
      acknowledged: boolean;
    }> = [];
    if (parsed.ph < t.ph_min || parsed.ph > t.ph_max) {
      alertsToWrite.push({
        ts: parsed.ts,
        node_id: parsed.node_id,
        metric: "ph",
        value: parsed.ph,
        threshold: parsed.ph < t.ph_min ? t.ph_min : t.ph_max,
        acknowledged: false,
      });
    }
    if (parsed.moisture_pct < t.moist_min || parsed.moisture_pct > t.moist_max) {
      alertsToWrite.push({
        ts: parsed.ts,
        node_id: parsed.node_id,
        metric: "moisture",
        value: parsed.moisture_pct,
        threshold:
          parsed.moisture_pct < t.moist_min ? t.moist_min : t.moist_max,
        acknowledged: false,
      });
    }
    await Promise.all(
      alertsToWrite.map((a) => db.collection("alerts").doc().set(a)),
    );

    return NextResponse.json({ ok: true, id: readingRef.id, alerts: alertsToWrite.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("POST /api/readings firestore error:", message);
    return bad(500, `firestore: ${message}`);
  }
}
