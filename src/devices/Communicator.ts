import mqtt from "mqtt";
import type { ICommunicator } from "../interfaces/ICommunicator.js";

export class MQTTCommunicator implements ICommunicator {
    private client: mqtt.MqttClient;
    private topics: Map<string, string>;
    private clientId: string;

    constructor(topics: Map<string, string>, clientId: string, brocker: string) {
        this.clientId = clientId;
        const willMessage = {
            topic: `/home/${this.clientId}/status`,
            payload: JSON.stringify({ status: 'offline' }),
            retain: true,
        };
        this.client = mqtt.connect(brocker, {
            clientId: this.clientId,
            will: willMessage
        });
        this.topics = topics;
        for (const topic of this.topics) {
            this.subscribe(topic[1], (err) => {
                if (err) console.error("MQTT subscribe error:", err);
            });
        }
        this.client.on('connect', () => {
            console.log('Connected to broker');
            this.client.publish(`/home/${this.clientId}/status`, 
                JSON.stringify({ clientId: this.clientId, status: 'online' }), {
                qos: 1,
                retain: true
            }); 
        });
    }

    subscribe(topic: string, onMessage: (data: unknown) => void): void {
        this.client.subscribe(topic, onMessage)
    }

    publish(action: string, status: string): void {
        const topic = this.topics.get(action);
        if (!topic) {
            return;
        }
        const payload = {
            'action':action,
            'status':status,
        };
        this.client.publish(topic, JSON.stringify(payload));
    }

    listen(handler: (arg0: string, arg1: Buffer) => void) {
        this.client.on("message", (topic, message) => {
            handler(topic, message);
        });
    }
}