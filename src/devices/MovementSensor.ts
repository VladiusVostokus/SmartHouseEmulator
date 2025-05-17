import type { ICommunicator } from "../interfaces/ICommunicator.ts";
import type { IDevice } from "../interfaces/IDevice.ts";

export class MovementSensor implements IDevice {
  private name: string;
  private type: string;
  private isOn: boolean;
  private communicator: ICommunicator;

  constructor(name: string, communicator: ICommunicator) {
    this.name = name;
    this.type = "movementSensor";
    this.communicator = communicator;
    this.isOn = false;
  }

  subscribe(): void {
    throw new Error("Method not implemented.");
  }
  publish(): void {
    throw new Error("Method not implemented.");
  }
  turnOn(): void {
    this.isOn = true;
  }
  turnOff(): void {
    this.isOn = false;
  }
}
