import type { ICommunicator, IDevice } from "@smart-house/common";
import type { MovementSensorConfig } from "./interfaces/movement-sensor-config.interface";

export class MovementSensor implements IDevice {
  private readonly name: string;
  private readonly type: string = "movement-sensor";
  private _isOn: boolean = false;
  private _isSimulating: boolean = false;
  private communicator: ICommunicator;
  private simulationTimer: NodeJS.Timeout | null = null;

  private readonly minDetectionIntervalMs: number;
  private readonly maxDetectionIntervalMs: number;
  private readonly detectionProbability: number;

  constructor(
    name: string,
    communicator: ICommunicator,
    config: MovementSensorConfig = {},
  ) {
    this.name = name;
    this.communicator = communicator;
    this.minDetectionIntervalMs = config.minIntervalMs ?? 3000;
    this.maxDetectionIntervalMs = config.maxIntervalMs ?? 15000;
    this.detectionProbability = config.detectionProbability ?? 0.5;
  }

  public get isOn(): boolean {
    return this._isOn;
  }

  public get isSimulating(): boolean {
    return this._isSimulating;
  }

  public handleMessage(topic: string, message: Buffer): void {
    let payload;
    try {
      payload = JSON.parse(message.toString());
    } catch (e) {
      console.warn(
        `[${this.name}] Invalid JSON on topic ${topic}: ${message.toString()}`,
        e,
      );
      return;
    }
    const { cmd, arg } = payload;
    const handler = this.handlers[cmd];
    if (handler) {
      handler(arg);
    } else {
      console.warn(`[${this.name}] Unknown command '${cmd}' received.`);
    }
  }

  public turnOn(): boolean {
    if (this._isOn) {
      console.log(`[${this.name}] Already ON.`);
      return false;
    }
    this._isOn = true;
    this.communicator.publish("turnOn", "OK");
    console.log(`[${this.name}] Turned ON.`);
    return true;
  }

  public turnOff(): boolean {
    if (!this._isOn) {
      console.log(`[${this.name}] Already OFF.`);
      return false;
    }
    this._isOn = false;
    this.stopSimulation();
    this.communicator.publish("turnOff", "OK");
    console.log(`[${this.name}] Turned OFF.`);
    return true;
  }

  public startSimulation(): boolean {
    if (!this._isOn) {
      console.log(`[${this.name}] Cannot start simulation: sensor is OFF.`);
      return false;
    }
    if (this._isSimulating) {
      console.log(`[${this.name}] Simulation is already running.`);
      return false;
    }
    this._isSimulating = true;
    console.log(`[${this.name}] Starting motion detection simulation.`);
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
    return true;
  }

  private handlers: { [key: string]: (arg: string) => void } = {
    turn: (arg: string) => {
      if (arg === "on") this.turnOn();
      else if (arg === "off") this.turnOff();
      else console.warn(`[${this.name}] Unknown 'turn' argument: ${arg}`);
    },
  };

  private scheduleNextDetection(): void {
    if (!this._isSimulating || !this._isOn) {
      this.stopSimulation();
      return;
    }

    const randomDelay =
      Math.floor(
        Math.random() *
          (this.maxDetectionIntervalMs - this.minDetectionIntervalMs + 1),
      ) + this.minDetectionIntervalMs;

    this.simulationTimer = setTimeout(() => {
      if (this._isSimulating && this._isOn) {
        if (Math.random() < this.detectionProbability) {
          this.detectAndPublishMotion();
        }
        this.scheduleNextDetection();
      } else {
        this.stopSimulation();
      }
    }, randomDelay);
  }

  private detectAndPublishMotion(): void {
    this.communicator.publish("motionDetected", "DETECTED");
    console.log(`[${this.name}] Published motion detected.`);
  }
}
