import { describe, it, expect, beforeEach, vi } from "vitest";
import { Light } from "../src/Light.js";

// Мокаємо ICommunicator
const mockCommunicator = {
  publish: vi.fn(),
  subscribe: vi.fn(),
};

describe("Light methods", () => {
  let light: Light;

  beforeEach(() => {
    light = new Light("Test Light", mockCommunicator);
  });

  it("should be off by default", () => {
    // @ts-ignore
    expect(light.IsOn).toBe(false);
  });

  it("should turn on", () => {
    light.turnOn();
    // @ts-ignore
    expect(light.IsOn).toBe(true);
  });

  it("should turn off", () => {
    light.turnOn();
    light.turnOff();
    // @ts-ignore
    expect(light.IsOn).toBe(false);
  });

  it("should set brightness (TDD)", () => {
    light.setBrightness(80);
    expect(light.Brightness).toBe(80);
  });

  it("should set brightness to min value", () => {
    light.setBrightness(0);
    expect(light.Brightness).toBe(0);
  });

  it("should set brightness to max value", () => {
    light.setBrightness(100);
    expect(light.Brightness).toBe(100);
  });

  it("should not set brightness to negative value (optional)", () => {
    light.setBrightness(-10);
    expect(light.Brightness).not.toBe(-10);
  });

  it("should keep brightness after turnOn/turnOff", () => {
    light.setBrightness(60);
    light.turnOn();
    light.turnOff();
    expect(light.Brightness).toBe(60);
  });
});

describe("Light methods with communicator mock", () => {
  it("should turn on when receiving a 'turn on' message", () => {
    const light = new Light("light1", mockCommunicator);

    const message = Buffer.from(JSON.stringify({ cmd: "turn", arg: "on" }));
    light.handleMessage("/home/light1/action", message);

    expect(light["IsOn"]).toBe(true);
    expect(mockCommunicator.publish).toHaveBeenCalledWith("turnOn", "OK");
  });

  it("should set brightness correctly and publish OK", () => {
    const light = new Light("light1", mockCommunicator);

    const message = Buffer.from(
      JSON.stringify({ cmd: "setBrightness", arg: "75" }),
    );
    light.handleMessage("/home/light1/action", message);

    expect(light.Brightness).toBe(75);
    expect(mockCommunicator.publish).toHaveBeenCalledWith(
      "setBrightness",
      "OK",
    );
  });

  it("should not set brightness if value is invalid", () => {
    const light = new Light("light1", mockCommunicator);

    const message = Buffer.from(
      JSON.stringify({ cmd: "setBrightness", arg: "150" }),
    );
    light.handleMessage("/home/light1/action", message);

    expect(light.Brightness).not.toBe(150);
    expect(mockCommunicator.publish).toHaveBeenCalledWith(
      "setBrightness",
      "NO",
    );
  });
});
