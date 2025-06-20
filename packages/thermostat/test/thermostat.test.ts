import { describe, it, expect, beforeEach, vi } from "vitest";
import { Thermostat } from "../src/thermostat.js";

// Мокаємо ICommunicator
const mockCommunicator = {
  publish: vi.fn(),
  subscribe: vi.fn(),
};

describe("Thermostat methods", () => {
  let thermostat: Thermostat;

  beforeEach(() => {
    thermostat = new Thermostat("Test Thermostat", mockCommunicator);
  });

  it("should be off by default", () => {
    // @ts-ignore
    expect(thermostat.isOn).toBe(false);
  });

  it("should turn on", () => {
    thermostat.turnOn();
    // @ts-ignore
    expect(thermostat.isOn).toBe(true);
  });

  it("should turn off", () => {
    thermostat.turnOn();
    thermostat.turnOff();
    // @ts-ignore
    expect(thermostat.isOn).toBe(false);
  });

  it("should set temperature (TDD)", () => {
    thermostat.turnOn();
    thermostat.setTemperature(22);
    expect(thermostat.temperature).toBe(22);
  });

  it("should set temperature to min value", () => {
    thermostat.turnOn();
    thermostat.setTemperature(16);
    expect(thermostat.temperature).toBe(16);
  });

  it("should set temperature to max value", () => {
    thermostat.turnOn();
    thermostat.setTemperature(35);
    expect(thermostat.temperature).toBe(35);
  });

  it("should not set temperature to negative value (optional)", () => {
    thermostat.turnOn();
    thermostat.setTemperature(-10);
    expect(thermostat.temperature).not.toBe(-10);
  });

  it("should keep temperature after turnOn/turnOff", () => {
    thermostat.turnOn();
    thermostat.setTemperature(25);
    thermostat.turnOff();
    expect(thermostat.temperature).toBe(25);
  });
});

describe("Themostat methods with communicator mock", () => {
  it("should turn on when receiving a 'turn on' message", () => {
    const thermo = new Thermostat("light1", mockCommunicator);
    thermo.turnOn();

    const message = Buffer.from(JSON.stringify({ cmd: "turn", arg: "on" }));
    thermo.handleMessage("/home/thermo1/action", message);

    expect(thermo.isOn).toBe(true);
    expect(mockCommunicator.publish).toHaveBeenCalledWith("turnOn", "OK");
  });

  it("should set temperature correctly and publish OK", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);
    thermo.turnOn();

    const message = Buffer.from(
      JSON.stringify({ cmd: "setTemperature", arg: "25" }),
    );
    thermo.handleMessage("/home/thermo1/action", message);

    expect(thermo.temperature).toBe(25);
    expect(mockCommunicator.publish).toHaveBeenCalledWith(
      "setTemperature",
      "OK",
    );
  });

  it("should not set temperature if value is invalid", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);
    thermo.turnOn();

    const message = Buffer.from(
      JSON.stringify({ cmd: "setTemperature", arg: "50" }),
    );
    thermo.handleMessage("/home/thermo1/action", message);

    expect(thermo.temperature).not.toBe(50);
    expect(mockCommunicator.publish).toHaveBeenCalledWith(
      "setTemperature",
      "ERROR",
    );
  });
});

describe("Thermostat changing temperature depending in environment temprerature", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const randomMock = (min: number, max: number): number => {
    return max;
  };

  it("should change curTemperature after interval", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);
    thermo.turnOn();
    const initialTemp = thermo.curTemperature;
    const deltaTemp = 2;
    const deltaTime = 1000;

    thermo.emulateTemperatureChange(deltaTemp, deltaTime, randomMock);

    vi.advanceTimersByTime(1001);

    const changedTemp = thermo.curTemperature;
    expect(changedTemp).not.toBe(initialTemp);
  });

  it("should change curTemperature if curTemperatur is to low or to hight", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);
    thermo.turnOn();
    const deltaTemp = 100;
    const deltaTime = 1000;

    thermo.emulateTemperatureChange(deltaTemp, deltaTime, randomMock);

    vi.advanceTimersByTime(1001);

    const changedTemp = thermo.curTemperature;
    const expectedTemp = thermo.temperature;
    expect(changedTemp).toBe(expectedTemp);
  });

  it("should stop timer if simulation stopped", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);
    thermo.turnOn();
    const deltaTemp = 1;
    const deltaTime = 1;

    thermo.emulateTemperatureChange(deltaTemp, deltaTime, randomMock);
    thermo.stopSimulation();
    expect(thermo.timer).toBeNull();
  });

  it("should continue simulation after reboot", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);
    thermo.turnOn();
    const deltaTemp = 1;
    const deltaTime = 1;

    thermo.emulateTemperatureChange(deltaTemp, deltaTime, randomMock);
    thermo.turnOff();
    expect(thermo.timer).toBeNull();
    thermo.turnOn();
    expect(thermo.timer).not.toBeNull();
  });

  it("shouldn't start simulation if device turned off", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);
    const deltaTemp = 1;
    const deltaTime = 1;

    thermo.emulateTemperatureChange(deltaTemp, deltaTime, randomMock);
    expect(thermo.timer).toBeNull();
  });
});
