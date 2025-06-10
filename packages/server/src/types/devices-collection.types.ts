import type { ICommunicator, IDevice } from "@smart-house/common";
import { Light } from "@smart-house/light";
import { Thermostat } from "@smart-house/thermostat";

export type DeviceConstructor = new (
  name: string,
  communicator: ICommunicator,
) => IDevice;

export const devicesCollection: Record<string, DeviceConstructor> = {
  light: Light,
  thermostat: Thermostat,
};
