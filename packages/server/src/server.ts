import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { BackendCommunicator } from "./classes/backend-communicator.class";

export function startHttpServer() {
  const app = new Hono();
  const communicator = new BackendCommunicator("mqtt://localhost:1883");

  app.post("/home/:deviceId/:actionType", async (c) => {
    const { deviceId, actionType } = c.req.param();
    let value;

    const deviceState = communicator.getDeviceStatus(deviceId);
    if (deviceState === "unknown") {
      throw new Error(`There are no device ${deviceId}`);
    }

    if (
      ["setBrightness", "setTemperature", "energyMode"].includes(actionType)
    ) {
      const body = await c.req.json();
      value =
        body[
          actionType === "setBrightness"
            ? "brightness"
            : actionType === "setTemperature"
              ? "temperature"
              : "mode"
        ];
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
