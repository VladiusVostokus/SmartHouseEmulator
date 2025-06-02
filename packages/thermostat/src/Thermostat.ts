import type { ICommunicator, IDevice } from "@smart-house/common";

export class Thermostat implements IDevice {
  private name: string;
  private type: string;
  private isOn: boolean;
  private communicator: ICommunicator;
  private temperature: number = 22;
  private curTemperature: number = 22;

  constructor(name: string, communicator: ICommunicator) {
    this.name = name;
    this.type = "thermo";
    this.communicator = communicator;
    this.isOn = false;
  }

  private handlers: { [key: string]: (arg: string) => void } = {
    turn: (arg: string) => {
      if (arg === "on") this.turnOn();
      else if (arg === "off") this.turnOff();
      else console.warn("Unknown turn action:", arg);
    },

    setTemperature: (arg: string) => {
      try {
        const brightness = Number(arg);
        this.setTemperature(brightness);
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
    const action = "turnOn";
    const status = "OK";
    this.communicator.publish(action, status);
  }
  turnOff(): void {
    this.isOn = false;
    const action = "turnOff";
    const status = "OK";
    this.communicator.publish(action, status);
  }
  setTemperature(temp: number): void {
    const action = "setTemperature";
    if (temp < 16 || temp > 35) {
      const status = "NO";
      this.communicator.publish(action, status);
      return;
    }
    this.temperature = temp;
    this.curTemperature = temp;
    const status = "OK";
    this.communicator.publish(action, status);
  }
  getTemperature(): number {
    return this.temperature;
  }

  getCurTemperature(): number {
    return this.curTemperature;
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

  emulateTemperatureChange(deltaTemp: number, deltaTime: number) {
    let temperatureChange = this.random(-deltaTemp, deltaTemp);
    setInterval(() => {
      this.curTemperature += temperatureChange;
      if (this.curTemperature < 16 || this.curTemperature > 35) {
        this.setTemperature(this.temperature);
        temperatureChange = this.random(-deltaTemp, deltaTemp);
      }
    }, deltaTime);
  }

  private random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
