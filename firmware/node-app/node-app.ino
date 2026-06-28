/*
 * PG Scarecrow — IoT Node (Production v1, MVP scope)
 *
 * Reads soil moisture (HW-103) + pH (SN-3000-TR-PH-NO1 Modbus-RTU via MAX485),
 * connects to Wi-Fi via WiFiManager captive portal, and POSTs JSON readings
 * to a webapp ingest endpoint every SAMPLE_INTERVAL_MS.
 *
 * MVP scope (per agreed plan):
 *   - No NVS ring buffer. Failed POSTs are logged and skipped.
 *   - No watchdog reset, no exponential backoff, no remote config polling.
 *
 * First boot:
 *   1) Node creates an open Wi-Fi network "pg-scarecrow-setup".
 *   2) Connect from phone/laptop, captive portal opens.
 *   3) Pick your Wi-Fi, enter password, and set:
 *        - Server URL: https://your-app.vercel.app/api/readings
 *        - Node ID:    node-001
 *        - API key:    (same value as INGEST_API_KEY env var on Vercel)
 *   4) Node saves config to flash and reboots into normal operation.
 *
 * To re-provision: hold BOOT button at power-up for 5 s (see RESET_PIN below).
 *
 * Required libraries (Arduino Library Manager):
 *   - ModbusMaster        (4-20ma/ModbusMaster)
 *   - WiFiManager         (tzapu/WiFiManager)
 *   - ArduinoJson         (bblanchon/ArduinoJson, v7.x)
 *
 * Board: "ESP32 Dev Module"
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <time.h>

// ---------- Pins (unchanged from sensor-test.ino) ----------
static const int PIN_MOIST_AOUT = 34;   // ADC1_CH6, input-only
static const int PIN_RS485_DE   = 4;    // DE + RE tied together
static const int PIN_RS485_RX   = 16;   // UART2 RX  <- MAX485 RO
static const int PIN_RS485_TX   = 17;   // UART2 TX  -> MAX485 DI
static const int RESET_PIN      = 0;    // BOOT button — hold at boot to wipe config

// ---------- Modbus (unchanged from sensor-test.ino) ----------
static const uint8_t  PH_SLAVE_ADDR = 0x01;
static const uint16_t PH_REG_ADDR   = 0x0000;
static const uint32_t RS485_BAUD    = 4800;

// ---------- Moisture calibration (unchanged from sensor-test.ino) ----------
static int RAW_DRY = 3000;
static int RAW_WET = 1200;

// ---------- Sampling ----------
static const uint32_t SAMPLE_INTERVAL_MS = 5UL * 60UL * 1000UL;   // 5 min
static const uint32_t HTTP_TIMEOUT_MS    = 10000;
static const char*    NTP_SERVER         = "pool.ntp.org";

// ---------- Provisioning ----------
static const char* AP_SSID        = "pg-scarecrow-setup";
static const uint32_t AP_TIMEOUT_S = 180;

ModbusMaster phNode;
Preferences  prefs;

String serverUrl;
String nodeId;
String apiKey;
uint32_t lastSampleMs = 0;
bool firstSampleDone = false;

// ============================================================
//  RS485 direction callbacks
// ============================================================
void preTransmission()  { digitalWrite(PIN_RS485_DE, HIGH); }
void postTransmission() { digitalWrite(PIN_RS485_DE, LOW);  }

// ============================================================
//  Sensors (ported verbatim from sensor-test.ino — known good)
// ============================================================
float readMoisture(int &rawOut) {
  uint32_t acc = 0;
  const int N = 10;
  for (int i = 0; i < N; i++) {
    acc += analogRead(PIN_MOIST_AOUT);
    delay(5);
  }
  rawOut = acc / N;

  float pct = 100.0f * (float)(RAW_DRY - rawOut) / (float)(RAW_DRY - RAW_WET);
  if (pct < 0)   pct = 0;
  if (pct > 100) pct = 100;

  Serial.printf("[MOIST] raw=%d -> %.1f %%\n", rawOut, pct);
  return pct;
}

bool readPh(float &phOut, uint16_t &rawOut) {
  uint8_t result = phNode.readHoldingRegisters(PH_REG_ADDR, 1);
  if (result == phNode.ku8MBSuccess) {
    rawOut = phNode.getResponseBuffer(0);
    phOut  = rawOut / 10.0f;
    Serial.printf("[pH]    raw=0x%04X -> pH %.2f\n", rawOut, phOut);
    return true;
  }
  Serial.printf("[pH]    Modbus error 0x%02X\n", result);
  return false;
}

// ============================================================
//  Timestamp (ISO-8601 UTC, e.g. "2026-06-28T12:00:00Z")
// ============================================================
bool getIsoTimestamp(char* out, size_t outLen) {
  time_t now = time(nullptr);
  if (now < 8 * 3600 * 2) return false;   // NTP not synced yet
  struct tm tm;
  gmtime_r(&now, &tm);
  strftime(out, outLen, "%Y-%m-%dT%H:%M:%SZ", &tm);
  return true;
}

// ============================================================
//  HTTP POST
// ============================================================
bool postReading(const char* ts, float ph, uint16_t phRaw,
                 float moist, int moistRaw, int rssi) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP]  skip — Wi-Fi down");
    return false;
  }

  JsonDocument doc;
  doc["ts"]           = ts;
  doc["node_id"]      = nodeId;
  doc["ph"]           = ph;
  doc["ph_raw"]       = phRaw;
  doc["moisture_pct"] = moist;
  doc["moist_raw"]    = moistRaw;
  doc["rssi"]         = rssi;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Api-Key", apiKey);

  int code = http.POST(body);
  if (code > 0) {
    Serial.printf("[HTTP]  POST %s -> %d\n", serverUrl.c_str(), code);
  } else {
    Serial.printf("[HTTP]  POST failed: %s\n", http.errorToString(code).c_str());
  }
  http.end();
  return code >= 200 && code < 300;
}

// ============================================================
//  Wi-Fi provisioning via captive portal
// ============================================================
void loadOrProvisionConfig() {
  prefs.begin("scarecrow", false);
  serverUrl = prefs.getString("server_url", "");
  nodeId    = prefs.getString("node_id",    "");
  apiKey    = prefs.getString("api_key",    "");

  // Hold BOOT (GPIO0) at power-up to wipe saved config + Wi-Fi creds.
  pinMode(RESET_PIN, INPUT_PULLUP);
  delay(50);
  bool forceReset = digitalRead(RESET_PIN) == LOW;
  if (forceReset) {
    Serial.println("[CFG]   Reset requested — clearing config");
    prefs.clear();
    serverUrl = "";
    nodeId    = "";
    apiKey    = "";
  }

  WiFiManager wm;
  if (forceReset) wm.resetSettings();

  WiFiManagerParameter pServerUrl("server_url", "Server URL (https://.../api/readings)",
                                  serverUrl.c_str(), 200);
  WiFiManagerParameter pNodeId   ("node_id",    "Node ID (e.g. node-001)",
                                  nodeId.c_str(), 32);
  WiFiManagerParameter pApiKey   ("api_key",    "API key (INGEST_API_KEY)",
                                  apiKey.c_str(), 128);
  wm.addParameter(&pServerUrl);
  wm.addParameter(&pNodeId);
  wm.addParameter(&pApiKey);

  wm.setConfigPortalTimeout(AP_TIMEOUT_S);

  Serial.printf("[WiFi]  AP fallback SSID: %s (timeout %us)\n", AP_SSID, AP_TIMEOUT_S);
  if (!wm.autoConnect(AP_SSID)) {
    Serial.println("[WiFi]  Failed/timeout — restarting");
    delay(2000);
    ESP.restart();
  }

  // Persist new params if user set them in the portal.
  String newUrl = pServerUrl.getValue();
  String newId  = pNodeId.getValue();
  String newKey = pApiKey.getValue();
  if (newUrl.length()) { serverUrl = newUrl; prefs.putString("server_url", serverUrl); }
  if (newId.length())  { nodeId    = newId;  prefs.putString("node_id",    nodeId);    }
  if (newKey.length()) { apiKey    = newKey; prefs.putString("api_key",    apiKey);    }

  Serial.printf("[WiFi]  Connected. IP=%s RSSI=%d\n",
                WiFi.localIP().toString().c_str(), WiFi.RSSI());
  Serial.printf("[CFG]   server_url=%s\n", serverUrl.c_str());
  Serial.printf("[CFG]   node_id=%s\n",    nodeId.c_str());
  Serial.printf("[CFG]   api_key=%s\n",    apiKey.length() ? "(set)" : "(missing)");

  if (!serverUrl.length() || !nodeId.length() || !apiKey.length()) {
    Serial.println("[CFG]   Missing server_url, node_id, or api_key — rebooting into portal");
    delay(2000);
    prefs.clear();
    ESP.restart();
  }
}

// ============================================================
//  setup / loop
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println();
  Serial.println("PG Scarecrow — node-app");

  // ADC
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // RS485 direction
  pinMode(PIN_RS485_DE, OUTPUT);
  digitalWrite(PIN_RS485_DE, LOW);

  // UART2 -> MAX485
  Serial2.begin(RS485_BAUD, SERIAL_8N1, PIN_RS485_RX, PIN_RS485_TX);

  // Modbus
  phNode.begin(PH_SLAVE_ADDR, Serial2);
  phNode.preTransmission(preTransmission);
  phNode.postTransmission(postTransmission);

  // Wi-Fi + config (blocks until connected or reboots)
  loadOrProvisionConfig();

  // NTP — UTC, no DST offset; ISO timestamps are UTC.
  configTime(0, 0, NTP_SERVER);
  Serial.print("[NTP]   syncing");
  time_t t = 0;
  for (int i = 0; i < 20 && t < 8 * 3600 * 2; i++) {
    delay(500);
    Serial.print(".");
    t = time(nullptr);
  }
  Serial.println(t < 8 * 3600 * 2 ? " not synced (will retry per sample)" : " ok");

  Serial.printf("[OK]    Sampling every %lus\n", SAMPLE_INTERVAL_MS / 1000);
}

void takeSample() {
  Serial.println("----");

  int moistRaw = 0;
  float moist  = readMoisture(moistRaw);

  float ph = NAN;
  uint16_t phRaw = 0;
  bool phOk = readPh(ph, phRaw);

  char ts[32];
  if (!getIsoTimestamp(ts, sizeof(ts))) {
    Serial.println("[TS]    not synced — skipping POST");
    return;
  }
  if (!phOk) {
    Serial.println("[POST]  skip — pH read failed");
    return;
  }

  postReading(ts, ph, phRaw, moist, moistRaw, WiFi.RSSI());
}

void loop() {
  uint32_t now = millis();
  if (!firstSampleDone || (now - lastSampleMs) >= SAMPLE_INTERVAL_MS) {
    lastSampleMs = now;
    firstSampleDone = true;
    takeSample();
  }
  delay(100);   // light idle; keeps loop responsive without busy-spinning
}
