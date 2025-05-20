import type { Light } from "../devices/LightDevice.js";
import type { ICommunicator } from "../interfaces/ICommunicator.js";
import type { ICommand } from "../interfaces/IDevice.js";
import { BaseProcessor } from "./baseProcessor.js";

export class LightProcessor extends BaseProcessor<Light> {
  private handlers: Record<string, (cmd: ICommand) => void>;

  constructor(comm: ICommunicator, light: Light) {
    super(comm, light, "light", light.deviceId);

    this.handlers = {
      [this.commandTopics[0]]: (cmd) => {
        // turnLight
        if (cmd.action === "on") this.device.turnOn();
        else if (cmd.action === "off") this.device.turnOff();
        else console.warn("Unknown turn action:", cmd.action);
      },
      [this.commandTopics[1]]: (cmd) => {
        // brightness
        this.device.setBrightness(cmd.brightness);
      },
      [this.commandTopics[2]]: (cmd) => {
        // energyMode
        this.device.setEnergyMode(cmd.mode);
      },
    };
  }

  protected defineCommandTopics(deviceId: string): string[] {
    return [
      `/home/${deviceId}/turnLight`,

      `/home/${deviceId}/brightness`,

      `/home/${deviceId}/energyMode`,
    ];
  }

  protected handleCommand(topic: string, cmd: ICommand): void {
    const fn = this.handlers[topic];
    if (fn) {
      fn(cmd);
    } else {
      console.warn("LightProcessor: unexpected topic", topic);
    }
  }
}
