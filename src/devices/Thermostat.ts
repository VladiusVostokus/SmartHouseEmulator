import type { ICommunicator } from "../interfaces/ICommunicator.js";
import type { IDevice } from "../interfaces/IDevice.js";

export class Thermostat implements IDevice {
    private name: string;
    private type: string;
    private isOn: boolean;
    private communicator: ICommunicator;

    constructor(name: string, communicator: ICommunicator) {
        this.name = name;
        this.type = "light";
        this.communicator = communicator
        this.isOn = false;
    }

    subscribe(topic: string): void {
        throw new Error("Method not implemented.");
    }
    publish(topic: string): void {
        throw new Error("Method not implemented.");
    }
    turnOn(): void {
        this.isOn = true;
    }
    turnOff(): void {
        this.isOn = false;
    }
}