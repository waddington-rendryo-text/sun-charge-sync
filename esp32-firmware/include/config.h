// Copie este arquivo para `config.h` e preencha com seus valores.
// `config.h` está no .gitignore — NUNCA versione segredos.
#pragma once

// ===== Wi-Fi =====
#define WIFI_SSID       "Waddis"
#define WIFI_PASSWORD   "waddi2318"

// ===== Lovable Cloud / Supabase =====
#define INGEST_URL      "https://ipwaubkilerjuzltnmax.supabase.co/functions/v1/ingest-sensor-data"
#define SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwd2F1YmtpbGVyanV6bHRubWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzUwNjgsImV4cCI6MjA4OTQ1MTA2OH0.qxJER33dai-BhaX1oWAL4DrXlhFS9W3cXsOL0Cd17uc"
#define DEVICE_TOKEN    "a7bcd1f33ad2b0a029fd3e363e5b4008e165d9f68892d010"

// ===== Intervalos =====
#define POST_INTERVAL_MS 3000   // envia leituras e consulta comando a cada 3s

// ===== Pinos (ESP32-S3 DevKitC-1) =====
// I2C do LCD
#define I2C_SDA   8
#define I2C_SCL   9

// HC-SR04
#define TRIG_PIN  12
#define ECHO_PIN  14

// Relé do carregador
#define RELE_PIN  7

// LCD
#define LCD_ADDR   0x27
#define LCD_COLS   16
#define LCD_ROWS   2

// Distância mínima (cm) para liberar o carregamento
#define DISTANCIA_MINIMA_CM 2
