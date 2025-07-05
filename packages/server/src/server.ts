import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { BackendCommunicator } from "./classes/backend-communicator.class";

const actionsArgs: Record<string, string> = {
  "setBrightness": "brightness",
  "setTemperature": "temperature",
  "energyMode": "mode",
  "turn":"mode",
};

export function startHttpServer() {
  const app = new Hono();
  const communicator = new BackendCommunicator("mqtt://localhost:1883");

  app.post("/home/:deviceId/:actionType", async (c) => {
    const { deviceId, actionType } = c.req.param();

    const deviceState = communicator.getDeviceStatus(deviceId);
    if (deviceState === "unknown") {
      throw new Error(`There are no device ${deviceId}`);
    }

    const actionArg = actionsArgs[actionType];

    if (!actionArg) {
      throw new Error(`Unknown action ${actionType}`);
    }
    const body = await c.req.json();
    const value = body[actionArg];
    if (!value) {
      throw new Error(`Unknown action argument for ${actionType}`);
    }

    communicator.handleBackendMessage({
      deviceId,
      command: actionType,
      value,
    });

    return c.text(
      `Sent ${actionType}${value ? `=${value}` : ""} to ${deviceId}`,
    );
  });

  app.post("/home/linkdevices", async(c) => {
    const body = await c.req.json();
    const lightId = body['light'];
    const sensorId = body['sensor'];
    const lightStatus = communicator.getDeviceStatus(lightId);
    if (lightStatus === "unknown") {
      throw new Error(`There are no device ${lightId} to link with sensor`);
    }
    const sensorStatus = communicator.getDeviceStatus(sensorId);
    if (sensorStatus === "unknown") {
      throw new Error(`There are no device ${sensorId} to link with light`);
    }
    communicator.createLink(sensorId, lightId);
    return c.json({ lightStatus, sensorStatus });
  });

  app.get("/home/:deviceId/status", (c) => {
    const { deviceId } = c.req.param();
    const status = communicator.getDeviceStatus(deviceId);
    return c.json({ deviceId, status });
  });

  // Launch the HTTP server
  serve({ fetch: app.fetch, port: 3000 }, (info) =>
    console.log(`➡️ HTTP server running at http://localhost:${info.port}`),
  );
}
