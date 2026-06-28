# IoT Node — Wiring Guide

Companion to [iot-app.md](iot-app.md). Test code: [firmware/sensor-test/sensor-test.ino](firmware/sensor-test/sensor-test.ino).

## 1. Parts
- ESP32 DevKit (30-pin)
- MAX485 module (TTL ↔ RS485)
- SN-3000-TR-PH-NO1 soil pH sensor (RS485, Modbus-RTU)
- HW-103 soil moisture sensor (analog, 5 V)
- 12 V DC adapter
- Buck converter 12 V → 5 V (or use ESP32 USB for bench testing)
- Resistors: **10 kΩ** and **20 kΩ** (HW-103 AOUT divider)
- Breadboard + jumpers

## 2. Power rails
```
12 V adapter ──┬── pH sensor V+  (BROWN)
               └── Buck → 5 V ──┬── ESP32 VIN  (or USB during bench test)
                                └── HW-103 VCC
                                └── MAX485 VCC

All GNDs tied together:
  pH sensor GND (BLACK) ── ESP32 GND ── HW-103 GND ── MAX485 GND ── Buck GND
```

**4-wire pH sensor color code (your unit):**

| Wire color | Function |
|---|---|
| **Brown** | V+ (DC power, 9–24 V — feed from 12 V adapter) |
| **Black** | GND (also common ground with ESP32) |
| **Yellow** | RS485 **A** (D+) → MAX485 **A** |
| **Blue**  | RS485 **B** (D−) → MAX485 **B** |

**Common ground is mandatory** — RS485 and analog readings will be wrong without it.

## 3. Pinout table

| ESP32 Pin | Goes to | Purpose |
|---|---|---|
| GPIO16 (RX2) | MAX485 **RO** | UART2 RX from RS485 |
| GPIO17 (TX2) | MAX485 **DI** | UART2 TX to RS485 |
| GPIO4        | MAX485 **DE + RE** (tied) | Direction: HIGH = transmit, LOW = receive |
| GPIO34       | HW-103 AOUT (via divider) | ADC1_CH6, input-only, Wi-Fi safe |
| 5 V          | MAX485 VCC, HW-103 VCC | |
| GND          | Common ground | |

## 4. HW-103 AOUT voltage divider (5 V → 3.3 V)
HW-103 AOUT can swing up to ~5 V. ESP32 ADC max is 3.3 V — needs scaling.

```
HW-103 AOUT ────[ 10 kΩ ]────┬──── GPIO34
                              │
                           [ 20 kΩ ]
                              │
                             GND
```
Output ratio = 20 / (10 + 20) = 2/3 → 5 V → 3.33 V (just at the rail; safe).

## 5. RS485 wiring (pH sensor ↔ MAX485)

```
SN-3000 pH sensor (4-wire)   MAX485 module           ESP32
──────────────────────────   ─────────────           ─────
Brown  (V+)   ─── 12 V
Black  (GND)  ─── GND ─────────── GND ──────────── GND
Yellow (A / D+) ────────────────  A
Blue   (B / D−) ────────────────  B
                                  RO ─────────────  GPIO16 (RX2)
                                  DI ─────────────  GPIO17 (TX2)
                                  DE ┐
                                     ├──────────── GPIO4
                                  RE ┘
                                  VCC ──────────── 5 V
                                  GND ──────────── GND
```
> If readings time out, **swap Yellow and Blue** (A/B convention varies between sensor batches).
> Do **not** swap Brown/Black — reversing power will destroy the sensor.

## 6. ASCII overview

```
                    ┌────────────────────────┐
                    │      ESP32 DevKit      │
                    │                        │
   5V ─────────────►│ VIN              GPIO4 │──► MAX485 DE+RE
   GND ────────────►│ GND             GPIO16 │◄── MAX485 RO
                    │                 GPIO17 │──► MAX485 DI
   HW-103 AOUT      │                        │
     │              │                 GPIO34 │◄── (divider output)
     │   10k        │                        │
     ├──/\/\─── GPIO34                       │
     │                                       │
     20k                                     │
     │                                       │
    GND                                      │
                    └────────────────────────┘

                    ┌──────────────┐
                    │   MAX485     │   A ◄──► pH sensor Yellow (A)
                    │              │   B ◄──► pH sensor Blue   (B)
                    │ VCC = 5V     │
                    │ GND = GND    │
                    └──────────────┘

   pH sensor power (separate from MAX485):
     Brown ──► 12 V adapter (+)
     Black ──► GND (shared with everything)
```

## 7. Bring-up order (do NOT skip)
1. Wire **grounds first**.
2. Wire ESP32 power (USB or buck 5 V).
3. Verify ESP32 boots (serial @ 115200).
4. Wire HW-103 + divider. Flash test sketch. Confirm moisture reading changes when probe is touched / dipped.
5. Power off. Wire MAX485 (RO/DI/DE/RE/VCC/GND).
6. Wire pH sensor to MAX485 A/B and 12 V supply (separate adapter is fine).
7. Power on. Confirm pH reading in serial monitor.

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Moisture reads 4095 always | Divider missing / floating GPIO34 / sensor unpowered |
| Moisture reads 0 always | AOUT shorted to GND / divider wired backward |
| pH read times out | A/B swapped, wrong baud (try 9600), wrong slave addr |
| pH read = 0xFFFF | DE/RE not toggling — check GPIO4 |
| ESP32 brownout / resets | 5 V rail can't supply MAX485 + ESP32 — use stronger buck |
| Garbage UART data | Missing common GND between MAX485 and ESP32 |
