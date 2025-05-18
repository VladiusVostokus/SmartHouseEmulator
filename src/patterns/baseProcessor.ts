// src/patterns/BaseProcessor.ts

import type { ICommunicator } from "../interfaces/ICommunicator.js";
import type { ICommand, IDevice } from "../interfaces/IDevice.js";

export abstract class BaseProcessor<D extends IDevice> {
  protected commandTopics: string[];
  protected statusTopic: string;

  constructor(
    protected communicator: ICommunicator,
    protected device: D,
    protected deviceType: string,
    protected deviceId: string,
  ) {
    // Формуємо статус-топік за конвенцією
    this.statusTopic = `/home/${deviceId}/${deviceType}/status`;
    // Запитуємо топіки команд у підкласу
    this.commandTopics = this.defineCommandTopics(deviceId);

    // Підписуємося на кожен топік
    for (const topic of this.commandTopics) {
      this.communicator.subscribe(topic, (raw) => this.handleRaw(topic, raw));
    }

    // Дозволяємо пристрою відправляти статуси
    this.device.setProcessor(this as any);
  }

  /**
   * Відправка статусу назад у MQTT
   */
  public send(action: string, data: Record<string, any> = {}) {
    const payload = { action, ...data };
    this.communicator.publish(this.statusTopic, payload);
  }

  /**
   * Кожен підклас має повернути список топіків команд для свого пристрою.
   */
  protected abstract defineCommandTopics(deviceId: string): string[];

  /**
   * Обробка вхідного "raw" повідомлення: парсинг і делегування в сабклас.
   */
  private handleRaw(topic: string, raw: Buffer) {
    let cmd: ICommand;
    try {
      cmd = JSON.parse(raw.toString());
    } catch {
      console.warn(`Invalid JSON on topic ${topic}:`, raw.toString());
      return;
    }
    this.handleCommand(topic, cmd);
  }

  /**
   * Сабклас обробляє команду, знаючи topic і розпарсений об'єкт.
   */
  protected abstract handleCommand(topic: string, cmd: ICommand): void;
}
