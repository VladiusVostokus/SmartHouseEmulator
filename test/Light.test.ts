import { describe, it, expect, beforeEach, vi } from "vitest";
import mqtt from "mqtt";
import { type LightConfig, LightDevice } from "../src/devices/Light.js";

// 1) Top‐level mock of 'mqtt' before we import anything that uses it:
vi.mock("mqtt", () => {
  // fakes for the MQTT client methods
  const fakeOn = vi.fn((event: string, cb: () => void) => {
    if (event === "connect") setImmediate(cb);
  });
  const fakeSubscribe = vi.fn();
  const fakePublish = vi.fn();

  // a fake client object
  const client = {
    on: fakeOn,
    subscribe: fakeSubscribe,
    publish: fakePublish,
  };

  return {
    // mqtt.connect() returns our fake client
    default: {
      connect: vi.fn(() => client),
    },
  };
});

describe("LightDevice", () => {
  let light: LightDevice;
  let clientMock: ReturnType<typeof mqtt.connect>;
  const cfg: LightConfig = { brokerUrl: "mqtt://test", deviceId: "test1" };

  beforeEach(() => {
    // clear all calls on our mocks
    vi.clearAllMocks();

    // instantiate the device—its ctor calls mqtt.connect()
    light = new LightDevice(cfg);

    // grab the fake client that our mock returned
    clientMock = (mqtt.connect as unknown as vi.Mock).mock.results[0].value;
  });

  it("connects and subscribes to its topics", () => {
    // mqtt.connect must have been called with the broker URL
    expect(mqtt.connect).toHaveBeenCalledWith(cfg.brokerUrl);

    // on('connect', ...) was registered
    expect(clientMock.on).toHaveBeenCalledWith("connect", expect.any(Function));

    // simulate the connect callback so subscriptions fire
    const connectCb = (clientMock.on as vi.Mock).mock.calls.find(
      (c) => c[0] === "connect",
    )![1];
    connectCb();

    // now subscribe() should have been called for each topic
    expect(clientMock.subscribe).toHaveBeenCalledWith(
      `/home/${cfg.deviceId}/turnLight`,
    );
    expect(clientMock.subscribe).toHaveBeenCalledWith(
      `/home/${cfg.deviceId}/brightness`,
    );
    expect(clientMock.subscribe).toHaveBeenCalledWith(
      `/home/${cfg.deviceId}/energyMode`,
    );
  });

  it("publishes status when turned on", () => {
    // directly invoke the private handler
    (light as any).handleMessage(`/home/${cfg.deviceId}/turnLight`, {
      action: "on",
    });

    expect(clientMock.publish).toHaveBeenCalledWith(
      `/home/${cfg.deviceId}/status`,
      JSON.stringify({ action: "status", on: true }),
    );
  });

  it("publishes brightnessChanged when brightness set", () => {
    (light as any).handleMessage(`/home/${cfg.deviceId}/brightness`, {
      brightness: 55,
    });

    expect(clientMock.publish).toHaveBeenCalledWith(
      `/home/${cfg.deviceId}/status`,
      JSON.stringify({ action: "brightnessChanged", brightness: 55 }),
    );
  });

  it("does not throw on unknown topic and does not publish", () => {
    expect(() =>
      (light as any).handleMessage(`/home/${cfg.deviceId}/foo`, { foo: 1 }),
    ).not.toThrow();

    // ensure we never published status for that unknown topic
    expect(clientMock.publish).not.toHaveBeenCalled();
  });
});
