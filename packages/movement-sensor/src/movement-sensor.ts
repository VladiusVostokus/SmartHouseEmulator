import type { ICommunicator, IDevice } from "@smart-house/common";

export class MovementSensor implements IDevice {
  private name: string;
  private type = "movement-sensor";
  private isOn: boolean;
  private communicator: ICommunicator;

  constructor(name: string, communicator: ICommunicator) {
    this.name = name;
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

  subscribe(topic: string): void {}

  publish(topic: string, message?: string): void {}

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

  detectMotion(): void {
    const payload = JSON.stringify({
      deviceId: this.name,
      motion: true,
      timestamp: new Date().toISOString(),
    });
    this.publish("motionDetected", payload);
  }
}
