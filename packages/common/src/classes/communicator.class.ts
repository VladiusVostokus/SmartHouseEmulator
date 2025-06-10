import mqtt from "mqtt";
import type { ICommunicator, TopicTemplate } from "@smart-house/common";

export class MQTTCommunicator implements ICommunicator {
  private client: mqtt.MqttClient;
  private clientId: string;
  private topics: TopicTemplate = {
    action: '',
    status: '',
  };

  constructor(topics: string[], clientId: string, brocker: string) {
    this.clientId = clientId;

    this.topics['action'] = topics[0].replace('+',clientId);
    this.topics['status'] = topics[1].replace('+',clientId);

    const willMessage = {
      topic: this.topics['status'],
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
        this.topics['status'],
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
      this.topics['action'],
      JSON.stringify(payload),
    );
    console.log("Publish data to topic:", this.topics['action']);
  }

  listen(handler: (arg0: string, arg1: Buffer) => void) {
    this.client.on("message", (topic, message) => {
      handler(topic, message);
      console.log("Get message form topic:", topic);
    });
  }
}
