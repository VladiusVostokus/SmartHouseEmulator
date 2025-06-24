import {
  BaseDevice,
  type CommandPayload,
  type ICommunicator,
} from "@smart-house/common";

export class Light extends BaseDevice {
  private _brightness: number = 100;

  constructor(name: string, communicator: ICommunicator) {
    super(name, "light", communicator);

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
            reason: "Invalid brightness level",
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
        value: level,
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
        reason: "Brightness out of range",
        value: level,
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
      value: level,
    });
    return true;
  }
}
