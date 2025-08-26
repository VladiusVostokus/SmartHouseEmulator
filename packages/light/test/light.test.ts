import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ICommunicator, CommandPayload } from "@smart-house/common";
import { Light } from "../src/light";

const mockPublishFn = vi.fn();
const mockSubscribeFn = vi.fn();

const mockCommunicator: ICommunicator = {
  publish: mockPublishFn,
  subscribe: mockSubscribeFn,
};

describe("Light", () => {
  let light: Light;
  const lightName = "TestLight";

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockPublishFn.mockClear();
    mockSubscribeFn.mockClear();

    light = new Light(lightName, mockCommunicator);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should be off by default", () => {
      expect(light.isOn).toBe(false);
    });

    it("should have default brightness of 100", () => {
      expect(light.brightness).toBe(100);
    });

    it("should not be simulating by default ", () => {
      expect(light.isSimulating).toBe(false);
    });
  });

  describe("Power Control ", () => {
    it("turnOn() should turn the light on, publish basic status, and return true", () => {
      const result = light.turnOn();
      expect(result).toBe(true);
      expect(light.isOn).toBe(true);
      expect(mockPublishFn).toHaveBeenCalledOnce();
      expect(mockCommunicator.publish).toHaveBeenCalledWith(
            "turn",
            expect.objectContaining({
              status: "OK",
              value: "ON",
            }),
          );
    });

    it("turnOn() should do nothing and return false if already on", () => {
      light.turnOn();
      mockPublishFn.mockClear();
      const result = light.turnOn();
      expect(result).toBe(false);
      expect(mockPublishFn).not.toHaveBeenCalled();
    });

    it("turnOff() should turn the light off, publish basic status, and return true", () => {
      light.turnOn();
      mockPublishFn.mockClear();

      const result = light.turnOff();
      expect(result).toBe(true);
      expect(light.isOn).toBe(false);
      expect(mockPublishFn).toHaveBeenCalledOnce();
      expect(mockCommunicator.publish).toHaveBeenCalledWith(
            "turn",
            expect.objectContaining({
              status: "OK",
              value: "OFF",
            }),
          );
    });

    it("turnOff() should do nothing and return false if already off", () => {
      const result = light.turnOff();
      expect(result).toBe(false);
      expect(mockPublishFn).not.toHaveBeenCalled();
    });
  });

  describe("Brightness Control (setBrightness)", () => {
    it("should not set brightness if light is off, publish update, and return false", () => {
      expect(light.isOn).toBe(false);
      const result = light.setBrightness(50);
      expect(result).toBe(false);
      expect(light.brightness).toBe(100);
      expect(mockCommunicator.publish).toHaveBeenCalledWith(
            "setBrightness",
            expect.objectContaining({
              status: "IGNORED",
              value: 50,
            }),
          );
    });

    it("should set brightness if light is on, publish update, and return true", () => {
      light.turnOn();
      mockPublishFn.mockClear();

      const result = light.setBrightness(50);
      expect(result).toBe(true);
      expect(light.brightness).toBe(50);
      expect(mockCommunicator.publish).toHaveBeenCalledWith(
            "setBrightness",
            expect.objectContaining({
              status: "OK",
              value: 50,
            }),
          );
    });

    it("should not change brightness and return false if new level is same as current", () => {
      light.turnOn();
      light.setBrightness(70);
      mockPublishFn.mockClear();

      const result = light.setBrightness(70);
      expect(result).toBe(false);
      expect(light.brightness).toBe(70);
      expect(mockPublishFn).not.toHaveBeenCalled();
    });

    it.each([-1, 101])(
      "should not set brightness for invalid level %s, publish error, and return false",
      (invalidLevel) => {
        light.turnOn();
        const initialBrightness = light.brightness;
        mockPublishFn.mockClear();

        const result = light.setBrightness(invalidLevel);
        expect(result).toBe(false);
        expect(light.brightness).toBe(initialBrightness);
        expect(mockCommunicator.publish).toHaveBeenCalledWith(
            "setBrightness",
            expect.objectContaining({
              status: "ERROR",
              reason: "Brightness out of range",
              value: invalidLevel,
            }),
          );
      },
    );
  });

  describe("Message Handling (testing Light's command registration)", () => {
    it("should set brightness via 'setBrightness' message with 'level' property when on", () => {
      light.turnOn();
      mockPublishFn.mockClear();

      const message = Buffer.from(
        JSON.stringify({ cmd: "setBrightness", level: 60 } as CommandPayload),
      );
      light.handleMessage("/home/TestLight/action", message);

      expect(light.brightness).toBe(60);
      expect(mockCommunicator.publish).toHaveBeenCalledWith(
            "setBrightness",
            expect.objectContaining({
              status: "OK",
              value: 60,
            }),
          );
    });

    it("should set brightness via 'setBrightness' message with 'arg' property when on", () => {
      light.turnOn();
      mockPublishFn.mockClear();

      const message = Buffer.from(
        JSON.stringify({ cmd: "setBrightness", arg: "75" } as CommandPayload),
      );
      light.handleMessage("/home/TestLight/action", message);

      expect(light.brightness).toBe(75);
      expect(mockCommunicator.publish).toHaveBeenCalledWith(
            "setBrightness",
            expect.objectContaining({
              status: "OK",
              value: 75,
            }),
          );
    });

    it("should handle invalid 'setBrightness' message (e.g., non-numeric arg) and publish error", () => {
      light.turnOn();
      mockPublishFn.mockClear();

      const message = Buffer.from(
        JSON.stringify({ cmd: "setBrightness", arg: "abc" } as CommandPayload),
      );
      light.handleMessage("/home/TestLight/action", message);

      expect(light.brightness).toBe(100);
      expect(mockCommunicator.publish).toHaveBeenCalledWith(
            "setBrightness",
            expect.objectContaining({
              status: "ERROR",
              reason: "Invalid brightness level"
            }),
          );
    });

    it("should call publishStatusUpdate with error for invalid JSON message", () => {
      light.handleMessage("/home/TestLight/action", Buffer.from("not json"));
      expect(mockCommunicator.publish).toHaveBeenCalledWith(
            "handleMessage",
            expect.objectContaining({
              status: "ERROR",
              reason: "Invalid JSON received"
            }),
          );

        
    });

    it("should call publishStatusUpdate with error for message with no 'cmd'", () => {
      light.handleMessage(
        "/home/TestLight/action",
        Buffer.from(JSON.stringify({ arg: "on" })),
      );
      expect(mockCommunicator.publish).toHaveBeenCalledWith(
            "handleMessage",
            expect.objectContaining({
              status: "ERROR",
              reason: "Missing or invalid 'cmd' field"
            }),
          );
    });
  });

  describe("Simulation Control (inherited no-op)", () => {
    it("startSimulation() should return false", () => {
      light.turnOn();
      expect(light.startSimulation()).toBe(false);
      expect(light.isSimulating).toBe(false);
    });

    it("stopSimulation() should return false", () => {
      expect(light.stopSimulation()).toBe(false);
      expect(light.isSimulating).toBe(false);
    });
  });
});
