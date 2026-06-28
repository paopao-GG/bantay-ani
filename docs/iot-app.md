# IoT App PRD

Subsystem PRD for the soil-monitoring node of PG Scarecrow. Parent doc: [prd.md](prd.md). Bird-deterrent unit is out of scope here.

## 1. Summary
A standalone ESP32 IoT node measures **soil moisture** and **soil pH**, uploads readings to **Firebase**, and surfaces them in a **Next.js webapp deployed on Vercel**. Monitoring only — no automated irrigation or dosing. Users get a live dashboard, configurable thresholds, alerts on breach, and `.xlsx` export of historical data.

## 2. Goals / Non-Goals
**Goals**
- Sample soil pH + moisture on a fixed interval and stream to the cloud.
- Tolerate Wi-Fi loss with a local buffer (≥1 h of readings).
- Alert the user when readings leave configured thresholds.
- Export historical data as `.xlsx`.

**Non-Goals**
- Actuation (irrigation, dosing).
- Multi-farm tenancy.
- Battery operation (mains power in v1).

## 3. Hardware

### 3.1 BOM
| Item | Part | Notes |
|---|---|---|
| MCU | ESP32 DevKit (30-pin) | Wi-Fi, dual-core |
| Carrier | ESP32 expansion board | Power rails + screw terminals |
| pH sensor | SN-3000-TR-PH-NO1 | RS485 / Modbus-RTU, 5–30 V supply |
| Moisture sensor | HW-103 | Analog, 3.3 V VCC |
| RS485 transceiver | MAX485 module (or TTL-to-RS485) | DE/RE direction control |
| PSU | 12 V DC adapter + buck to 5 V | 12 V → pH sensor, 5 V → ESP32 |

### 3.2 Wiring
| From | To | Notes |
|---|---|---|
| pH sensor A/B | MAX485 A/B | RS485 differential pair |
| pH sensor V+ | 12 V rail | Sensor needs ≥5 V; 12 V recommended |
| pH sensor GND | Common GND | Tie all grounds |
| MAX485 RO | ESP32 GPIO16 (RX2) | UART2 RX |
| MAX485 DI | ESP32 GPIO17 (TX2) | UART2 TX |
| MAX485 DE + RE (tied) | ESP32 GPIO4 | Direction control: HIGH = TX |
| MAX485 VCC | 5 V | Logic-level shifter inside module handles 3.3 V I/O |
| HW-103 VCC | 3.3 V | Avoid 5 V to keep AOUT within ADC range |
| HW-103 AOUT | ESP32 GPIO34 | ADC1_CH6, input-only pin (Wi-Fi-safe) |
| HW-103 GND | Common GND | |

### 3.3 Sensor protocol details
- **SN-3000-TR-PH-NO1 (Modbus-RTU over RS485)**
  - Default baud: **4800**, 8N1, slave address `0x01`.
  - pH read from holding register `0x0006`, scale ×100 (e.g. `0x02BC` = pH 7.00).
  - Function code `0x03` (read holding registers).
- **HW-103 (analog)**
  - 12-bit ADC, attenuation 11 dB (≈0–3.3 V range).
  - Average 10 samples per reading.
  - **Inverted**: lower ADC raw = wetter soil.
  - Calibration: capture `raw_dry` (sensor in air) and `raw_wet` (probe fully submerged); map linearly to 0–100 %.

## 4. Firmware (ESP32, Arduino or ESP-IDF)

### 4.1 Sampling cycle (default every 5 min, configurable)
1. Wake / loop tick.
2. Read pH via Modbus-RTU.
3. Read moisture (10-sample avg) → convert to %.
4. Compose reading JSON.
5. If Wi-Fi up → upload directly to Firestore. Else → push to NVS ring buffer.
6. On reconnect → flush buffer oldest-first.

### 4.2 Reading payload
```json
{
  "ts": "2026-06-08T12:00:00Z",
  "node_id": "node-001",
  "ph": 6.82,
  "ph_raw": 682,
  "moisture_pct": 54.3,
  "moist_raw": 1820,
  "rssi": -67
}
```

