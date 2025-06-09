// src/server.ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { BackendCommunicator } from "./classes/BackendCommunicator";

export function startHttpServer() {
  const app = new Hono();
  const communicator = new BackendCommunicator("mqtt://localhost:1883");

  // HTTP endpoints → MQTT через BackendCommunicator
  app.post("/light/:deviceId/turnOn", (c) => {
    const { deviceId } = c.req.param();
    communicator.handleBackendMessage({
      deviceId,
      command: "turnOn"
    });
    return c.text(`Sent turnOn to ${deviceId}`);
  });

  app.post("/light/:deviceId/turnOff", (c) => {
    const { deviceId } = c.req.param();
    communicator.handleBackendMessage({
      deviceId,
      command: "turnOff"
    });
    return c.text(`Sent turnOff to ${deviceId}`);
  });

  app.post("/light/:deviceId/brightness", async (c) => {
    const { deviceId } = c.req.param();
    const { brightness } = await c.req.json();
    communicator.handleBackendMessage({
      deviceId,
      command: "brightness",
      value: brightness
    });
    return c.text(`Sent brightness=${brightness} to ${deviceId}`);
  });

  app.post("/light/:deviceId/energyMode", async (c) => {
    const { deviceId } = c.req.param();
    const { mode } = await c.req.json();
    communicator.handleBackendMessage({
      deviceId,
      command: "energyMode",
      value: mode
    });
    return c.text(`Sent mode=${mode} to ${deviceId}`);
  });

  // Додаємо ендпоінт для отримання статусу пристрою
  app.get("/light/:deviceId/status", (c) => {
    const { deviceId } = c.req.param();
    const status = communicator.getDeviceStatus(deviceId);
    return c.json({ deviceId, status });
  });

  // Launch the HTTP server
  serve({ fetch: app.fetch, port: 3000 }, (info) =>
    console.log(`➡️ HTTP server running at http://localhost:${info.port}`),
  );
}
