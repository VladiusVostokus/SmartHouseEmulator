export interface DeviceCommunicator {
    sendMessage(device: string, payload: any): void;
    subscribe(device: string, onMessage: (data: any) => void): void;
}