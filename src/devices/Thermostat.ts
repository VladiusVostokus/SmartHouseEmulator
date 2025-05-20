import type { ICommunicator } from "../interfaces/ICommunicator.ts";
import type { IDevice } from "../interfaces/IDevice.ts";

export class Thermostat implements IDevice {
  private name: string;
  private type: string;
  private isOn: boolean;
  private communicator: ICommunicator;
  private temperature: number = 22;

  constructor(name: string, communicator: ICommunicator) {
    this.name = name;
    this.type = "light";
    this.communicator = communicator;
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
  setTemperature(temp: number): void {
    if (temp < 16 || temp > 35) return;
    this.temperature = temp;
  }
  getTemperature(): number {
    return this.temperature;
  }
}
