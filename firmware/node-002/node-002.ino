/*
 * PG Scarecrow — IoT Node 002 (hardcoded config variant)
 *
 * Same firmware as node-app, but server_url / node_id / api_key are
 * compiled in. Only Wi-Fi credentials are provisioned via captive portal.
 *
 * First boot: connect to "pg-scarecrow-002-setup", pick Wi-Fi, done.
 * Re-provision Wi-Fi: hold BOOT (GPIO0) at power-up.
 *
 * Required libraries: ModbusMaster, WiFiManager, ArduinoJson v7.x
 * Board: ESP32 Dev Module
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>
#include <time.h>

// ============================================================
//  HARDCODED CONFIG — change API_KEY before flashing
// ============================================================
static const char* SERVER_URL = "https://bantay-anii.vercel.app/api/readings";
static const char* NODE_ID    = "node-002";
static const char* API_KEY    = "PASTE_INGEST_API_KEY_HERE";

// ---------- Pins ----------
static const int PIN_MOIST_AOUT = 34;
static const int PIN_RS485_DE   = 4;
static const int PIN_RS485_RX   = 16;
static const int PIN_RS485_TX   = 17;
static const int RESET_PIN      = 0;

// ---------- Modbus ----------
static const uint8_t  PH_SLAVE_ADDR = 0x01;
static const uint16_t PH_REG_ADDR   = 0x0000;
static const uint32_t RS485_BAUD    = 4800;

// ---------- Moisture calibration ----------
static int RAW_DRY = 3000;
static int RAW_WET = 1200;

// ---------- Sampling ----------
static const uint32_t SAMPLE_INTERVAL_MS = 5UL * 60UL * 1000UL;
static const uint32_t HTTP_TIMEOUT_MS    = 10000;
static const char*    NTP_SERVER         = "pool.ntp.org";

// ---------- Provisioning ----------
static const char* AP_SSID         = "pg-scarecrow-002-setup";
static const uint32_t AP_TIMEOUT_S = 180;

ModbusMaster phNode;
uint32_t lastSampleMs = 0;
bool firstSampleDone = false;

void preTransmission()  { digitalWrite(PIN_RS485_DE, HIGH); }
void postTransmission() { digitalWrite(PIN_RS485_DE, LOW);  }

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

bool getIsoTimestamp(char* out, size_t outLen) {
  time_t now = time(nullptr);
  if (now < 8 * 3600 * 2) return false;
  struct tm tm;
  gmtime_r(&now, &tm);
  strftime(out, outLen, "%Y-%m-%dT%H:%M:%SZ", &tm);
  return true;
}

bool postReading(const char* ts, float ph, uint16_t phRaw,
                 float moist, int moistRaw, int rssi) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP]  skip — Wi-Fi down");
    return false;
  }

  JsonDocument doc;
  doc["ts"]           = ts;
  doc["node_id"]      = NODE_ID;
  doc["ph"]           = ph;
  doc["ph_raw"]       = phRaw;
  doc["moisture_pct"] = moist;
  doc["moist_raw"]    = moistRaw;
  doc["rssi"]         = rssi;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Api-Key", API_KEY);

  int code = http.POST(body);
  if (code > 0) {
    Serial.printf("[HTTP]  POST %s -> %d\n", SERVER_URL, code);
  } else {
    Serial.printf("[HTTP]  POST failed: %s\n", http.errorToString(code).c_str());
  }
  http.end();
  return code >= 200 && code < 300;
}

void connectWifi() {
  pinMode(RESET_PIN, INPUT_PULLUP);
  delay(50);
  bool forceReset = digitalRead(RESET_PIN) == LOW;

  WiFiManager wm;
  if (forceReset) {
    Serial.println("[WiFi]  Reset requested — clearing Wi-Fi creds");
    wm.resetSettings();
  }
  wm.setConfigPortalTimeout(AP_TIMEOUT_S);

  Serial.printf("[WiFi]  AP fallback SSID: %s (timeout %us)\n", AP_SSID, AP_TIMEOUT_S);
  if (!wm.autoConnect(AP_SSID)) {
    Serial.println("[WiFi]  Failed/timeout — restarting");
    delay(2000);
    ESP.restart();
  }

  Serial.printf("[WiFi]  Connected. IP=%s RSSI=%d\n",
                WiFi.localIP().toString().c_str(), WiFi.RSSI());
  Serial.printf("[CFG]   server_url=%s\n", SERVER_URL);
  Serial.printf("[CFG]   node_id=%s\n",    NODE_ID);
  Serial.printf("[CFG]   api_key=%s\n",    String(API_KEY).length() ? "(set)" : "(missing)");
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println();
  Serial.println("PG Scarecrow — node-002");

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  pinMode(PIN_RS485_DE, OUTPUT);
  digitalWrite(PIN_RS485_DE, LOW);

  Serial2.begin(RS485_BAUD, SERIAL_8N1, PIN_RS485_RX, PIN_RS485_TX);

  phNode.begin(PH_SLAVE_ADDR, Serial2);
  phNode.preTransmission(preTransmission);
  phNode.postTransmission(postTransmission);

  connectWifi();

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
  delay(100);
}
