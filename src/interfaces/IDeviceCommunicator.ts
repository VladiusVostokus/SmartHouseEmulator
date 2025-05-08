import type mqtt from "mqtt";

export interface IDeviceCommunicator {
    sendMessage(device: string, payload: any): void;
    subscribe(device: string, onMessage: (data: any) => void): void;
    client: mqtt.MqttClient;
}