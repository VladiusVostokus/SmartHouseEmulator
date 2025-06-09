export interface DeviceState {
  status: string;
  lastUpdate: Date;
  data?: Record<string, unknown>;
}
