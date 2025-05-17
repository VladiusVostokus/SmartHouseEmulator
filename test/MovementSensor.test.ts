import { describe, it, expect, beforeEach, vi } from "vitest";
import { MovementSensor } from "../src/devices/MovementSensor.js";

// Mock ICommunicator
const mockCommunicator = {
  publish: vi.fn(),
  subscribe: vi.fn(),
};

describe("MovementSensor", () => {
  let sensor: MovementSensor;

  beforeEach(() => {
    sensor = new MovementSensor("Test Sensor", mockCommunicator);
  });

  it("should be off by default", () => {
    // @ts-expect-error: Accessing private isOn for test assertion
    expect(sensor.isOn).toBe(false);
  });

  it("should turn on", () => {
    sensor.turnOn();
    // @ts-expect-error: Accessing private isOn for test assertion
    expect(sensor.isOn).toBe(true);
  });

  it("should turn off", () => {
    sensor.turnOn();
    sensor.turnOff();
    // @ts-expect-error: Accessing private isOn for test assertion
    expect(sensor.isOn).toBe(false);
  });
});
