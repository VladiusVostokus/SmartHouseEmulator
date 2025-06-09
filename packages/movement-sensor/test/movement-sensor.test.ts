import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MovementSensor } from "../src/movement-sensor.js";
import type { MovementSensorConfig } from "../src/interfaces/movement-sensor-config.interface.js";
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
  const defaultConfig: MovementSensorConfig = {
    minIntervalMs: 100,
    maxIntervalMs: 200,
    detectionProbability: 1.0,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    mockPublishFn.mockClear();
    mockSubscribeFn.mockClear();
    sensor = new MovementSensor(sensorName, mockCommunicator, defaultConfig);
  });

  afterEach(() => {
    sensor.stopSimulation();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Power Control (turnOn/turnOff)", () => {
    it("turnOn() should turn the sensor on, publish status, and return true if previously off", () => {
      const result = sensor.turnOn();
      expect(result).toBe(true);
      expect(sensor.isOn).toBe(true);
      expect(mockPublishFn).toHaveBeenCalledWith("turnOn", "OK");
    });

    it("turnOn() should do nothing and return false if already on", () => {
      sensor.turnOn();
      mockPublishFn.mockClear();
      const result = sensor.turnOn();
      expect(result).toBe(false);
      expect(mockPublishFn).not.toHaveBeenCalled();
    });

    it("turnOff() should turn the sensor off, stop simulation, publish status, and return true if previously on", () => {
      sensor.turnOn();
      sensor.startSimulation();
      expect(sensor.isSimulating).toBe(true);
      mockPublishFn.mockClear();

      const result = sensor.turnOff();
      expect(result).toBe(true);
      expect(sensor.isOn).toBe(false);
      expect(sensor.isSimulating).toBe(false);
      expect(mockPublishFn).toHaveBeenCalledWith("turnOff", "OK");
    });

    it("turnOff() should do nothing and return false if already off", () => {
      const result = sensor.turnOff();
      expect(result).toBe(false);
      expect(mockPublishFn).not.toHaveBeenCalled();
    });
  });

  describe("Simulation Control (startSimulation/stopSimulation)", () => {
    it("startSimulation() should not start if sensor is off and return false", () => {
      const result = sensor.startSimulation();
      expect(result).toBe(false);
      expect(sensor.isSimulating).toBe(false);
    });

    it("startSimulation() should start if sensor is on, not already simulating, and return true", () => {
      sensor.turnOn();
      mockPublishFn.mockClear();

      const result = sensor.startSimulation();
      expect(result).toBe(true);
      expect(sensor.isSimulating).toBe(true);
    });

    it("startSimulation() should do nothing and return false if already simulating", () => {
      sensor.turnOn();
      sensor.startSimulation();
      const result = sensor.startSimulation();
      expect(result).toBe(false);
    });

    it("stopSimulation() should stop an active simulation and return true", () => {
      sensor.turnOn();
      sensor.startSimulation();
      expect(sensor.isSimulating).toBe(true);

      const result = sensor.stopSimulation();
      expect(result).toBe(true);
      expect(sensor.isSimulating).toBe(false);
    });

    it("stopSimulation() should do nothing and return false if not simulating", () => {
      const result = sensor.stopSimulation();
      expect(result).toBe(false);
    });
  });

  describe("Message Handling", () => {
    it("should turn sensor on via 'turn on' message", () => {
      sensor.handleMessage(
        "",
        Buffer.from(JSON.stringify({ cmd: "turn", arg: "on" })),
      );
      expect(sensor.isOn).toBe(true);
      expect(mockPublishFn).toHaveBeenCalledWith("turnOn", "OK");
    });

    it("should turn sensor off via 'turn off' message", () => {
      sensor.turnOn();
      mockPublishFn.mockClear();

      sensor.handleMessage(
        "",
        Buffer.from(JSON.stringify({ cmd: "turn", arg: "off" })),
      );
      expect(sensor.isOn).toBe(false);
      expect(sensor.isSimulating).toBe(false);
      expect(mockPublishFn).toHaveBeenCalledWith("turnOff", "OK");
    });

    it("should warn on unknown 'turn' argument", () => {
      sensor.handleMessage(
        "",
        Buffer.from(JSON.stringify({ cmd: "turn", arg: "blah" })),
      );
      expect(console.warn).toHaveBeenCalledWith(
        `[${sensorName}] Unknown 'turn' argument: blah`,
      );
    });

    it("should warn on unknown command", () => {
      sensor.handleMessage(
        "",
        Buffer.from(JSON.stringify({ cmd: "unknown", arg: "test" })),
      );
      expect(console.warn).toHaveBeenCalledWith(
        `[${sensorName}] Unknown command 'unknown' received on topic .`,
      );
    });

    it("should warn on invalid JSON message", () => {
      sensor.handleMessage("", Buffer.from("not valid json"));
      expect(console.warn).toHaveBeenCalledWith(
        `[${sensorName}] Invalid JSON on topic : not valid json`,
        expect.any(Error),
      );
    });
  });

  describe("Simulation Behavior", () => {
    it("should periodically publish 'motionDetected' when simulating and on", () => {
      sensor.turnOn();
      sensor.startSimulation();
      mockPublishFn.mockClear();

      vi.advanceTimersByTime(defaultConfig.maxIntervalMs! + 100);
      expect(mockPublishFn).toHaveBeenCalledWith("motionDetected", "DETECTED");

      mockPublishFn.mockClear();
      vi.advanceTimersByTime(defaultConfig.maxIntervalMs! + 100);
      expect(mockPublishFn).toHaveBeenCalledWith("motionDetected", "DETECTED");
    });

    it("should not publish 'motionDetected' if simulation is started but sensor is turned off", () => {
      sensor.turnOn();
      sensor.startSimulation();
      mockPublishFn.mockClear();

      sensor.turnOff();
      mockPublishFn.mockClear();

      vi.advanceTimersByTime(defaultConfig.maxIntervalMs! + 100);
      expect(mockPublishFn).not.toHaveBeenCalledWith(
        "motionDetected",
        "DETECTED",
      );
    });

    it("should not publish 'motionDetected' if simulation is stopped", () => {
      sensor.turnOn();
      sensor.startSimulation();
      mockPublishFn.mockClear();

      sensor.stopSimulation();

      vi.advanceTimersByTime(defaultConfig.maxIntervalMs! + 100);
      expect(mockPublishFn).not.toHaveBeenCalledWith(
        "motionDetected",
        "DETECTED",
      );
    });

    it("should respect detectionProbability (when probability is 0)", () => {
      const noDetectSensor = new MovementSensor(sensorName, mockCommunicator, {
        ...defaultConfig,
        detectionProbability: 0.0,
      });
      noDetectSensor.turnOn();
      noDetectSensor.startSimulation();
      mockPublishFn.mockClear();

      vi.advanceTimersByTime(defaultConfig.maxIntervalMs! + 100);
      expect(mockPublishFn).not.toHaveBeenCalledWith(
        "motionDetected",
        "DETECTED",
      );
    });
  });
});
