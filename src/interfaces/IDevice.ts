import type { ICommunicator } from "./ICommunicator.js";

export interface IDevice{
    name: string;
    type: string;
    isOn: boolean;
    communicator: ICommunicator;
    subscribe(topic: string): void;
    publish(topic: string): void;
    turnOn(): void;
    turnOff(): void;
}