export interface ICommunicator {
    publish(device: string, payload: any): void;
    subscribe(device: string, onMessage: (data: any) => void): void;
}