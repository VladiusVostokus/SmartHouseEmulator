import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Thermostat } from '../src/devices/Thermostat.js';

// Мокаємо ICommunicator
const mockCommunicator = {
  publish: vi.fn(),
  subscribe: vi.fn(),
};

describe('Thermostat methods', () => {
  let thermostat: Thermostat;

  beforeEach(() => {
    thermostat = new Thermostat('Test Thermostat', mockCommunicator);
  });

  it('should be off by default', () => {
    // @ts-ignore
    expect(thermostat.isOn).toBe(false);
  });

  it('should turn on', () => {
    thermostat.turnOn();
    // @ts-ignore
    expect(thermostat.isOn).toBe(true);
  });

  it('should turn off', () => {
    thermostat.turnOn();
    thermostat.turnOff();
    // @ts-ignore
    expect(thermostat.isOn).toBe(false);
  });

  it('should set temperature (TDD)', () => {
    thermostat.setTemperature(22);
    expect(thermostat.getTemperature()).toBe(22);
  });

  it('should set temperature to min value', () => {
    thermostat.setTemperature(16);
    expect(thermostat.getTemperature()).toBe(16);
  });

  it('should set temperature to max value', () => {
    thermostat.setTemperature(35);
    expect(thermostat.getTemperature()).toBe(35);
  });

  it('should not set temperature to negative value (optional)', () => {
    thermostat.setTemperature(-10);
    expect(thermostat.getTemperature()).not.toBe(-10);
  });

  it('should keep temperature after turnOn/turnOff', () => {
    thermostat.setTemperature(25);
    thermostat.turnOn();
    thermostat.turnOff();
    expect(thermostat.getTemperature()).toBe(25);
  });
}); 

describe("Temostat methods with communicator mock", () => {
  it("should turn on when receiving a 'turn on' message", () => {
    const termo = new Thermostat("light1", mockCommunicator);

    const message = Buffer.from(JSON.stringify({ cmd: "turn", arg: "on" }));
    termo.handleMessage("/home/termo1/action", message);

    expect(termo['isOn']).toBe(true);
    expect(mockCommunicator.publish).toHaveBeenCalledWith("turnOn", "OK");
  });

  it("should set brightness correctly and publish OK", () => {
    const termo = new Thermostat("termo1", mockCommunicator);

    const message = Buffer.from(JSON.stringify({ cmd: "setTemperature", arg: "25" }));
    termo.handleMessage("/home/termo1/action", message);

    expect(termo.getTemperature()).toBe(25);
    expect(mockCommunicator.publish).toHaveBeenCalledWith("setTemperature", "OK");
  });

  it("should not set brightness if value is invalid", () => {
    const termo = new Thermostat("termo1", mockCommunicator);

    const message = Buffer.from(JSON.stringify({ cmd: "setTemperature", arg: "50" }));
    termo.handleMessage("/home/termo1/action", message);

    expect(termo.getTemperature()).not.toBe(50);
    expect(mockCommunicator.publish).toHaveBeenCalledWith("setTemperature", "NO");
  });
});

