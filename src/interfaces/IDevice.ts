export interface IDeviceCommunicator {
    id: string;
    isOn: boolean;
    subscribedTopics: object;
    communicator: IDeviceCommunicator;
    subscribe(topic: string): void;
    sendMessage(topic: string): void;
    turnOn(): void;
    turnOff(): void;
}