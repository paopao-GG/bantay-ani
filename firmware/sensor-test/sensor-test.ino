/*
 * PG Scarecrow — IoT Node Sensor Test
 *
 * Reads soil moisture (HW-103, analog on GPIO34) and soil pH
 * (SN-3000-TR-PH-NO1, Modbus-RTU over RS485 via MAX485) and
 * prints raw + scaled values to Serial @ 115200.
 *
 * Wiring: see ../../wiring-guide.md
 *
 * Library required: ModbusMaster  (install via Arduino Library Manager)
 *   https://github.com/4-20ma/ModbusMaster
 *
 * Board: "ESP32 Dev Module"
 */

#include <Arduino.h>
#include <ModbusMaster.h>

// ---------- Pins ----------
static const int PIN_MOIST_AOUT = 34;   // ADC1_CH6, input-only
static const int PIN_RS485_DE   = 4;    // DE + RE tied together
static const int PIN_RS485_RX   = 16;   // UART2 RX  <- MAX485 RO
static const int PIN_RS485_TX   = 17;   // UART2 TX  -> MAX485 DI

// ---------- Modbus ----------
static const uint8_t  PH_SLAVE_ADDR  = 0x01;
static const uint16_t PH_REG_ADDR    = 0x0006;   // holding register, pH ×100
static const uint32_t RS485_BAUD     = 4800;     // try 9600 if 4800 times out

// ---------- Moisture calibration ----------
// Capture these on YOUR sensor. HW-103 is INVERTED: lower raw = wetter.
// Procedure:
//   1) Probe in DRY AIR  -> read raw value -> set RAW_DRY
//   2) Probe in WATER     -> read raw value -> set RAW_WET
// Until calibrated, defaults below give a rough 0–100% mapping.
static int RAW_DRY = 3000;   // sensor in dry air
static int RAW_WET = 1200;   // sensor submerged in water

ModbusMaster phNode;

void preTransmission()  { digitalWrite(PIN_RS485_DE, HIGH); }
void postTransmission() { digitalWrite(PIN_RS485_DE, LOW);  }

float readMoisturePct() {
  // Average 10 samples for stability
  uint32_t acc = 0;
  const int N = 10;
  for (int i = 0; i < N; i++) {
    acc += analogRead(PIN_MOIST_AOUT);
    delay(5);
  }
  int raw = acc / N;

  // Linear map; HW-103 is inverted (dry = high raw, wet = low raw)
  float pct = 100.0f * (float)(RAW_DRY - raw) / (float)(RAW_DRY - RAW_WET);
  if (pct < 0)   pct = 0;
  if (pct > 100) pct = 100;

  Serial.printf("[MOIST] raw=%d -> %.1f %%\n", raw, pct);
  return pct;
}

bool readPh(float &phOut, uint16_t &rawOut) {
  uint8_t result = phNode.readHoldingRegisters(PH_REG_ADDR, 1);
  if (result == phNode.ku8MBSuccess) {
    rawOut = phNode.getResponseBuffer(0);
    phOut  = rawOut / 100.0f;
    Serial.printf("[pH]    raw=0x%04X -> pH %.2f\n", rawOut, phOut);
    return true;
  } else {
    Serial.printf("[pH]    Modbus error 0x%02X\n", result);
    return false;
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println();
  Serial.println("PG Scarecrow — sensor test");

  // ADC
  analogReadResolution(12);                 // 0..4095
  analogSetAttenuation(ADC_11db);           // ~0..3.3 V input range

  // RS485 direction pin
  pinMode(PIN_RS485_DE, OUTPUT);
  digitalWrite(PIN_RS485_DE, LOW);          // start in receive mode

  // UART2 -> MAX485
  Serial2.begin(RS485_BAUD, SERIAL_8N1, PIN_RS485_RX, PIN_RS485_TX);

  // Modbus
  phNode.begin(PH_SLAVE_ADDR, Serial2);
  phNode.preTransmission(preTransmission);
  phNode.postTransmission(postTransmission);

  Serial.println("Setup done. Sampling every 3 s...");
}

void loop() {
  Serial.println("----");

  readMoisturePct();

  float ph;
  uint16_t phRaw;
  readPh(ph, phRaw);

  delay(3000);
}
