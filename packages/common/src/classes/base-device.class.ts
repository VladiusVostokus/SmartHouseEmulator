import type { ICommunicator } from "../interfaces/communicator.interface";
import type { IDevice } from "../interfaces/device.interface";
import type { CommandPayload } from "../types/command-payload.type";

export abstract class BaseDevice implements IDevice {
  protected readonly name: string;
  protected readonly deviceType: string;
  protected _isOn: boolean = false;
  protected communicator: ICommunicator;
  protected _isSimulating: boolean = false;

  protected commandHandlers: {
    [command: string]: (payload: CommandPayload) => void;
  } = {};

  constructor(name: string, deviceType: string, communicator: ICommunicator) {
    this.name = name;
    this.deviceType = deviceType;
    this.communicator = communicator;
    this.initializeBaseHandlers();
  }

  public get isOn(): boolean {
    return this._isOn;
  }

  public get isSimulating(): boolean {
    return this._isSimulating;
  }

  private initializeBaseHandlers(): void {
    this.registerCommandHandler("turn", (payload) => {
      if (payload.arg === "on") {
        this.turnOn();
      } else if (payload.arg === "off") {
        this.turnOff();
      } else {
        console.warn(`[${this.name}] Unknown 'turn' argument: ${payload.arg}`);
        this.publishStatusUpdate({
          actionContext: "turn",
          status: "ERROR",
          reason: "Unknown argument",
          argumentReceived: payload.arg,
        });
      }
    });
  }

  protected registerCommandHandler(
    command: string,
    handler: (payload: CommandPayload) => void,
  ): void {
    this.commandHandlers[command] = handler;
  }

  public handleMessage(topic: string, message: Buffer): void {
    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(message.toString());
    } catch (e) {
      console.warn(
        `[${this.name}] Invalid JSON on topic ${topic}: ${message.toString()}`,
        e,
      );
      this.publishStatusUpdate({
        actionContext: "handleMessage",
        status: "ERROR",
        reason: "Invalid JSON received",
        topic: topic,
      });
      return;
    }

    const { cmd, ...payloadForHandler } = parsedPayload;

    if (typeof cmd !== "string") {
      console.warn(
        `[${this.name}] Message on topic ${topic} missing 'cmd' field or 'cmd' is not a string:`,
        parsedPayload,
      );
      this.publishStatusUpdate({
        actionContext: "handleMessage",
        status: "ERROR",
        reason: "Missing or invalid 'cmd' field",
        topic: topic,
      });
      return;
    }

    const handler = this.commandHandlers[cmd];
    if (handler) {
      handler(payloadForHandler as CommandPayload);
    } else {
      console.warn(
        `[${this.name}] Unknown command '${cmd}' received on topic ${topic}.`,
      );
      this.publishStatusUpdate({
        actionContext: cmd,
        status: "ERROR",
        reason: "Unknown command",
        topic: topic,
      });
    }
  }

  public turnOn(): boolean {
    if (this._isOn) {
      return false;
    }
    this._isOn = true;
    this.publishStatusUpdate({
      actionContext: "turn",
      status: "OK",
      value: "ON",
    });
    console.log(`[${this.name}] Turned ON.`);
    return true;
  }

  public turnOff(): boolean {
    if (!this._isOn) {
      return false;
    }
    this._isOn = false;
    this.stopSimulation();
    this.publishStatusUpdate({
      actionContext: "turn",
      status: "OK",
      value: "OFF",
    });
    console.log(`[${this.name}] Turned OFF.`);
    return true;
  }

  protected publishStatusUpdate(statusDetails: Record<string, any>): void {
    const primaryAction =
      statusDetails.actionContext ||
      statusDetails.lastCommand ||
      "deviceUpdate";
    const statusPayloadString = {
      status: statusDetails.status,
      timestamp: new Date().toISOString(),
      reason: statusDetails.reason || "",
      value: statusDetails.value || "",
    };
    this.communicator.publish(primaryAction, statusPayloadString);
  }

  public startSimulation(...args: any[]): boolean {
    return false;
  }
  public stopSimulation(): boolean {
    return false;
  }
}
