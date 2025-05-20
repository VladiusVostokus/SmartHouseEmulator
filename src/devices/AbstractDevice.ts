// src/devices/AbstractDevice.ts
import mqtt, { MqttClient } from "mqtt";

export interface DeviceConfig {
  brokerUrl: string;
  deviceId: string;
}

/**
 * Template Method: defines connect → subscribe → message handling → status publish
 */
export abstract class AbstractDevice {
  protected client: MqttClient;

  constructor(protected config: DeviceConfig) {
    this.client = mqtt.connect(config.brokerUrl);

    // 1) once connected, subscribe to all the topics this device cares about
    this.client.on("connect", () => {
      console.log(`${this.constructor.name} connected`);
      for (const t of this.commandTopics()) {
        this.client.subscribe(t, (err) => {
          if (err) console.error("Subscribe error", t, err);
        });
      }
    });

    // 2) on every MQTT message, parse JSON and delegate
    this.client.on("message", (topic, raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return console.warn("Invalid JSON on", topic, raw.toString());
      }
      this.handleCommand(topic, msg);
    });
  }

  /** Subclasses return the list of “command” topics to subscribe to */
  protected abstract commandTopics(): string[];

  /**
   * Subclasses implement exactly what to do for each (topic, msg) pair.
   * E.g. call turnOn(), or emit an event, etc.
   */
  protected abstract handleCommand(topic: string, msg: any): void;

  /** Utility: publish back status to `/home/{id}/status` */
  protected publishStatus(payload: any) {
    const topic = `/home/${this.config.deviceId}/status`;
    this.client.publish(topic, JSON.stringify(payload));
  }
}
