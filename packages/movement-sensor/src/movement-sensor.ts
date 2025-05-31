import type { ICommunicator, IDevice } from "@smart-house/common";

export class MovementSensor implements IDevice {
  private name: string;
  private type;
  private isOn: boolean;
  private communicator: ICommunicator;
  private simulationTimer: NodeJS.Timeout | null = null;
  private minDetectionIntervalMs: number = 3000;
  private maxDetectionIntervalMs: number = 15000;

  constructor(name: string, communicator: ICommunicator) {
    this.name = name;
    this.type = "movement-sensor";
    this.isOn = false;
    this.communicator = communicator;
  }

  private handlers: { [key: string]: (arg: string) => void } = {
    turn: (arg: string) => {
      if (arg === "on") this.turnOn();
      else if (arg === "off") this.turnOff();
      else console.warn("Unknown turn action:", arg);
    },
  };

  handleMessage(topic: string, message: Buffer) {
    let action;
    try {
      action = JSON.parse(message.toString());
    } catch {
      console.warn(`Invalid JSON on topic ${topic}:, message.toString()`);
      return;
    }
    const { cmd, arg } = action;
    const command = this.handlers[cmd];
    if (command) {
      command(arg);
    }
  }

  startSimulation(): void {
    if (!this.isOn) {
      console.log(`[${this.name}] Cannot start simulation, sensor is off.`);
      return;
    }
    if (this.simulationTimer) {
      console.log(`[${this.name}] Simulation already running.`);
      return;
    }
    console.log(`[${this.name}] Starting motion detection simulation.`);
    this.scheduleNextDetection();
  }

  stopSimulation(): void {
    if (this.simulationTimer) {
      clearTimeout(this.simulationTimer);
      this.simulationTimer = null;
      console.log(`[${this.name}] Stopped motion detection simulation.`);
    }
  }

  private scheduleNextDetection(): void {
    if (!this.isOn) {
      this.stopSimulation();
      return;
    }

    // Calculate a random delay
    const randomDelay =
      Math.floor(
        Math.random() *
          (this.maxDetectionIntervalMs - this.minDetectionIntervalMs + 1),
      ) + this.minDetectionIntervalMs;

    this.simulationTimer = setTimeout(() => {
      if (this.isOn) {
        if (Math.random() < 0.5) {
          console.log(`[${this.name}] Simulating motion detection.`);
          this.detectMotion();
        } else {
          console.log(`[${this.name}] No motion detected in this interval.`);
        }
        this.scheduleNextDetection();
      }
    }, randomDelay);

    console.log(
      `[${this.name}] Next motion check scheduled in ${randomDelay / 1000} seconds.`,
    );
  }

  private detectMotion(): void {
    if (!this.isOn) {
      return;
    }
    const action = "motionDetected";
    const statusPayload = "DETECTED"; // Or "DETECTED"
    this.communicator.publish(action, statusPayload);
    console.log(`[${this.name}] Published motion detected.`);
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
}
