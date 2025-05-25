// src/devices/LightDevice.test.ts
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import mqtt from "mqtt";
import { LightDevice } from "../src/devices/LightDevice.js";

// Mock the MQTT client and its methods
vi.mock("mqtt");

const mockMqttClient = {
  on: vi.fn(),
  subscribe: vi.fn(),
  publish: vi.fn(),
  end: vi.fn(),
};

describe("Light methods", () => {
  let light: Light;

  beforeEach(() => {
    // Clear all mocks and setup new client instance
    vi.clearAllMocks();
    (mqtt.connect as vi.Mock).mockReturnValue(mockMqttClient);
    device = new LightDevice(config);
  });

  afterEach(() => {
    if (device) {
      // Cleanup if needed
    }
  });

  it("connects to the MQTT broker with the provided URL", () => {
    expect(mqtt.connect).toHaveBeenCalledWith(config.brokerUrl);
  });

  it("subscribes to command topics upon connection", () => {
    // Simulate the 'connect' event
    const connectHandler = mockMqttClient.on.mock.calls.find(
      (args: any[]) => args[0] === "connect",
    )?.[1];
    connectHandler?.();

    const expectedTopics = [
      `/home/${config.deviceId}/turnLight`,
      `/home/${config.deviceId}/brightness`,
      `/home/${config.deviceId}/energyMode`,
    ];

    expectedTopics.forEach((topic) => {
      expect(mockMqttClient.subscribe).toHaveBeenCalledWith(
        topic,
        expect.any(Function),
      );
    });
  });

  it('handles "turnLight on" command correctly', () => {
    const topic = `/home/${config.deviceId}/turnLight`;
    const message = { action: "on" };

    (device as any).handleCommand(topic, message);

    expect((device as any).isOn).toBe(true);
    expect(mockMqttClient.publish).toHaveBeenCalledWith(
      `/home/${config.deviceId}/status`,
      JSON.stringify({ action: "status", on: true }),
    );
  });

  it('handles "turnLight off" command correctly', () => {
    const topic = `/home/${config.deviceId}/turnLight`;
    const message = { action: "off" };

    (device as any).handleCommand(topic, message);

    expect((device as any).isOn).toBe(false);
    expect(mockMqttClient.publish).toHaveBeenCalledWith(
      `/home/${config.deviceId}/status`,
      JSON.stringify({ action: "status", on: false }),
    );
  });

  it('logs warning for unknown action on "turnLight" topic', () => {
    const topic = `/home/${config.deviceId}/turnLight`;
    const message = { action: "toggle" };
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    (device as any).handleCommand(topic, message);

    expect(consoleWarn).toHaveBeenCalledWith("Unknown turn action", "toggle");
    consoleWarn.mockRestore();
  });

  it("updates brightness and publishes status", () => {
    const topic = `/home/${config.deviceId}/brightness`;
    const message = { brightness: 80 };

    (device as any).handleCommand(topic, message);

    expect((device as any).brightness).toBe(80);
    expect(mockMqttClient.publish).toHaveBeenCalledWith(
      `/home/${config.deviceId}/status`,
      JSON.stringify({ action: "brightnessChanged", brightness: 80 }),
    );
  });

  it("updates energy mode and publishes status", () => {
    const topic = `/home/${config.deviceId}/energyMode`;
    const message = { mode: "eco" };

    (device as any).handleCommand(topic, message);

    expect((device as any).energyMode).toBe("eco");
    expect(mockMqttClient.publish).toHaveBeenCalledWith(
      `/home/${config.deviceId}/status`,
      JSON.stringify({ action: "modeChanged", mode: "eco" }),
    );
  });
});

describe("Light methods with communicator mock", () => {
  it("should turn on when receiving a 'turn on' message", () => {
    const light = new Light("light1", mockCommunicator);

    const message = Buffer.from(JSON.stringify({ cmd: "turn", arg: "on" }));
    light.handleMessage("/home/light1/action", message);

    expect(light["isOn"]).toBe(true);
    expect(mockCommunicator.publish).toHaveBeenCalledWith("turnOn", "OK");
  });

  it("should set brightness correctly and publish OK", () => {
    const light = new Light("light1", mockCommunicator);

    const message = Buffer.from(
      JSON.stringify({ cmd: "setBrightness", arg: "75" }),
    );
    light.handleMessage("/home/light1/action", message);

    expect(light.getBrightness()).toBe(75);
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

    expect(light.getBrightness()).not.toBe(150);
    expect(mockCommunicator.publish).toHaveBeenCalledWith(
      "setBrightness",
      "NO",
    );
  });
});
