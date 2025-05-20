// src/devices/LightDevice.ts
import mqtt, { MqttClient } from "mqtt";

export interface LightConfig {
  brokerUrl: string;
  deviceId: string;
}

export class LightDevice {
  private client: MqttClient;
  private turnTopic: string;
  private brightnessTopic: string;
  private energyTopic: string;

  private isOn = false;
  private brightness = 0;
  private energyMode = "normal";

  constructor(private config: LightConfig) {
    const { brokerUrl, deviceId } = config;

    // Задаём топіки
    this.turnTopic = `/home/${deviceId}/turnLight`;
    this.brightnessTopic = `/home/${deviceId}/brightness`;
    this.energyTopic = `/home/${deviceId}/energyMode`;

    // Підключаємося до брокера
    this.client = mqtt.connect(brokerUrl);

    // Підписуємося на топіки команд
    this.client.on("connect", () => {
      this.client.subscribe(this.turnTopic);
      this.client.subscribe(this.brightnessTopic);
      this.client.subscribe(this.energyTopic);
      console.log("LightDevice connected and subscribed");
    });

    // Ловимо всі вхідні повідомлення
    this.client.on("message", (topic, payload) => {
      const msg = payload.toString();
      try {
        const data = JSON.parse(msg);
        this.handleMessage(topic, data);
      } catch {
        console.warn("Invalid JSON:", msg);
      }
    });
  }

  private handleMessage(topic: string, msg: any) {
    if (topic === this.turnTopic) {
      if (msg.action === "on") this.turnOn();
      else if (msg.action === "off") this.turnOff();
      else console.warn("Unknown turn action:", msg.action);
    } else if (topic === this.brightnessTopic) {
      if (typeof msg.brightness === "number") {
        this.setBrightness(msg.brightness);
      } else {
        console.warn("Invalid brightness value:", msg.brightness);
      }
    } else if (topic === this.energyTopic) {
      if (typeof msg.mode === "string") {
        this.setEnergyMode(msg.mode);
      } else {
        console.warn("Invalid energy mode:", msg.mode);
      }
    } else {
      console.warn("Received on unknown topic:", topic);
    }
  }

  // Методи логіки пристрою

  private turnOn() {
    this.isOn = true;
    console.log("Light turned ON");
    this.publishStatus({ action: "status", on: this.isOn });
  }

  private turnOff() {
    this.isOn = false;
    console.log("Light turned OFF");
    this.publishStatus({ action: "status", on: this.isOn });
  }

  private setBrightness(level: number) {
    this.brightness = level;
    console.log("Brightness set to", level);
    this.publishStatus({
      action: "brightnessChanged",
      brightness: this.brightness,
    });
  }

  private setEnergyMode(mode: string) {
    this.energyMode = mode;
    console.log("Energy mode set to", mode);
    this.publishStatus({ action: "modeChanged", mode: this.energyMode });
  }

  // Публікуємо статус назад у MQTT
  private publishStatus(payload: any) {
    const statusTopic = `/home/${this.config.deviceId}/status`;
    this.client.publish(statusTopic, JSON.stringify(payload));
  }
}
