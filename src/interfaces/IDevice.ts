export interface IDevice{
    subscribe(topic: string): void;
    publish(topic: string): void;
    turnOn(): void;
    turnOff(): void;
}