# BANTAY-ANI — Webapp

**BANTAY-ANI**: **B**ird-detection and **A**utomated **N**oise-based **T**hreat **A**lert System for **Y**ield Protection and **A**gricultural **N**otification and **I**oT-based Monitoring.

Next.js 16 + Tailwind dashboard for the BANTAY-ANI soil-telemetry IoT node.
This is the **frontend-only** build: the UI runs against a synthetic in-memory
mock store so the layout, charts, gauges, and interactions can be reviewed
before any backend work happens. See [../iot-app.md](../iot-app.md) for the
product spec.

## Run it

```bash
npm install --legacy-peer-deps
npm run dev
```

Open <http://localhost:3000>. The dashboard ticks every ~4 seconds.

Build:

```bash
npm run build
npm run start
```

## What's here

| Path | Purpose |
|---|---|
| `app/page.tsx` | Dashboard — hero, KPI tiles, gauges, time-series charts |
| `app/alerts/page.tsx` | Filterable alerts table with acknowledge action |
| `app/settings/page.tsx` | Thresholds, sampling cadence, per-node calibration |
| `app/export/page.tsx` | Date-range CSV export (real `.xlsx` ships with backend) |
| `lib/data/mock-store.ts` | Seeded readings + live ticker — **the swap seam** |
| `lib/data/use-store.ts` | React hooks: `useReadings`, `useAlerts`, `useNodes`, etc. |
| `components/dashboard/sensor-gauge.tsx` | Custom-drawn radial gauge with threshold zones |
| `components/dashboard/reading-chart.tsx` | Recharts area chart with threshold bands |
| `components/graphics/*` | Hand-authored SVG: logo, hero scene, empty state |

## Wiring Firebase later

The components only ever talk to `lib/data/use-store.ts`. To go live:

1. Replace the body of each hook in `use-store.ts` to use Firestore's
   `onSnapshot` against `readings/{node_id}/samples`, `alerts`, `nodes`, and
   `config/global`.
2. Rewrite the mutators in `mock-store.ts` (`updateConfig`, `updateNode`,
   `acknowledgeAlert`) to call `setDoc` / `updateDoc`.
3. Add Firebase Auth (email/password) and gate `/settings` writes by admin
   claim per [iot-app.md §5.3](../iot-app.md).

The component tree does not change.

## Notes

- React 19 + Recharts 2 needs `--legacy-peer-deps` until Recharts 3 ships.
- Mock store state is lost on hard refresh — this is intentional pre-backend.
- The dashboard exposes "Simulate breach" buttons so the alerts flow can be
  exercised without waiting for a real out-of-range sample.
