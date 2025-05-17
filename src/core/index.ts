import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { sendLightCommand } from "./mqtt.js";
import { Processor } from "../patterns/Processor.js";
import { DeviceFactory } from "../patterns/deviceFactory.js";
import { devicesCollection } from "../devices/devicesCollection.js";

const app = new Hono();

// const communicator = new MQTTCommunicator(/* topics? */, brokerUrl);
// const factory = new DeviceFactory(devicesCollection);
// const processor = new Processor(communicator, factory);
// for each device you want to manage:
// processor.registerDevice("light", "1");
// processor.registerDevice("thermostat", "hallway");

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/light/:deviceId/:action", async (c) => {
  const { deviceId, action } = c.req.param();

  if (action !== "turnOn" && action !== "turnOff") {
    return c.text("Invalid action", 400);
  }

  sendLightCommand(deviceId, action as "turnOn" | "turnOff");
  return c.text(`Sent ${action} to ${deviceId}`);
});

app.post("/thermostat/:deviceId/:action", async (c) => {
  const { deviceId, action } = c.req.param();

  if (action !== "turnOn" && action !== "turnOff") {
    return c.text("Invalid action", 400);
  }

  // Тут буде логіка для термостата
  return c.text(`Sent ${action} to thermostat ${deviceId}`);
});

app.post("/thermostat/:deviceId/setTemperature", async (c) => {
  const { deviceId } = c.req.param();
  const { temperature } = await c.req.json();

  // Тут буде логіка для зміни температури
  return c.text(`Set temperature of thermostat ${deviceId} to ${temperature}`);
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
