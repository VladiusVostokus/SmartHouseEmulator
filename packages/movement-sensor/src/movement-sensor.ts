import { BaseDevice, type ICommunicator } from "@smart-house/common";
import type { MovementSensorConfig } from "./interfaces/movement-sensor-config.interface";

export class MovementSensor extends BaseDevice {
  private simulationTimer: NodeJS.Timeout | null = null;

  private readonly minDetectionIntervalMs: number;
  private readonly maxDetectionIntervalMs: number;
  private readonly detectionProbability: number;

  constructor(
    name: string,
    communicator: ICommunicator,
    config: MovementSensorConfig = {},
  ) {
    super(name, "movement-sensor", communicator);

    this.minDetectionIntervalMs = config.minIntervalMs ?? 3000;
    this.maxDetectionIntervalMs = config.maxIntervalMs ?? 15000;
    this.detectionProbability = config.detectionProbability ?? 0.5;
  }

  public turnOn(): boolean {
    const changed = super.turnOn();
    return changed;
  }

  public turnOff(): boolean {
    const changed = super.turnOff();
    if (changed) {
      this.stopSimulation();
    }
    return changed;
  }

  public startSimulation(): boolean {
    if (!this.isOn) {
      console.log(`[${this.name}] Cannot start simulation: sensor is OFF.`);
      this.publishStatusUpdate({
        actionContext: "startSimulation",
        status: "IGNORED",
        reason: "Device is off",
      });
      return false;
    }
    if (this._isSimulating) {
      return false;
    }
    this._isSimulating = true;
    console.log(`[${this.name}] Starting motion detection simulation.`);
    this.publishStatusUpdate({
      actionContext: "startSimulation",
      status: "OK",
      value: "STARTED",
    });
    this.scheduleNextDetection();
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
    console.log(`[${this.name}] Stopped motion detection simulation.`);
    this.publishStatusUpdate({
      actionContext: "stopSimulation",
      status: "OK",
      value: "STOPPED",
    });
    return true;
  }

  private scheduleNextDetection(): void {
    if (!this._isSimulating || !this.isOn) {
      if (this._isSimulating) {
        this.stopSimulation();
      }
      return;
    }

    const randomDelay =
      Math.floor(
        Math.random() *
          (this.maxDetectionIntervalMs - this.minDetectionIntervalMs + 1),
      ) + this.minDetectionIntervalMs;

    this.simulationTimer = setTimeout(() => {
      if (this._isSimulating && this.isOn) {
        if (Math.random() < this.detectionProbability) {
          this.detectAndPublishMotion();
        }
        this.scheduleNextDetection();
      } else {
        if (this._isSimulating) {
          this.stopSimulation();
        }
      }
    }, randomDelay);
  }

  private detectAndPublishMotion(): void {
    this.communicator.publish("motionDetected", "DETECTED");
    console.log(`[${this.name}] Published motion detected.`);
  }
}