### 4.3 Resilience
- **Offline buffer**: NVS ring buffer, capacity **256 entries** (~21 h at 5-min interval; well above the ≥1 h requirement in [prd.md](prd.md) §7).
- **Wi-Fi reconnect**: exponential backoff (1 s → 60 s cap).
- **Watchdog**: hard reset after 30 min of continuous failure.
- **Config refresh**: poll `config/global` doc once per hour for threshold + interval overrides.
- **OTA** (v1.1, optional): Firebase-hosted firmware bin + signed update.

## 5. Backend — Firebase (Firestore)

Firestore chosen over Realtime DB for query + export ergonomics.

### 5.1 Collections
- `nodes/{node_id}` — `{location, install_date, thresholds_override?, sample_interval_override?}`
- `readings/{node_id}/samples/{auto_id}` — `{ts, ph, moisture_pct, ph_raw, moist_raw, rssi}`
- `alerts/{auto_id}` — `{ts, node_id, metric, value, threshold, acknowledged}`
- `config/global` — `{thresholds: {ph_min, ph_max, moist_min, moist_max}, sample_interval_s}`

### 5.2 Retention
- Hot: 90 days in Firestore.
- Cold: monthly export to Firebase Storage as `.xlsx` via scheduled Cloud Function.

### 5.3 Security rules
- Anonymous reads denied.
- Nodes authenticate via Firebase custom token (minted per `node_id` from a service account) — write-only to their own `readings/{node_id}/samples`.
- Webapp reads via authenticated user session.
- `config/global` writable only by admin role.

### 5.4 Alert engine
Cloud Function on `readings/*/samples` write:
1. Load effective thresholds (`nodes/{node_id}.thresholds_override` ?? `config/global.thresholds`).
2. If reading is out of range → create `alerts/{auto_id}`.
3. Optional fan-out to FCM / email (notification channel TBD — see [prd.md](prd.md) §9).

## 6. Webapp (Next.js on Vercel)

### 6.1 Stack
- **Framework**: Next.js (App Router), TypeScript.
- **Server**: Firebase Admin SDK in route handlers / server actions.
- **Client**: Firebase Web SDK with Firestore realtime listener for live values.
- **Charts**: Recharts (or similar).
- **Export**: `exceljs` in a server route → streamed `.xlsx` download.
- **Auth**: Firebase Auth (email/password or Google).

### 6.2 Pages
- `/` Dashboard — latest pH + moisture per node, time-series charts.
- `/alerts` — list, filter, acknowledge.
- `/settings` — thresholds, sample interval, node metadata.
- `/export` — date-range `.xlsx` export.

## 7. Thresholds (defaults; user-configurable)
Inherited from [prd.md](prd.md) §8:
- pH: **6.0 – 7.5**
- Soil moisture: **30 % – 70 %**

## 8. Non-Functional Requirements
- **Latency**: reading visible in webapp within **10 s** of sampling.
- **Buffer**: ≥ **1 h** of readings preserved through Wi-Fi outages.
- **Accuracy**: pH ±0.1 (per vendor spec); moisture repeatability ±5 %.
- **Reliability**: <1 % reading loss over a 7-day run.

## 9. Calibration & Install Checklist
1. Power node, confirm Wi-Fi association.
2. **Moisture**: probe in dry air → record `raw_dry`. Submerge probe in water → record `raw_wet`. Store both in `nodes/{node_id}`.
3. **pH**: verify in pH 4.00 and pH 7.00 buffer solutions; if drift > ±0.2, recalibrate per SN-3000 vendor procedure.
4. Insert probes at target soil depth (10–15 cm).
5. Confirm a reading appears in dashboard within 10 s.

## 10. Open Questions
- Notification channel (in-app vs. FCM/email/SMS) — deferred to [prd.md](prd.md) §9.
- Per-node provisioning UX (Wi-Fi credentials + node_id assignment): captive portal vs. pre-flashed?
- Final retention window (90 d hot proposed) — confirm with user.
