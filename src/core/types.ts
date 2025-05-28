// Типи для повідомлень
export type MessagePayload = {
    action?: string;
    status?: string;
    timestamp: string;
    [key: string]: any;
  };
  
  // Типи для дій
  export type LightAction = "turnOn" | "turnOff";
  export type ThermostatAction = "turnOn" | "turnOff" | "setTemperature";
  
  // Типи для топиків
  export type Topic = {
    command: string;   // /home/{deviceId}/command
    status: string;    // /home/{deviceId}/status
    action: string;    // /home/{deviceId}/action
  };