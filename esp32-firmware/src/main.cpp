// ============================================================
// EV Charger — Firmware ESP32-S3
// Envia leituras dos sensores para a Edge Function `ingest-sensor-data`
// (Lovable Cloud / Supabase) via HTTPS POST autenticado.
// ============================================================

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#include "config.h"   // copie config.h.example -> config.h

// ---------- estado acumulado ----------
static unsigned long lastPostMs = 0;
static double energyKwh = 0.0;            // integração potência x tempo
static unsigned long lastSampleMs = 0;

// ---------- helpers ----------
static void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("[wifi] conectando em %s ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) {
    delay(250);
    Serial.print('.');
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[wifi] OK ip=%s rssi=%d\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("[wifi] FALHA");
  }
}

// Leitura de tensão via divisor resistivo.
// Ajuste FACTOR_V conforme seu divisor (Vreal = Vadc * FACTOR_V).
static float readVoltage() {
  const float FACTOR_V = 100.0f;   // exemplo: divisor 1:100
  int raw = analogRead(PIN_VOLTAGE);
  float vadc = (raw / 4095.0f) * 3.3f;
  return vadc * FACTOR_V;
}

// Leitura de corrente — exemplo p/ ACS712 30A (66 mV/A, offset 1.65V).
static float readCurrent() {
  const float SENS_V_PER_A = 0.066f;
  const float OFFSET_V     = 1.65f;
  int raw = analogRead(PIN_CURRENT);
  float vadc = (raw / 4095.0f) * 3.3f;
  return (vadc - OFFSET_V) / SENS_V_PER_A;
}

// Leitura de temperatura — placeholder simples. Troque por DS18B20 se preferir.
static float readTemperature() {
  int raw = analogRead(PIN_TEMP);
  float vadc = (raw / 4095.0f) * 3.3f;
  // mapeamento bruto -50..150C apenas para exemplo
  return (vadc / 3.3f) * 200.0f - 50.0f;
}

static bool readVehicleDetected() {
  return digitalRead(PIN_VEHICLE) == HIGH;
}

static const char* classifyStatus(float current, bool vehicle, float temperature) {
  if (temperature > 80.0f) return "error";
  if (!vehicle)            return "idle";
  if (fabsf(current) > 0.5f) return "charging";
  return "complete";
}

// Faz o POST autenticado para a Edge Function.
static void sendReading(float voltage, float current, float power,
                        double energy, float temperature,
                        bool vehicle, const char* status) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  WiFiClientSecure client;
  client.setInsecure();   // PRODUÇÃO: fixe o root CA do Supabase.

  HTTPClient http;
  if (!http.begin(client, INGEST_URL)) {
    Serial.println("[http] begin() falhou");
    return;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

  JsonDocument doc;
  doc["voltage"]          = voltage;
  doc["current"]          = current;
  doc["power"]            = power;
  doc["energy_kwh"]       = energy;
  doc["temperature"]      = temperature;
  doc["vehicle_detected"] = vehicle;
  doc["charging_status"]  = status;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  String resp = http.getString();
  Serial.printf("[post] %d %s\n", code, resp.c_str());
  http.end();
}

// ---------- Arduino ----------
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== EV Charger ESP32-S3 ===");

  pinMode(PIN_VEHICLE, INPUT_PULLDOWN);
  analogReadResolution(12);

  connectWifi();
  lastSampleMs = millis();
}

void loop() {
  unsigned long now = millis();

  // amostragem rápida apenas para integrar energia
  if (now - lastSampleMs >= 250) {
    float v = readVoltage();
    float i = readCurrent();
    float p = v * i;
    double dtH = (now - lastSampleMs) / 3600000.0;  // ms -> h
    energyKwh += (p / 1000.0) * dtH;
    lastSampleMs = now;
  }

  if (now - lastPostMs >= POST_INTERVAL_MS) {
    lastPostMs = now;

    float voltage = readVoltage();
    float current = readCurrent();
    float power   = voltage * current;
    float temp    = readTemperature();
    bool  vehicle = readVehicleDetected();
    const char* status = classifyStatus(current, vehicle, temp);

    Serial.printf("V=%.2f I=%.2f P=%.2f E=%.4f T=%.1f veh=%d status=%s\n",
                  voltage, current, power, energyKwh, temp, vehicle, status);

    sendReading(voltage, current, power, energyKwh, temp, vehicle, status);
  }
}
