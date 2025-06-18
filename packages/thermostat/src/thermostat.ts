import type { ICommunicator, IDevice } from "@smart-house/common";

export class Thermostat implements IDevice {
  private name: string;
  private type: string;
  private isOn: boolean;
  private communicator: ICommunicator;
  private temperature: number = 22;
  private curTemperature: number = 22;
  private simulationTimer: NodeJS.Timeout | null = null;

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

  turnOn(): void {
    this.isOn = true;
    const action = "turnOn";
    const status = "OK";
    this.communicator.publish(action, status);
    console.log(`[${this.name}] Turned ON.`);
  }
  turnOff(): void {
    this.isOn = false;
    const action = "turnOff";
    const status = "OK";
    this.communicator.publish(action, status);
    console.log(`[${this.name}] Turned OFF.`);
  }
  setTemperature(temp: number): void {
    const action = "setTemperature";
    if (!this.isOn) {
      console.warn(`[${this.name}] Cannot set temperature: Thermostat is OFF.`);
      this.communicator.publish(action, "IGNORED");
      return;
    }
    if (temp < 16 || temp > 35) {
      const status = "ERROR";
      this.communicator.publish(action, status);
      console.warn(
        `[${this.name}] Brightness level ${temp} is out of range (16-35).`,
      );
      return;
    }
    this.temperature = temp;
    this.curTemperature = temp;
    const status = "OK";
    this.communicator.publish(action, status);
    console.log(`[${this.name}] Temperature set to ${this.temperature}C.`);
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

  emulateTemperatureChange(
    deltaTemp: number,
    deltaTime: number,
    random: (min: number, max: number) => number,
  ) {
    let temperatureChange = random(-deltaTemp, deltaTemp);
    this.simulationTimer = setInterval(() => {
      this.curTemperature += temperatureChange;
      if (this.curTemperature < 16 || this.curTemperature > 35) {
        this.setTemperature(this.temperature);
      }
      temperatureChange = random(-deltaTemp, deltaTemp);
    }, deltaTime);
  }

  stopSimulation() {
    if (this.simulationTimer) {
      clearTimeout(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  get IsOn(): boolean {
    return this.isOn;
  }

  get Temperature(): number {
    return this.temperature;
  }

  get CurTemperature(): number {
    return this.curTemperature;
  }

  get Timer() {
    return this.simulationTimer;
  }
}
