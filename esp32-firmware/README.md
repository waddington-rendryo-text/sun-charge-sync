# Firmware ESP32-S3 — EV Charger

Firmware de exemplo que lê sensores (tensão, corrente, temperatura, presença de veículo) e envia as leituras para a Edge Function `ingest-sensor-data` do app web (Lovable Cloud / Supabase).

> Esta pasta é **independente** do app React. O Vite não a compila — ela serve apenas para abrir no VS Code com PlatformIO.

## Pré-requisitos

1. [VS Code](https://code.visualstudio.com/)
2. Extensão **PlatformIO IDE**
3. Driver USB do ESP32-S3 (CP210x ou CH343, depende da placa)

## Passo a passo

1. Abra **apenas** a pasta `esp32-firmware/` no VS Code (`File → Open Folder…`).
2. Copie `include/config.h.example` para `include/config.h`.
3. Edite `config.h`:
   - `WIFI_SSID` / `WIFI_PASSWORD` — sua rede Wi-Fi 2.4 GHz.
   - `DEVICE_TOKEN` — abra o app, vá no painel do posto, clique **"Copiar token"** da estação e cole aqui.
4. Conecte o ESP32-S3 por USB.
5. Na barra inferior do PlatformIO clique em **Upload** (seta →) e depois em **Monitor** (tomada).

Você deve ver no monitor serial:

```
[wifi] OK ip=192.168.x.x rssi=-55
V=220.42 I=12.10 P=2666.92 E=0.0037 T=38.1 veh=1 status=charging
[post] 200 {"ok":true,"station_id":"..."}
```

E os dados aparecem em tempo real no dashboard do posto.

## Mapeamento de pinos (padrão)

| Função              | GPIO |
|---------------------|------|
| Tensão (ADC)        | 1    |
| Corrente (ADC)      | 2    |
| Temperatura (ADC)   | 3    |
| Detecção de veículo | 4    |

Altere os `#define PIN_*` em `config.h` se seu hardware usar outros pinos.

## Calibração

- **Tensão**: ajuste `FACTOR_V` em `readVoltage()` conforme o seu divisor resistivo.
- **Corrente**: o exemplo usa ACS712 30A (66 mV/A, offset 1,65 V). Para outros sensores ajuste `SENS_V_PER_A` e `OFFSET_V`.
- **Temperatura**: o exemplo é um mapeamento linear bruto. Para precisão use um DS18B20 (lib `OneWire` + `DallasTemperature`).

## Segurança

- `config.h` está no `.gitignore` para o token não vazar.
- O firmware usa `client.setInsecure()` por simplicidade. **Em produção**, fixe o root CA do Supabase (ISRG Root X1) com `client.setCACert(...)`.
- A edge function valida ranges (tensão 0–500 V, corrente ±1000 A, temperatura −50 a 200 °C) e o `X-Device-Token`. Leituras fora desses limites são rejeitadas com 400.

## Próximos passos sugeridos

- Deep-sleep entre amostras para economia de energia
- Buffer local (SPIFFS/NVS) para reenvio quando o Wi-Fi cair
- Atualização OTA via `ArduinoOTA`
