import type { BaseProcessor } from "../patterns/baseProcessor.js";

export interface IDevice {
  setProcessor(processor: BaseProcessor<this>): void;
  handleCommand(cmd: ICommand): void;
}

export interface ICommand {
  action: string;
  [key: string]: any;
}
