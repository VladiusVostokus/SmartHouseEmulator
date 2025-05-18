import type { ICommand, IDevice } from "../interfaces/IDevice.js";
import type { BaseProcessor } from "../patterns/baseProcessor.js";

export class Light implements IDevice {
  public readonly deviceId: string;

  private isOn = false;

  private brightness = 0;
  private mode = "normal";
  private processor!: BaseProcessor<Light>;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  public setProcessor(p: BaseProcessor<Light>) {
    this.processor = p;
  }

  public handleCommand(cmd: ICommand) {
    // Додатковий загальний хендл — не використовується, бо Processor розбирає по topic
    console.warn(
      "Direct handleCommand not supported. Use topic-based dispatch.",
    );
  }

  public turnOn() {
    this.isOn = true;

    this.processor.send("status", { on: this.isOn });
  }

  public turnOff() {
    this.isOn = false;

    this.processor.send("status", { on: this.isOn });
  }

  public setBrightness(level: number) {
    this.brightness = level;
    this.processor.send("brightnessChanged", { brightness: level });
  }

  public setEnergyMode(mode: string) {
    this.mode = mode;
    this.processor.send("modeChanged", { mode });
  }
}
