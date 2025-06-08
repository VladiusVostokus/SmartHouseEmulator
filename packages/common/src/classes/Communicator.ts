import mqtt from "mqtt";
import type { ICommunicator } from "../interfaces/ICommunicator.js";

export class MQTTCommunicator implements ICommunicator {
  private client: mqtt.MqttClient;
  private clientId: string;

  constructor(topics: string[], clientId: string, brocker: string) {
    this.clientId = clientId;
    const willMessage = {
      topic: `/home/${this.clientId}/status`,
      payload: JSON.stringify({ status: "offline" }),
      retain: true,
    };
    this.client = mqtt.connect(brocker, {
      clientId: this.clientId,
      will: willMessage,
    });

    this.client.subscribe(topics, (err) => {
      if (err) console.error("MQTT subscribe error:", err);
    });
    
    this.client.on("connect", () => {
      console.log("Connected to broker");
      this.client.publish(
        `/home/${this.clientId}/status`,
        JSON.stringify({ clientId: this.clientId, status: "online" }),
        {
          qos: 1,
          retain: true,
        },
      );
    });
  }

  subscribe(topic: string, onMessage: (data: unknown) => void): void {
    this.client.subscribe(topic, onMessage);
    console.log("Subscribe for topic:", topic);
  }

  publish(action: string, status: string): void {
    const payload = {
      clientId: this.clientId,
      action: action,
      status: status,
    };
    this.client.publish(
      `/home/${this.clientId}/action`,
      JSON.stringify(payload),
    );
    console.log("Publish data to topic:", `/home/${this.clientId}/action`);
  }

  listen(handler: (arg0: string, arg1: Buffer) => void) {
    this.client.on("message", (topic, message) => {
      handler(topic, message);
      console.log("Get message form topic:", topic);
    });
  }
}