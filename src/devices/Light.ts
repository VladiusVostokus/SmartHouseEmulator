import type { ICommunicator } from "../interfaces/ICommunicator.ts";
import type { IDevice } from "../interfaces/IDevice.ts";

export class Light implements IDevice {
  private name: string;
  private type: string;
  private isOn: boolean;
  private communicator: ICommunicator;
  private brightness: number = 100;

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
  setBrightness(level: number): void {
    if (level < 0 || level > 100) return;
    this.brightness = level;
  }
  getBrightness(): number {
    return this.brightness;
  }
}