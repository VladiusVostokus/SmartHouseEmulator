import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Thermostat } from '../src/devices/Thermostat.js';

// Мокаємо ICommunicator
const mockCommunicator = {
  publish: vi.fn(),
  subscribe: vi.fn(),
};

describe('Thermostat', () => {
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

