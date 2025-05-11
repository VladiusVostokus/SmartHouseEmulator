import type { DeviceConstructor } from "../devices/devicesCollection.ts";
import type { ICommunicator } from "../interfaces/ICommunicator.ts";
import type { IDevice } from "../interfaces/IDevice.ts";

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
