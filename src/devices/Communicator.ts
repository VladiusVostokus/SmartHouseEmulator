import mqtt from "mqtt";
import type { ICommunicator } from "../interfaces/ICommunicator.js";

export class MQTTCommunicator implements ICommunicator {
    private client: mqtt.MqttClient;
    private topics: string[];

    constructor(topics: string[], brocker: string) {
        this.client = mqtt.connect(brocker);
        this.topics = topics;
        for (const topic of this.topics) {
            this.subscribe(topic, (err) => {
                if (err) console.error("MQTT subscribe error:", err);
            });
        }
    }

    subscribe(topic: string, onMessage: (data: any) => void): void {
        this.client.subscribe(topic, onMessage)
    }

    publish(device: string, payload: any): void {
        this.client.publish(device, payload);
    }

    listen(handler: (arg0: string, arg1: Buffer) => void) {
        this.client.on("message", (topic, message) => {
            handler(topic, message);
        });
    }
}