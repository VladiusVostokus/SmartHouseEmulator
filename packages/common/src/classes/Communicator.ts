import mqtt from "mqtt";
import type { ICommunicator } from "../interfaces/ICommunicator.js";
import type { Message, MessagePayload, TopicTemplate } from "../types.js";

interface DeviceState {
    status: string;
    lastUpdate: Date;
    data?: Record<string, unknown>;
}

export class MQTTCommunicator implements ICommunicator {
    private client: mqtt.MqttClient;
    private deviceStates: Map<string, DeviceState>;
    private readonly topicTemplates: TopicTemplate = {
        action: '/home/+/action',
        status: '/home/+/status'
    };

    constructor(broker: string) {
        this.deviceStates = new Map();
        
        this.client = mqtt.connect(broker, {
            clientId: 'backend-communicator'
        });

        // Підписуємось на всі статуси та дії пристроїв
        this.client.subscribe([this.topicTemplates.status, this.topicTemplates.action], (err) => {
            if (err) console.error("MQTT subscribe error:", err);
        });

        this.client.on('connect', () => {
            console.log('Backend connected to broker');
        });

        this.setupMessageHandler();
    }

    private setupMessageHandler(): void {
        this.client.on("message", (topic, message) => {
            try {
                const payload = JSON.parse(message.toString()) as MessagePayload;
                const deviceId = this.extractDeviceId(topic);
                
                if (topic.endsWith('/status')) {
                    this.updateDeviceState(deviceId, payload);
                }
                
                console.log(`Received message from ${deviceId} on topic: ${topic}`);
            } catch (error) {
                console.error('Error processing message:', error);
            }
        });
    }

    private extractDeviceId(topic: string): string {
        return topic.split('/')[2];
    }

    private updateDeviceState(deviceId: string, payload: MessagePayload): void {
        this.deviceStates.set(deviceId, {
            status: payload.status || 'unknown',
            lastUpdate: new Date(),
            data: payload
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
        console.log("Subscribe for topic:", topic);
    }

    publish(action: string, status: string): void {
        const payload = {
            action: action,
            status: status
        };
        this.client.publish(
            this.topicTemplates.action,
            JSON.stringify(payload)
        );
        console.log("Publish data to topic:", this.topicTemplates.action);
    }

    // Метод для обробки повідомлень з бекенду
    public handleBackendMessage(message: Message): void {
        const { deviceId, command, value } = message;
        
        // Формуємо payload у форматі, який очікують пристрої
        const payload = {
            cmd: command,
            arg: value?.toString() || value
        };

        // Відправляємо команду на відповідний топік
        const topic = this.topicTemplates.action.replace('+', deviceId);
        this.client.publish(topic, JSON.stringify(payload));
        console.log("Publish command to topic:", topic);
    }

    public getDeviceStatus(deviceId: string): string {
        return this.getDeviceState(deviceId)?.status || 'unknown';
    }
}