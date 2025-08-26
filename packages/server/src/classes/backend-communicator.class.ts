import mqtt from "mqtt";
import type {
  ICommunicator,
  Message,
  MessagePayload,
  TopicTemplate,
} from "@smart-house/common";
import type { DeviceState } from "../interfaces/device-state.interface";

export class BackendCommunicator implements ICommunicator {
  private client: mqtt.MqttClient;
  private deviceStates: Map<string, DeviceState>;
  private readonly topicTemplates: TopicTemplate = {
    action: "/home/+/action",
    status: "/home/+/status",
  };
  private lightSensorLinks: Map<string, string>;

  constructor(broker: string) {
    this.deviceStates = new Map();
    this.lightSensorLinks = new Map();

    this.client = mqtt.connect(broker, {
      clientId: "backend-communicator",
    });

    // Підписуємось на всі статуси та дії пристроїв
    this.client.subscribe(
      [this.topicTemplates.status, this.topicTemplates.action],
      (err) => {
        if (err) console.error("MQTT subscribe error:", err);
      },
    );

    this.client.on("connect", () => {
      console.log("Backend connected to broker");
    });

    this.setupMessageHandler();
  }

  private setupMessageHandler(): void {
    this.client.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString()) as MessagePayload;
        const deviceId = this.extractDeviceId(topic);

        if (topic.endsWith("/status")) {
          this.updateDeviceState(deviceId, payload);
        }

        console.log(`Received message from ${deviceId} on topic: ${topic}`);
        console.log("Message content:", payload);
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });
  }

  private extractDeviceId(topic: string): string {
    return topic.split("/")[2];
  }

  private updateDeviceState(deviceId: string, payload: MessagePayload): void {
    if (payload.status.status === "offline") {
      this.deviceStates.delete(deviceId);
      return;
    }
    if (payload.status.value === "DETECTED") {
      const lightPayload = {
        cmd: "turn",
        arg: "on",
      };
      const lightId = this.lightSensorLinks.get(deviceId);
      if (lightId) {
        const lightTopic = this.topicTemplates.action.replace("+", lightId);
        this.client.publish(lightTopic, JSON.stringify(lightPayload));
      }
    }
    this.deviceStates.set(deviceId, {
      status: payload.status.status || "unknown",
      lastUpdate: new Date(),
      data: payload,
    });
  }

  public getDeviceState(deviceId: string): DeviceState | undefined {
    return this.deviceStates.get(deviceId);
  }

  // Реалізація інтерфейсу ICommunicator
  subscribe(topic: string, onMessage: (data: unknown) => void): void {
    this.client.subscribe(topic, (err) => {
      if (err) console.error("MQTT subscribe error:", err);
    });
    this.client.on("message", (receivedTopic, message) => {
      if (receivedTopic === topic) {
        try {
          const data = JSON.parse(message.toString());
          onMessage(data);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      }
    });
    console.log("Subscribe for topic:", topic);
  }

  publish(action: string, status: string): void {
    const payload = {
      action: action,
      status: status,
    };
    this.client.publish(this.topicTemplates.action, JSON.stringify(payload));
    console.log("Publish data to topic:", this.topicTemplates.action);
  }

  // Метод для обробки повідомлень з бекенду
  public handleBackendMessage(message: Message): void {
    const { deviceId, command, value } = message;

    const payload = {
      cmd: command,
      arg: value?.toString() || value,
    };

    const topic = this.topicTemplates.action.replace("+", deviceId);
    this.client.publish(topic, JSON.stringify(payload));
    console.log("Publish command to topic:", topic);
  }

  public createLink(sensorId: string, lightId: string) {
    this.lightSensorLinks.set(sensorId, lightId);
    console.log(`Link ${lightId} to ${sensorId}`);
  }

  public deleteLink(sensorId: string): boolean {
    const lightId = this.lightSensorLinks.get(sensorId);
    const deletedSuccessfully = this.lightSensorLinks.delete(sensorId);
    if (!deletedSuccessfully)
      console.error(
        "Can not delete link with ",
        sensorId,
        ": link does not exist",
      );
    else console.log(`Delete link ${lightId} and ${sensorId}`);
    return deletedSuccessfully;
  }

  public getDeviceStatus(deviceId: string): string {
    return this.getDeviceState(deviceId)?.status || "unknown";
  }
}
