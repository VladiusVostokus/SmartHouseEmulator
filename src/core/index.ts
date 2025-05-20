// src/index.ts
import { LightDevice, type LightConfig } from "../devices/LightDevice.js";
import { startHttpServer } from "./server.js";

async function bootstrap() {
  // 1) Instantiate as many emulated lights as you like:
  const configs: LightConfig[] = [
    { brokerUrl: "mqtt://localhost:1883", deviceId: "lamp1" },
    { brokerUrl: "mqtt://localhost:1883", deviceId: "lamp2" },
    // add more if needed…
  ];
  for (const cfg of configs) {
    new LightDevice(cfg);
  }

  // 2) Then start your HTTP→MQTT server
  startHttpServer();
}

bootstrap().catch((err) => {
  console.error("❌ Failed to bootstrap:", err);
  process.exit(1);
});
