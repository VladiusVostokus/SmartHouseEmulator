import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { sendLightCommand } from "./mqtt.js";

const app = new Hono();

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

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
