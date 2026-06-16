# PRD — PG Scarecrow

## 1. Overview
PG Scarecrow is a smart agricultural monitoring and bird deterrent system. It combines a Raspberry Pi-based vision unit that detects and scares away birds with a standalone ESP32-based IoT node that measures soil moisture and pH. Both feed a webapp that gives farmers real-time visibility and alerts.

## 2. Problem
Small farms lose crops to bird intrusion and to undetected soil-condition drift (dryness, acidity). Existing solutions are either passive (static scarecrows birds adapt to) or expensive commercial telemetry kits. Farmers need an affordable, automated system that both *acts* on threats and *informs* them of soil health.

## 3. Goals
- Detect birds in the field via camera and trigger an audible deterrent (speaker MP3 + buzzer).
- Continuously measure soil moisture and pH and stream readings to a webapp.
- Alert the user when pH or soil moisture falls outside configured thresholds.
- Surface captured bird-detection images in the webapp for review.

### Non-Goals
- Pest detection beyond birds.
- Automated irrigation or chemical dosing (monitoring only).
- Multi-farm / multi-tenant management.

## 4. Users
- **Primary:** Smallholder farmer monitoring one field.
- **Secondary:** Agricultural technician reviewing soil trends and detection logs.

## 5. System Architecture

### 5.1 Bird Deterrent Unit (Raspberry Pi)
- **Compute:** Raspberry Pi 4B+
- **Vision:** Raspberry Pi Camera
- **Output:** Speakers + MP3 player (via relay), buzzer
- **Role:** Run bird-detection model on camera frames; on detection, trigger relay → MP3 playback + buzzer; upload detection image to webapp.

### 5.2 IoT Sensor Node (ESP32)
- **Compute:** ESP32 (Wi-Fi)
- **Sensors:** Soil moisture sensor, pH level sensor
- **Role:** Sample sensors on a fixed interval and POST readings to the webapp backend over Wi-Fi.

### 5.3 Webapp
- **Role:** Receive sensor data and detection events; display dashboards; raise notifications when thresholds are breached.

## 6. Functional Requirements

### 6.1 Bird Detection
- Capture frames from the Pi camera at a configurable rate.
- Classify frames for bird presence; confidence threshold must be tunable.
- On positive detection: activate deterrent for a configurable duration and upload the triggering image with timestamp.
- Cooldown period between successive activations to avoid continuous noise.

### 6.2 Soil Monitoring
- Sample soil moisture and pH at a configurable interval (default: every 5 minutes).
- Persist readings with timestamps.
- Tolerate transient Wi-Fi loss: buffer readings locally and resend when reconnected.

### 6.3 Webapp
- Live dashboard: latest pH, latest soil moisture, time-series charts.
- Bird-detection feed: thumbnails + timestamps of recent detections.
- Notifications when pH or soil moisture leaves the configured normal range.
- User-configurable thresholds for pH and moisture.

## 7. Non-Functional Requirements
- **Latency:** Sensor reading visible in webapp within 10 seconds of sampling.
- **Reliability:** ESP32 node survives Wi-Fi outages without data loss for ≥1 hour.
- **Power:** Both units run from mains in v1; battery operation is out of scope.
- **Cost:** Total BOM target under typical hobbyist budget (no commercial-grade sensors required).

## 8. Thresholds (Defaults — User-Configurable)
- **Soil moisture:** alert if outside 30–70% (sensor-relative).
- **pH:** alert if outside 6.0–7.5.

## 9. Open Questions
- Bird-detection model: pretrained (e.g. MobileNet/YOLO) vs. custom-trained on local species?
- Webapp hosting: local network only, or cloud-accessible?
- Notification channel: in-app only, or email / SMS / Telegram?
- How are camera images stored long-term, and what is the retention policy?

## 10. Success Metrics
- ≥80% bird-detection precision on field footage.
- <1% sensor reading loss over a 7-day continuous run.
- User can configure thresholds and receive a notification within 1 minute of a breach.
