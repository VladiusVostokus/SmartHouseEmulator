import type { ICommunicator } from "../interfaces/ICommunicator.js";
import type { IDevice } from "../interfaces/IDevice.js";
import { Light } from "./Light.js";
import { Thermostat } from "./Thermostat.js";
import { MovementSensor } from "./MovementSensor.js";

export type DeviceConstructor = new (
  name: string,
  communicator: ICommunicator,
) => IDevice;

export const devicesCollection: Record<string, DeviceConstructor> = {
  light: Light,
  thermostat: Thermostat,
  movementSensor: MovementSensor,
  //'something_else':'add more devices here'
};
