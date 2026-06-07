## Código de exemplo ESP32-S3 (PlatformIO/Arduino)

Vou criar uma pasta `esp32-firmware/` na raiz do projeto contendo o firmware C++ pronto para abrir no VS Code com a extensão PlatformIO. Ele será **independente do app web** (não interfere no build do Vite), servindo apenas como referência/código-fonte do dispositivo.

### Estrutura criada

```text
esp32-firmware/
├── platformio.ini          # board esp32-s3-devkitc-1, libs ArduinoJson
├── src/
│   └── main.cpp            # loop principal: lê sensores e faz POST
├── include/
│   └── config.h.example    # template de Wi-Fi + token (copiar p/ config.h)
└── README.md               # instruções de flash e uso
```

### O que o firmware faz

1. Conecta no Wi-Fi (SSID/senha em `config.h`).
2. A cada 5 s (intervalo configurável) lê:
   - Tensão (ADC + divisor resistivo) — placeholder
   - Corrente (sensor ACS712/SCT-013) — placeholder
   - Temperatura (NTC ou DS18B20) — placeholder
   - Detecção de veículo (GPIO digital)
   - Energia acumulada (integração potência × Δt)
3. Calcula `charging_status` (`idle` / `charging` / `complete` / `error`) a partir da corrente e do estado do veículo.
4. Faz `POST` para:
   ```
   https://ipwaubkilerjuzltnmax.supabase.co/functions/v1/ingest-sensor-data
   ```
   com cabeçalhos:
   - `Content-Type: application/json`
   - `X-Device-Token: <token da station_secrets>`
   - `apikey: <anon key>` (necessário no gateway do Supabase)
   
   E corpo JSON respeitando exatamente os ranges validados pela edge function:
   ```json
   {
     "voltage": 220.5,
     "current": 12.3,
     "power": 2712.1,
     "energy_kwh": 0.045,
     "temperature": 38.2,
     "vehicle_detected": true,
     "charging_status": "charging"
   }
   ```
5. Reconecta Wi-Fi automaticamente e faz log serial das respostas HTTP.

### Detalhes técnicos

- **Framework**: Arduino-ESP32 via PlatformIO (mais simples que ESP-IDF puro).
- **Libs**: `WiFi.h`, `HTTPClient.h`, `WiFiClientSecure.h` (HTTPS), `ArduinoJson@^7`.
- **TLS**: usa `client.setInsecure()` no exemplo (simplicidade); README explica como fixar o root CA para produção.
- **Pinos**: definidos como `#define` no topo de `main.cpp` para você ajustar ao seu hardware.
- **Sem segredos no repo**: `config.h` fica no `.gitignore`; só `config.h.example` é versionado.

### Próximos passos sugeridos (não incluídos agora)

- OTA updates
- Modo deep-sleep entre leituras
- Buffer local quando offline

Confirma que sigo e crio esses arquivos?
