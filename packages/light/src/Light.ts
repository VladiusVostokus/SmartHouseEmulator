import {
  BaseDevice,
  type CommandPayload,
  type ICommunicator,
} from "@smart-house/common";
import type { LightConfig } from "./interfaces/light-config.interface";

export class Light extends BaseDevice {
  private _brightness: number = 100;
  private simulationTimer: NodeJS.Timeout | null = null;

  private readonly simulationIntervalMs: number;
  private readonly brightnessFluctuation: number;

  constructor(
    name: string,
    communicator: ICommunicator,
    config: LightConfig = {},
  ) {
    super(name, "light", communicator);
    this.simulationIntervalMs = config.simulationIntervalMs ?? 10000;
    this.brightnessFluctuation = config.brightnessFluctuation ?? 5;

    this.initializeLightHandlers();
  }

  private initializeLightHandlers(): void {
    this.registerCommandHandler(
      "setBrightness",
      (payload: CommandPayload & { level?: number }) => {
        const levelValue =
          payload.level ?? (payload.arg ? Number(payload.arg) : undefined);
        if (typeof levelValue === "number" && !isNaN(levelValue)) {
          this.setBrightness(levelValue);
        } else {
          console.error(
            `[${this.name}] Invalid brightness level received:`,
            payload,
          );
          this.publishStatusUpdate({
            actionContext: "setBrightness",
            status: "ERROR",
            error: "Invalid brightness level",
          });
        }
      },
    );
  }

  public get brightness(): number {
    return this._brightness;
  }

  public setBrightness(level: number): boolean {
    if (!this.isOn) {
      console.warn(`[${this.name}] Cannot set brightness: Light is OFF.`);
      this.publishStatusUpdate({
        actionContext: "setBrightness",
        status: "IGNORED",
        reason: "Device is off",
      });
      return false;
    }
    if (level < 0 || level > 100) {
      console.warn(
        `[${this.name}] Brightness level ${level} is out of range (0-100).`,
      );
      this.publishStatusUpdate({
        actionContext: "setBrightness",
        status: "ERROR",
        error: "Brightness out of range",
        valueReceived: level,
      });
      return false;
    }
    if (this._brightness === level) {
      return false;
    }

    this._brightness = level;
    console.log(`[${this.name}] Brightness set to ${this._brightness}%.`);
    this.publishStatusUpdate({
      actionContext: "setBrightness",
      status: "OK",
      brightness: this._brightness,
    });
    return true;
  }

  public startSimulation(): boolean {
    if (!this.isOn) {
      console.log(`[${this.name}] Cannot start simulation: Light is OFF.`);
      return false;
    }
    if (this._isSimulating) {
      return false;
    }

    this._isSimulating = true;
    console.log(
      `[${this.name}] Starting light state simulation (random brightness fluctuation).`,
    );
    this.scheduleNextFluctuation();
    this.publishStatusUpdate({
      actionContext: "startSimulation",
      status: "OK",
      simulationState: "STARTED",
    });
    return true;
  }

  public stopSimulation(): boolean {
    if (!this._isSimulating) {
      return false;
    }
    if (this.simulationTimer) {
      clearTimeout(this.simulationTimer);
      this.simulationTimer = null;
    }
    this._isSimulating = false;
    console.log(`[${this.name}] Stopped light state simulation.`);
    this.publishStatusUpdate({
      actionContext: "stopSimulation",
      status: "OK",
      simulationState: "STOPPED",
    });
    return true;
  }

  private scheduleNextFluctuation(): void {
    if (!this._isSimulating || !this.isOn) {
      if (this._isSimulating) this.stopSimulation();
      return;
    }

    this.simulationTimer = setTimeout(
      () => {
        if (this._isSimulating && this.isOn) {
          const change = Math.floor(
            Math.random() * (this.brightnessFluctuation * 2 + 1) -
              this.brightnessFluctuation,
          );
          let newBrightness = this._brightness + change;
          newBrightness = Math.max(0, Math.min(100, newBrightness));

          if (this._brightness !== newBrightness) {
            console.log(
              `[${this.name}] Sim: Brightness fluctuated to ${newBrightness}%.`,
            );
            this.setBrightness(newBrightness);
          }
          this.scheduleNextFluctuation();
        } else {
          if (this._isSimulating) this.stopSimulation();
        }
      },
      this.simulationIntervalMs + (Math.random() * 2000 - 1000),
    );
  }
}
