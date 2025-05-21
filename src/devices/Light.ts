import type { ICommunicator } from "../interfaces/ICommunicator.ts";
import type { IDevice } from "../interfaces/IDevice.ts";

export class Light implements IDevice {
  private name: string;
  private type: string;
  private isOn: boolean;
  private brightness: number = 100;
  private communicator: ICommunicator;

  constructor(name: string, communicator: ICommunicator) {
    this.name = name;
    this.type = "light";
    this.communicator = communicator;
    this.isOn = false;
  }

  private handlers: { [key: string]: (arg: string) => void } = {
      'turn': (arg: string) => {
        if (arg === "on") this.turnOn();
        else if (arg === "off") this.turnOff();
        else console.warn("Unknown turn action:", arg);
      },

      'setBrightness': (arg: string) => {
        try {
          const brightness = Number(arg);
          this.setBrightness(brightness);
        } catch (e) {
          console.error("Unknown brightness value:", e);
        }
      },
  };

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
  handleMessage(topic: string, message: Buffer) {
    let action;
    try {
      action = JSON.parse(message.toString());
    } catch {
      console.warn(`Invalid JSON on topic ${topic}:`, message.toString());
      return;
    }
    const { cmd, arg } = action;
    const command = this.handlers[cmd];
    if (command) {
       command(arg);
    }
  }
}