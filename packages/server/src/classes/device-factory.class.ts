import type { ICommunicator, IDevice } from "@smart-house/common";
import type { DeviceConstructor } from "../types/devices-collection.types";

export class DeviceFactory {
  deviceCollection: Record<string, DeviceConstructor>;

  constructor(devices: Record<string, DeviceConstructor>) {
    this.deviceCollection = devices;
  }

  createDevice(
    deviceType: string,
    name: string,
    communicator: ICommunicator,
  ): IDevice {
    const Device = this.deviceCollection[deviceType];
    if (!Device) throw new Error(`Unknown device type: ${deviceType}`);
    return new Device(name, communicator);
  }
}
