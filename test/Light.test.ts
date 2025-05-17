import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Light } from '../src/devices/Light.js';

// Мокаємо ICommunicator
const mockCommunicator = {
  publish: vi.fn(),
  subscribe: vi.fn(),
};

describe('Light', () => {
  let light: Light;

  beforeEach(() => {
    light = new Light('Test Light', mockCommunicator);
  });

  it('should be off by default', () => {
    // @ts-ignore
    expect(light.isOn).toBe(false);
  });

  it('should turn on', () => {
    light.turnOn();
    // @ts-ignore
    expect(light.isOn).toBe(true);
  });

  it('should turn off', () => {
    light.turnOn();
    light.turnOff();
    // @ts-ignore
    expect(light.isOn).toBe(false);
  });

  it('should set brightness (TDD)', () => {
    light.setBrightness(80);
    expect(light.getBrightness()).toBe(80);
  });

  it('should set brightness to min value', () => {
    light.setBrightness(0);
    expect(light.getBrightness()).toBe(0);
  });

  it('should set brightness to max value', () => {
    light.setBrightness(100);
    expect(light.getBrightness()).toBe(100);
  });

  it('should not set brightness to negative value (optional)', () => {
    light.setBrightness(-10);
    expect(light.getBrightness()).not.toBe(-10);
  });

  it('should keep brightness after turnOn/turnOff', () => {
    light.setBrightness(60);
    light.turnOn();
    light.turnOff();
    expect(light.getBrightness()).toBe(60);
  });
}); 