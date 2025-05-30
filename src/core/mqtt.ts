// src/mqtt.ts
import mqtt from "mqtt";

const brokerUrl = "mqtt://localhost:1883"; // or your Docker IP / hostname
const client = mqtt.connect(brokerUrl);

client.on("connect", () => {
  console.log("✅ Connected to Mosquitto MQTT broker");

  // Subscribe to motion topics
  client.subscribe("home/+/motion", (err) => {
    if (err) console.error("MQTT subscribe error:", err);
  });
});

client.on("message", (topic, message) => {
  console.log(`📩 MQTT message on ${topic}:`, message.toString());

  // You could parse and act here, or trigger your app logic
});

// Example publisher function
export function sendLightCommand(
  deviceId: string,
  action: "turnOn" | "turnOff",
) {
  const payload = JSON.stringify({
    action,
    timestamp: new Date().toISOString(),
  });
  const topic = `home/${deviceId}/light/command`;
  client.publish(topic, payload, { qos: 1 });
  console.log(`🚀 Sent command to ${topic}: ${payload}`);
}
