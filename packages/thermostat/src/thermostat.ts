import {
  BaseDevice,
  type CommandPayload,
  type ICommunicator,
} from "@smart-house/common";


export class Thermostat extends BaseDevice {
  private _temperature: number = 22;
  private _curTemperature: number = 22;
  private simulationTimer: NodeJS.Timeout | null = null;
  private deltaTemp: number = 0;
  private deltaTime: number = 0;
  private emulationCallback: (min: number, max: number) => number;

  constructor(name: string, communicator: ICommunicator) {
    super(name, "thermo", communicator);
    this.initializeLightHandlers();
    this.emulationCallback = () => {
      return 0;
    }
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
            reason: "Invalid temperature value",
            value: levelValue
          });
        }
      },
    );
  }

  turnOn(): boolean {
    const changed = super.turnOn();
    if (this._isSimulating) 
      this.emulateTemperatureChange(this.deltaTemp, this.deltaTime, this.emulationCallback)
    return changed;
  }

  turnOff(): boolean {
    const changed = super.turnOff();
    if (changed) {
      this.stopSimulation();
    }
    return changed;
  }

  setTemperature(temp: number): void {
    const action = "setTemperature";
    if (!this.isOn) {
      console.warn(`[${this.name}] Cannot set temperature: Thermostat is OFF.`);
      this.publishStatusUpdate({
        actionContext: action,
        status: "IGNORED",
        reason: "Device is off",
        value: temp,
      });
      return;
    }
    if (temp < 16 || temp > 35) {
      this.publishStatusUpdate({
        actionContext: action,
        status: "ERROR",
        reason: "Temperature out of range",
        value: temp,
      });
      console.warn(
        `[${this.name}] Temperature level ${temp} is out of range (16-35).`,
      );
      return;
    }
    this._temperature = temp;
    this._curTemperature = temp;
    this.publishStatusUpdate({
      actionContext: action,
      status: "OK",
      value: temp,
    });
    console.log(`[${this.name}] Temperature set to ${this._temperature}C.`);
  }

  emulateTemperatureChange(
    deltaTemp: number,
    deltaTime: number,
    random: (min: number, max: number) => number,
  ) {
    if (!this._isOn) {
      console.warn(`[${this.name}] Can't start simulation - device is off`);
      return;
    }
    this._isSimulating = true;
    this.deltaTemp = deltaTemp;
    this.deltaTime = deltaTime;
    this.emulationCallback = random;
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
