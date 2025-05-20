// src/devices/LightDevice.ts
import { AbstractDevice, type DeviceConfig } from "./AbstractDevice.js";

export class LightDevice extends AbstractDevice {
  private isOn = false;
  private brightness = 0;
  private energyMode = "normal";

  constructor(cfg: DeviceConfig) {
    super(cfg);
  }

  protected commandTopics(): string[] {
    const id = this.config.deviceId;
    return [
      `/home/${id}/turnLight`,
      `/home/${id}/brightness`,
      `/home/${id}/energyMode`,
    ];
  }

  protected handleCommand(topic: string, msg: any): void {
    const id = this.config.deviceId;
    switch (topic) {
      case `/home/${id}/turnLight`:
        if (msg.action === "on") this.turnOn();
        else if (msg.action === "off") this.turnOff();
        else console.warn("Unknown turn action", msg.action);
        break;

      case `/home/${id}/brightness`:
        this.setBrightness(msg.brightness);
        break;

      case `/home/${id}/energyMode`:
        this.setEnergyMode(msg.mode);
        break;

      default:
        console.warn("LightDevice got unknown topic", topic);
    }
  }

  private turnOn() {
    this.isOn = true;
    console.log("🌟 Light ON");
    this.publishStatus({ action: "status", on: this.isOn });
  }

  private turnOff() {
    this.isOn = false;
    console.log("🌑 Light OFF");
    this.publishStatus({ action: "status", on: this.isOn });
  }

  private setBrightness(level: number) {
    this.brightness = level;
    console.log("💡 Brightness =", level);
    this.publishStatus({ action: "brightnessChanged", brightness: level });
  }

  private setEnergyMode(mode: string) {
    this.energyMode = mode;
    console.log("🔋 Mode =", mode);
    this.publishStatus({ action: "modeChanged", mode });
  }
}
