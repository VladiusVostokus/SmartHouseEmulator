// src/patterns/Processor.ts
import type { ICommunicator } from "../interfaces/ICommunicator.js";
import { DeviceFactory } from "./deviceFactory.js";
import type { IDevice } from "../interfaces/IDevice.js";
import { Light } from "../devices/LightDevice.js";
import { Thermostat } from "../devices/Thermostat.js";

interface ICommand {
  action: string;
  [key: string]: any; // e.g. brightness, temperature, etc.
}

export class Processor {
  private communicator: ICommunicator;
  private factory: DeviceFactory;
  private devices = new Map<string, IDevice>();

  constructor(communicator: ICommunicator, factory: DeviceFactory) {
    this.communicator = communicator;
    this.factory = factory;
  }

  /**
   * Create and register a new device, and hook up its MQTT topic.
   */
  registerDevice(deviceType: string, deviceId: string) {
    const device = this.factory.createDevice(
      deviceType,
      deviceId,
      this.communicator,
    );
    const key = this.key(deviceType, deviceId);
    this.devices.set(key, device);

    // e.g. topic = "home/1/light/command"
    const topic = `home/${deviceId}/${deviceType}/command`;
    this.communicator.subscribe(topic, (raw) => this.handle(topic, raw));
  }

  /** The main demux: parse topic + message → device.method(...) */
  handle(topic: string, raw: any) {
    let cmd: ICommand;
    try {
      const str = raw instanceof Buffer ? raw.toString() : raw;
      cmd = JSON.parse(str);
    } catch {
      console.warn("Failed to parse MQTT payload:", raw);
      return;
    }

    const [, deviceId, deviceType] = topic.split("/");
    const device = this.devices.get(this.key(deviceType, deviceId));
    if (!device) {
      console.warn(`No device found for ${deviceType}:${deviceId}`);
      return;
    }

    // --- Narrow by class ---
    if (device instanceof Light) {
      switch (cmd.action) {
        case "turnOn":
          device.turnOn();
          break;
        case "turnOff":
          device.turnOff();
          break;
        case "setBrightness":
          device.setBrightness(cmd.brightness);
          break;
        default:
          console.warn("Unknown light action:", cmd.action);
      }
    } else if (device instanceof Thermostat) {
      switch (cmd.action) {
        case "setTemperature":
          device.setTemperature(cmd.temperature);
          break;
        default:
          console.warn("Unknown thermostat action:", cmd.action);
      }
    }
    // …and so on for other device types…
  }
  /** Helper to build a map key */
  private key(type: string, id: string) {
    return `${type}:${id}`;
  }

  /**
   * If your devices need to send messages out, you can
   * wrap communicator.publish here too:
   */
  send(
    deviceType: string,
    deviceId: string,
    action: string,
    data: Record<string, any> = {},
  ) {
    const topic = `home/${deviceId}/${deviceType}/status`;
    const payload = JSON.stringify({ action, ...data });
    this.communicator.publish(topic, payload);
  }
}
