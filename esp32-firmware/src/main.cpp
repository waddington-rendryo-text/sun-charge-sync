// ============================================================
// EV Charger — Firmware ESP32-S3
// LCD I2C + HC-SR04 (distância) + Relé do carregador
// O botão físico foi SUBSTITUÍDO pelo comando vindo do app web:
// o app grava `stations.charge_enabled` e a Edge Function
// `ingest-sensor-data` devolve esse valor a cada POST.
// ============================================================

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>

#include "config.h"

LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);

// ---------- estado ----------
static bool carregadorConectado = false;
static unsigned long lastPostMs = 0;
static unsigned long lastSampleMs = 0;
static double energyKwh = 0.0;
static int  ultimaDistancia = 999;

// =====================================
// Wi-Fi
// =====================================
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

// =====================================
// Sensores
// =====================================
static int medirDistancia() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duracao = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duracao == 0) return 999;
  return (int)(duracao * 0.034 / 2);
}

// Sem sensores reais de tensão/corrente conectados ainda — enviamos zeros
// (a edge function aceita). Quando você plugar os sensores, troque estas
// funções pelas leituras reais (ACS712, divisor resistivo, etc).
static float readVoltage()     { return 0.0f; }
static float readCurrent()     { return 0.0f; }
static float readTemperature() { return 25.0f; }

// =====================================
// Relé / LCD
// =====================================
static void conectarCarregador() {
  digitalWrite(RELE_PIN, HIGH);
  carregadorConectado = true;
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Carregador");
  lcd.setCursor(0, 1); lcd.print("Conectado");
  Serial.println("[rele] LIGADO");
}

static void desconectarCarregador() {
  digitalWrite(RELE_PIN, LOW);
  carregadorConectado = false;
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Carregador");
  lcd.setCursor(0, 1); lcd.print("Desconectado");
  Serial.println("[rele] DESLIGADO");
  delay(1200);
  lcd.clear();
}

static void mostrarDistanciaNoLCD(int distancia) {
  if (carregadorConectado) return;
  lcd.setCursor(0, 0);
  lcd.print("Dist:");
  if (distancia < 100) lcd.print(" ");
  if (distancia < 10)  lcd.print(" ");
  lcd.print(distancia);
  lcd.print("cm ");
  lcd.setCursor(0, 1);
  if (distancia >= DISTANCIA_MINIMA_CM && distancia < 200) {
    lcd.print("Pronto p/ web   ");
  } else if (distancia < DISTANCIA_MINIMA_CM) {
    lcd.print("Muito perto!    ");
  } else {
    lcd.print("Sem veiculo     ");
  }
}

// =====================================
// POST + leitura do comando do app
// =====================================
static void sendReadingAndApplyCommand(int distancia) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  float voltage = readVoltage();
  float current = readCurrent();
  float power   = voltage * current;
  float temp    = readTemperature();
  bool  vehicle = (distancia >= DISTANCIA_MINIMA_CM && distancia < 200);
  const char* status =
      carregadorConectado ? "charging" : (vehicle ? "idle" : "idle");

  WiFiClientSecure client;
  client.setInsecure();   // produção: client.setCACert(...)

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
  doc["energy_kwh"]       = energyKwh;
  doc["temperature"]      = temp;
  doc["vehicle_detected"] = vehicle;
  doc["charging_status"]  = status;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  String resp = http.getString();
  Serial.printf("[post] %d %s\n", code, resp.c_str());

  if (code == 200) {
    JsonDocument respDoc;
    if (deserializeJson(respDoc, resp) == DeserializeError::Ok) {
      bool wantCharge = respDoc["charge_enabled"] | false;

      // Aplica o comando do app, respeitando a distância mínima.
      if (wantCharge && !carregadorConectado) {
        if (vehicle) {
          conectarCarregador();
        } else {
          lcd.clear();
          lcd.setCursor(0, 0); lcd.print("Distancia < 2cm");
          lcd.setCursor(0, 1); lcd.print("Posicione o carro");
          delay(1200);
          lcd.clear();
        }
      } else if (!wantCharge && carregadorConectado) {
        desconectarCarregador();
      }
    }
  }
  http.end();
}

// =====================================
// Arduino
// =====================================
void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== EV Charger ESP32-S3 ===");

  Wire.begin(I2C_SDA, I2C_SCL);
  lcd.init();
  lcd.backlight();
  lcd.clear();

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELE_PIN, OUTPUT);
  digitalWrite(RELE_PIN, LOW);

  lcd.setCursor(0, 0); lcd.print("Sistema Pronto");
  lcd.setCursor(0, 1); lcd.print("Conectando WiFi");
  connectWifi();
  lcd.clear();

  lastSampleMs = millis();
}

void loop() {
  unsigned long now = millis();

  // mede distância e atualiza LCD
  ultimaDistancia = medirDistancia();
  mostrarDistanciaNoLCD(ultimaDistancia);

  // integra energia (placeholder enquanto sensores não estão ligados)
  if (now - lastSampleMs >= 250) {
    float v = readVoltage();
    float i = readCurrent();
    double dtH = (now - lastSampleMs) / 3600000.0;
    energyKwh += ((v * i) / 1000.0) * dtH;
    lastSampleMs = now;
  }

  // envia telemetria + consulta comando do app
  if (now - lastPostMs >= POST_INTERVAL_MS) {
    lastPostMs = now;
    sendReadingAndApplyCommand(ultimaDistancia);
  }

  delay(100);
}
