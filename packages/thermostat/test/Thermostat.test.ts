import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Thermostat } from "../src/Thermostat.js";

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
    thermostat.setTemperature(22);
    expect(thermostat.Temperature).toBe(22);
  });

  it("should set temperature to min value", () => {
    thermostat.setTemperature(16);
    expect(thermostat.Temperature).toBe(16);
  });

  it("should set temperature to max value", () => {
    thermostat.setTemperature(35);
    expect(thermostat.Temperature).toBe(35);
  });

  it("should not set temperature to negative value (optional)", () => {
    thermostat.setTemperature(-10);
    expect(thermostat.Temperature).not.toBe(-10);
  });

  it("should keep temperature after turnOn/turnOff", () => {
    thermostat.setTemperature(25);
    thermostat.turnOn();
    thermostat.turnOff();
    expect(thermostat.Temperature).toBe(25);
  });
});

describe("Themostat methods with communicator mock", () => {
  it("should turn on when receiving a 'turn on' message", () => {
    const thermo = new Thermostat("light1", mockCommunicator);

    const message = Buffer.from(JSON.stringify({ cmd: "turn", arg: "on" }));
    thermo.handleMessage("/home/thermo1/action", message);

    expect(thermo["isOn"]).toBe(true);
    expect(mockCommunicator.publish).toHaveBeenCalledWith("turnOn", "OK");
  });

  it("should set brightness correctly and publish OK", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);

    const message = Buffer.from(
      JSON.stringify({ cmd: "setTemperature", arg: "25" }),
    );
    thermo.handleMessage("/home/thermo1/action", message);

    expect(thermo.Temperature).toBe(25);
    expect(mockCommunicator.publish).toHaveBeenCalledWith(
      "setTemperature",
      "OK",
    );
  });

  it("should not set brightness if value is invalid", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);

    const message = Buffer.from(
      JSON.stringify({ cmd: "setTemperature", arg: "50" }),
    );
    thermo.handleMessage("/home/thermo1/action", message);

    expect(thermo.Temperature).not.toBe(50);
    expect(mockCommunicator.publish).toHaveBeenCalledWith(
      "setTemperature",
      "NO",
    );
  });
});

describe("Thermostat changing temperature depending in environment temprerature", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const randomMock = (min: number, max: number): number => {
      return max;
  }
 
  it("should change curTemperature after interval", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);
    const initialTemp = thermo.CurTemperature;
    const deltaTemp = 2;
    const deltaTime = 1000;

    thermo.emulateTemperatureChange(deltaTemp, deltaTime, randomMock);

    vi.advanceTimersByTime(1001);

    const changedTemp = thermo.CurTemperature;
    expect(changedTemp).not.toBe(initialTemp);
  });

  it("should change curTemperature if curTemperatur is to low or to hight", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);
    const deltaTemp = 100;
    const deltaTime = 1000;

    thermo.emulateTemperatureChange(deltaTemp, deltaTime, randomMock);

    vi.advanceTimersByTime(1001);

    const changedTemp = thermo.CurTemperature;
    const expectedTemp = thermo.Temperature;
    expect(changedTemp).toBe(expectedTemp);
  });

  it("should stop timer if simulation stopped", () => {
    const thermo = new Thermostat("thermo1", mockCommunicator);
    const deltaTemp = 1;
    const deltaTime = 1;

    thermo.emulateTemperatureChange(deltaTemp, deltaTime, randomMock);
    thermo.stopSimulation();
    expect(thermo.Timer).toBeNull();
  });
});