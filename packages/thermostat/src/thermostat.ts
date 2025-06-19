import {
  BaseDevice,
  type CommandPayload,
  type ICommunicator,
} from "@smart-house/common";


export class Thermostat extends BaseDevice {
  private _temperature: number = 22;
  private _curTemperature: number = 22;
  private simulationTimer: NodeJS.Timeout | null = null;

  constructor(name: string, communicator: ICommunicator) {
    super(name, "light", communicator);
    this.initializeLightHandlers();
  }

  private initializeLightHandlers(): void {
    this.registerCommandHandler(
      "setTemperature",
      (payload: CommandPayload & { level?: number }) => {
        const levelValue =
          payload.level ?? (payload.arg ? Number(payload.arg) : undefined);
        if (typeof levelValue === "number" && !isNaN(levelValue)) {
          this.setTemperature(levelValue);
        } else {
          console.error(
            `[${this.name}] Invalid temperature value received:`,
            payload,
          );
          this.publishStatusUpdate({
            actionContext: "setTemperature",
            status: "ERROR",
            error: "Invalid temperature value",
          });
        }
      },
    );
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
        `[${this.name}] Temperature level ${temp} is out of range (16-35).`,
      );
      return;
    }
    this._temperature = temp;
    this._curTemperature = temp;
    const status = "OK";
    this.communicator.publish(action, status);
    console.log(`[${this.name}] Temperature set to ${this._temperature}C.`);
  }

  emulateTemperatureChange(
    deltaTemp: number,
    deltaTime: number,
    random: (min: number, max: number) => number,
  ) {
    console.log(`[${this.name}] Start temperature simulation`)
    let temperatureChange = random(-deltaTemp, deltaTemp);
    this.simulationTimer = setInterval(() => {
      this._curTemperature += temperatureChange;
      console.log(`[${this.name}] Current envitonment temperatur is ${this._curTemperature}`);
      if (this._curTemperature < 16 || this._curTemperature > 35) {
        this.setTemperature(this._temperature);
      }
      temperatureChange = random(-deltaTemp, deltaTemp);
    }, deltaTime);
  }

  stopSimulation(): boolean {
    if (this.simulationTimer) {
      clearTimeout(this.simulationTimer);
      this.simulationTimer = null;
    }
    return true;
  }

  get isOn(): boolean {
    return this._isOn;
  }

  get temperature(): number {
    return this._temperature;
  }

  get curTemperature(): number {
    return this._curTemperature;
  }

  get timer() {
    return this.simulationTimer;
  }
}
