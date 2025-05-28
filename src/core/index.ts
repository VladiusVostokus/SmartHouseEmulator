import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { sendLightCommand, sendThermostatCommand, publishStatus } from "./mqtt";
import type { LightAction, ThermostatAction } from "./types";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/light/:deviceId/:action", async (c) => {
  const { deviceId, action } = c.req.param();

  if (action !== "turnOn" && action !== "turnOff") {
    return c.text("Invalid action", 400);
  }

  sendLightCommand(deviceId, action as LightAction);
  
  publishStatus(deviceId, {
    status: action,
    deviceType: 'light',
    timestamp: new Date().toISOString()
  });

  return c.text(`Sent ${action} to ${deviceId}`);
});

app.post("/thermostat/:deviceId/:action", async (c) => {
  const { deviceId, action } = c.req.param();

  if (action !== "turnOn" && action !== "turnOff") {
    return c.text("Invalid action", 400);
  }

  sendThermostatCommand(deviceId, action as ThermostatAction);
  
  publishStatus(deviceId, {
    status: action,
    deviceType: 'thermostat',
    timestamp: new Date().toISOString()
  });

  return c.text(`Sent ${action} to thermostat ${deviceId}`);
});

app.post("/thermostat/:deviceId/setTemperature", async (c) => {
  const { deviceId } = c.req.param();
  const { temperature } = await c.req.json();

  sendThermostatCommand(deviceId, "setTemperature", temperature);
  
  publishStatus(deviceId, {
    status: "temperatureSet",
    temperature,
    deviceType: 'thermostat',
    timestamp: new Date().toISOString()
  });

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