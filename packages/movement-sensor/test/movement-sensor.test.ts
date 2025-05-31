import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mock,
} from "vitest";
import { MovementSensor } from "../src/movement-sensor.js";
import type { ICommunicator } from "@smart-house/common";

const mockPublishFn = vi.fn();
const mockSubscribeFn = vi.fn();

const mockCommunicator: ICommunicator = {
  publish: mockPublishFn,
  subscribe: mockSubscribeFn,
};

describe("MovementSensor", () => {
  let sensor: MovementSensor;
  const sensorName = "TestSensor";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    mockPublishFn.mockClear();
    mockSubscribeFn.mockClear();

    sensor = new MovementSensor(sensorName, mockCommunicator);
  });

  afterEach(() => {
    sensor.stopSimulation();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should be off by default and turn on/off correctly, publishing status", () => {
    // @ts-ignore
    expect(sensor.isOn).toBe(false);

    sensor.turnOn();
    // @ts-ignore
    expect(sensor.isOn).toBe(true);
    expect(mockPublishFn).toHaveBeenCalledWith("turnOn", "OK");

    mockPublishFn.mockClear();
    sensor.turnOff();
    // @ts-ignore
    expect(sensor.isOn).toBe(false);
    expect(mockPublishFn).toHaveBeenCalledWith("turnOff", "OK");
  });

  it("should handle 'turn' commands from messages", () => {
    sensor.handleMessage(
      "",
      Buffer.from(JSON.stringify({ cmd: "turn", arg: "on" })),
    );
    // @ts-expect-error
    expect(sensor.isOn).toBe(true);
    expect(mockPublishFn).toHaveBeenCalledWith("turnOn", "OK");

    mockPublishFn.mockClear(); // Clear before next action
    sensor.handleMessage(
      "",
      Buffer.from(JSON.stringify({ cmd: "turn", arg: "off" })),
    );
    // @ts-ignore
    expect(sensor.isOn).toBe(false);
    expect(mockPublishFn).toHaveBeenCalledWith("turnOff", "OK");
  });

  it("should start simulation only if on, and stop simulation", () => {
    sensor.startSimulation();
    // @ts-ignore
    expect(sensor.simulationTimer).toBeNull();

    sensor.turnOn();
    mockPublishFn.mockClear();

    sensor.startSimulation();
    // @ts-ignore
    expect(sensor.simulationTimer).not.toBeNull();

    sensor.stopSimulation();
    // @ts-ignore
    expect(sensor.simulationTimer).toBeNull();
  });

  it("simulation should periodically attempt to detect motion and publish if sensor is on", () => {
    vi.spyOn(global.Math, "random").mockReturnValue(0.4);

    sensor.turnOn();
    mockPublishFn.mockClear();

    sensor.startSimulation();

    const detectionInterval = 15000;
    vi.advanceTimersByTime(detectionInterval + 100);

    expect(mockPublishFn).toHaveBeenCalledTimes(1);
    expect(mockPublishFn).toHaveBeenCalledWith("motionDetected", "DETECTED");

    mockPublishFn.mockClear();

    sensor.turnOff();
    expect(mockPublishFn).toHaveBeenCalledWith("turnOff", "OK");
    mockPublishFn.mockClear(); /

    vi.advanceTimersByTime(detectionInterval + 100);
    expect(mockPublishFn).not.toHaveBeenCalled();
  });

  it("should not publish motion if detectMotion is called when sensor is off", () => {
    // @ts-expect-error
    sensor.detectMotion();
    expect(mockPublishFn).not.toHaveBeenCalled();

    sensor.turnOn();
    mockPublishFn.mockClear();

    // @ts-expect-error
    sensor.detectMotion();
    expect(mockPublishFn).toHaveBeenCalledWith("motionDetected", "DETECTED");
  });
});
