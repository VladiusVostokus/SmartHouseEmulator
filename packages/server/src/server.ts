// src/server.ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import mqtt from "mqtt";

export function startHttpServer() {
  const app = new Hono();
  const client = mqtt.connect("mqtt://localhost:1883");

  // 1) When we connect, set up our wildcard subscription:
  client.on("connect", () => {
    console.log("✅ MQTT client connected");

    // Subscribe to everything under /home/{deviceId}/#
    // (# matches any number of levels)
    client.subscribe("/home/+/+", (err) => {
      if (err) console.error("❌ Subscribe error:", err);
      else console.log("✅ Subscribed to /home/+/+");
    });
  });

  // 2) Handle every incoming MQTT message:
  client.on("message", (topic, payload) => {
    console.log(`📥 MQTT message on ${topic}: ${payload.toString()}`);
    // <-- here you could push into some in-memory state,
    //     forward over WebSocket, trigger other business logic, etc.
  });

  // 3) Helper functions to publish commands:
  function publishTurn(deviceId: string, action: "on" | "off") {
    client.publish(`/home/${deviceId}/turnLight`, JSON.stringify({ action }));
  }
  function publishBrightness(deviceId: string, brightness: number) {
    client.publish(
      `/home/${deviceId}/brightness`,
      JSON.stringify({ brightness }),
    );
  }
  function publishEnergyMode(deviceId: string, mode: string) {
    client.publish(`/home/${deviceId}/energyMode`, JSON.stringify({ mode }));
  }

  // 4) HTTP endpoints → MQTT
  app.post("/light/:deviceId/turnOn", (c) => {
    const { deviceId } = c.req.param();
    publishTurn(deviceId, "on");
    return c.text(`Sent turnOn to ${deviceId}`);
  });

  app.post("/light/:deviceId/turnOff", (c) => {
    const { deviceId } = c.req.param();
    publishTurn(deviceId, "off");
    return c.text(`Sent turnOff to ${deviceId}`);
  });

  app.post("/light/:deviceId/brightness", async (c) => {
    const { deviceId } = c.req.param();
    const { brightness } = await c.req.json();
    publishBrightness(deviceId, brightness);
    return c.text(`Sent brightness=${brightness} to ${deviceId}`);
  });

  app.post("/light/:deviceId/energyMode", async (c) => {
    const { deviceId } = c.req.param();
    const { mode } = await c.req.json();
    publishEnergyMode(deviceId, mode);
    return c.text(`Sent mode=${mode} to ${deviceId}`);
  });

  // 5) Launch the HTTP server
  serve({ fetch: app.fetch, port: 3000 }, (info) =>
    console.log(`➡️ HTTP server running at http://localhost:${info.port}`),
  );
}
