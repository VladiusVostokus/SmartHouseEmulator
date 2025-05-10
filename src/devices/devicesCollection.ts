import type { ICommunicator } from "../interfaces/ICommunicator.js";
import type { IDevice } from "../interfaces/IDevice.js";
import { Light } from "./Light.js";
import { Thermostat } from "./Thermostat.js";

export type DeviceConstructor = new (name: string, communicator: ICommunicator) => IDevice;

export const devicesCollection: Record<string, DeviceConstructor > = {
    'light': Light,
    'thermostat': Thermostat,
    //'something_else':'add more devices here'
};
